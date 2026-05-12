const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const { spawn, exec, execFile } = require('child_process')
const http = require('http')
const fs = require('fs')

// ──────────────────────────────────────────────
// Settings persistence
// ──────────────────────────────────────────────
function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function loadSettings() {
  try {
    const p = getSettingsPath()
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'))
    }
  } catch (e) {
    console.warn('[TeleBridge] Could not load settings:', e.message)
  }
  return {}
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf8')
  } catch (e) {
    console.warn('[TeleBridge] Could not save settings:', e.message)
  }
}

let mainWindow = null
let splashWindow = null
let serverProcess = null
let pollerProcess = null
let ngrokTunnel = null
const SERVER_PORT = 3001
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`

// ──────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────
function getProjectRoot() {
  // In development: project root is parent of electron/
  // In packaged app: use process.resourcesPath
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'standalone')
  }
  return path.join(__dirname, '..')
}

function getDbPath() {
  const appData = app.getPath('userData')
  const dbPath = path.join(appData, 'db', 'custom.db')
  return dbPath
}

function getServerPath() {
  const root = getProjectRoot()
  // Try standalone server.js first
  const standaloneServer = path.join(root, '.next', 'standalone', 'server.js')
  if (fs.existsSync(standaloneServer)) return standaloneServer

  // Try root-level server.js (copied during build)
  const rootServer = path.join(root, 'server.js')
  if (fs.existsSync(rootServer)) return rootServer

  // If in dev, we return a special flag or just handle it in startServer
  if (!app.isPackaged) return 'DEV_MODE'

  return null
}

function getServerCwd() {
  const serverPath = getServerPath()
  if (serverPath) return path.dirname(serverPath)
  return getProjectRoot()
}

// ──────────────────────────────────────────────
// Ensure database exists
// ──────────────────────────────────────────────
function ensureDatabase() {
  const dbPath = getDbPath()
  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
    console.log('[TeleBridge] Created database directory:', dbDir)
  }

  if (!fs.existsSync(dbPath)) {
    // Create empty SQLite database file
    fs.writeFileSync(dbPath, '')
    console.log('[TeleBridge] Created empty database file:', dbPath)
  }

  return dbPath
}

// ──────────────────────────────────────────────
// Splash Screen
// ──────────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 420,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'splash-preload.js'),
    },
  })

  splashWindow.loadFile(path.join(__dirname, 'splash.html'))

  splashWindow.once('ready-to-show', () => {
    splashWindow.show()
  })

  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

// ──────────────────────────────────────────────
// Main Window
// ──────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    frame: true,
    backgroundColor: '#09090b',
    show: false,
    paintWhenInitiallyHidden: true, // Help with white flash
    icon: getAppIcon(),
    title: 'TeleBridge',
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Clear cache to ensure latest build is loaded
  mainWindow.webContents.session.clearCache().then(() => {
    mainWindow.loadURL(SERVER_URL)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
    // Close splash after main window is shown
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ──────────────────────────────────────────────
// Window Controls (IPC)
// ──────────────────────────────────────────────
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close()
})

// ──────────────────────────────────────────────
// Settings IPC
// ──────────────────────────────────────────────
ipcMain.handle('settings:get', () => {
  return loadSettings()
})

ipcMain.handle('settings:save', (event, newSettings) => {
  const current = loadSettings()
  const merged = { ...current, ...newSettings }
  saveSettings(merged)
  return merged
})

ipcMain.handle('ngrok:get-url', () => {
  return ngrokTunnel ? ngrokTunnel.url() : null
})

ipcMain.handle('ngrok:restart', async () => {
  await stopNgrok()
  const settings = loadSettings()
  const publicUrl = await startNgrokTunnel(settings.ngrokAuthtoken)
  if (publicUrl) await registerWebhooksForAllBots(publicUrl)
  return publicUrl
})

// ──────────────────────────────────────────────
// App Icon
// ──────────────────────────────────────────────
function getAppIcon() {
  const iconDir = path.join(__dirname, '..', 'build')
  if (process.platform === 'win32') {
    const icoPath = path.join(iconDir, 'icon.ico')
    if (fs.existsSync(icoPath)) return icoPath
  } else if (process.platform === 'darwin') {
    const icnsPath = path.join(iconDir, 'icon.icns')
    if (fs.existsSync(icnsPath)) return icnsPath
  }
  const pngPath = path.join(iconDir, 'icon.png')
  if (fs.existsSync(pngPath)) return pngPath
  return undefined
}

// ──────────────────────────────────────────────
// Server Management
// ──────────────────────────────────────────────
function updateSplashStatus(msg) {
  console.log('[TeleBridge]', msg)
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('load-status', msg)
  }
}

function startServer() {
  return new Promise(async (resolve, reject) => {
    const projectRoot = getProjectRoot()

    // Ensure database exists and is initialized
    const dbPath = getDbPath()
    ensureDatabase()
    await initializeDatabase()
    
    updateSplashStatus('Database ready')

    // Find server entry point
    const serverPath = getServerPath()

    if (!serverPath) {
      const err = 'Build not found. Run: npm run build'
      updateSplashStatus('Error: ' + err)
      reject(new Error(err))
      return
    }

    const cwdPath = getServerCwd()
    updateSplashStatus('Starting server...')

    const env = {
      ...process.env,
      PORT: String(SERVER_PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      DATABASE_URL: `file:${dbPath}`,
    }

    console.log('[TeleBridge] Server path:', serverPath)
    console.log('[TeleBridge] CWD:', cwdPath)
    console.log('[TeleBridge] DB path:', dbPath)
    console.log('[TeleBridge] DATABASE_URL:', env.DATABASE_URL)

    if (serverPath === 'DEV_MODE') {
      updateSplashStatus('Starting dev server...')
      const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
      serverProcess = spawn(cmd, ['next', 'dev', '-p', String(SERVER_PORT)], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        windowsHide: true,
        shell: true,
      })
    } else {
      serverProcess = spawn('node', [serverPath], {
        cwd: cwdPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        windowsHide: true,
        shell: process.platform === 'win32',
      })
    }

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString()
      console.log('[Server]', msg.trim())
    })

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString()
      console.log('[Server stderr]', msg.trim())
    })

    serverProcess.on('error', (err) => {
      console.error('[TeleBridge] Server process error:', err)
      updateSplashStatus('Server error: ' + err.message)
      reject(err)
    })

    serverProcess.on('exit', (code) => {
      console.log(`[Server] Exited with code ${code}`)
      if (code !== 0 && code !== null) {
        const errorMsg = `Server exited with code ${code}`
        updateSplashStatus('Error: ' + errorMsg)
      }
      serverProcess = null
    })

    // Start Poller
    const pollerScript = app.isPackaged ? path.join(__dirname, '..', 'scripts', 'polling.js') : path.join(projectRoot, 'scripts', 'polling.js');
    if (fs.existsSync(pollerScript)) {
      pollerProcess = spawn('node', [pollerScript], {
        cwd: path.dirname(pollerScript),
        env,
        windowsHide: true,
        shell: process.platform === 'win32'
      });
      pollerProcess.stdout.on('data', d => console.log(d.toString().trim()));
      pollerProcess.stderr.on('data', d => console.error(d.toString().trim()));
    } else {
      console.log('[TeleBridge] Poller script not found at', pollerScript);
    }

    resolve()
  })
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const projectRoot = getProjectRoot()
    const dbPath = getDbPath()
    const dbDir = path.dirname(dbPath)
    
    // Check if DB is already initialized (simple check: if file size > 0, we assume yes)
    // Actually, prisma db push is safe to run multiple times, it just ensures schema matches.
    
    updateSplashStatus('Initializing database schema...')
    
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    const env = {
      ...process.env,
      DATABASE_URL: `file:${dbPath}`,
    }
    
    const prismaProcess = spawn(cmd, ['prisma', 'db', 'push', '--accept-data-loss'], {
      cwd: projectRoot,
      env,
      windowsHide: true,
      shell: true,
    })
    
    prismaProcess.stdout.on('data', (d) => console.log('[Prisma]', d.toString().trim()))
    prismaProcess.stderr.on('data', (d) => console.error('[Prisma Error]', d.toString().trim()))
    
    prismaProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('[Prisma] Database schema initialized successfully')
        resolve()
      } else {
        console.error(`[Prisma] Failed with code ${code}`)
        // Don't reject, just warn. Maybe it already works or is in dev mode.
        resolve()
      }
    })
  })
}

// ──────────────────────────────────────────────
// ngrok tunnel management
// ──────────────────────────────────────────────
async function startNgrokTunnel(authtoken) {
  if (!authtoken) {
    console.log('[TeleBridge] No ngrok authtoken configured — skipping tunnel.')
    return null
  }
  try {
    updateSplashStatus('Creando túnel público (ngrok)...')
    const ngrok = require('@ngrok/ngrok')
    ngrokTunnel = await ngrok.connect({
      addr: SERVER_PORT,
      authtoken,
      proto: 'http',
    })
    const publicUrl = ngrokTunnel.url()
    console.log('[TeleBridge] ✅ ngrok URL:', publicUrl)
    return publicUrl
  } catch (err) {
    console.warn('[TeleBridge] ngrok tunnel failed:', err.message)
    return null
  }
}

async function registerWebhooksForAllBots(publicUrl) {
  if (!publicUrl) return
  try {
    // Wait a moment for the server to be fully ready
    await new Promise(r => setTimeout(r, 2000))
    const response = await fetch(`${SERVER_URL}/api/bots`)
    if (!response.ok) return
    const bots = await response.json()
    console.log(`[TeleBridge] Registering webhooks for ${bots.length} bot(s)...`)
    for (const bot of bots) {
      try {
        const webhookUrl = `${publicUrl}/api/telegram/${bot.token}`
        const tgRes = await fetch(`https://api.telegram.org/bot${bot.token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
          signal: AbortSignal.timeout(10000),
        })
        const tgData = await tgRes.json()
        if (tgData.ok) {
          console.log(`[TeleBridge] ✅ Webhook set for bot @${bot.username || bot.name}: ${webhookUrl}`)
          // Update status to connected
          await fetch(`${SERVER_URL}/api/bots/${bot.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'connected' }),
          }).catch(() => {})
        } else {
          console.warn(`[TeleBridge] ⚠️ Webhook failed for ${bot.name}:`, tgData.description)
        }
      } catch (e) {
        console.warn(`[TeleBridge] Error setting webhook for ${bot.name}:`, e.message)
      }
    }
  } catch (err) {
    console.warn('[TeleBridge] Could not auto-register webhooks:', err.message)
  }
}

async function stopNgrok() {
  if (ngrokTunnel) {
    try {
      await ngrokTunnel.close()
    } catch(e) {}
    ngrokTunnel = null
  }
}

function stopServer() {
  stopNgrok().catch(() => {})

  if (serverProcess) {
    console.log('[TeleBridge] Stopping server...')
    try {
      if (process.platform === 'win32') {
        // On Windows, kill the process tree
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true,
          shell: true,
        })
      } else {
        serverProcess.kill('SIGTERM')
      }
    } catch (e) {
      // Ignore
    }
    serverProcess = null
  }

  if (pollerProcess) {
    console.log('[TeleBridge] Stopping poller...')
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(pollerProcess.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true, shell: true })
      } else {
        pollerProcess.kill('SIGTERM')
      }
    } catch(e) {}
    pollerProcess = null;
  }
}

// ──────────────────────────────────────────────
// Check if server is responding
// ──────────────────────────────────────────────
function checkServerReady(maxRetries = 120, intervalMs = 300) {
  return new Promise((resolve, reject) => {
    let retries = 0

    function check() {
      const req = http.get(SERVER_URL, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          resolve(true)
        } else {
          retry()
        }
      })

      req.on('error', () => {
        retry()
      })

      req.setTimeout(800, () => {
        req.destroy()
        retry()
      })
    }

    function retry() {
      retries++
      if (retries >= maxRetries) {
        reject(new Error('Server did not start in time'))
        return
      }

      // Update splash status periodically
      if (retries === 5) {
        updateSplashStatus('Initializing database...')
      } else if (retries === 20) {
        updateSplashStatus('Loading application...')
      } else if (retries === 50) {
        updateSplashStatus('Almost ready...')
      }

      setTimeout(check, intervalMs)
    }

    check()
  })
}

// ──────────────────────────────────────────────
// Kill any existing server on port 3000 (Windows)
// ──────────────────────────────────────────────
function killExistingServer() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`netstat -ano | findstr :${SERVER_PORT} | findstr LISTENING`, { windowsHide: true }, (err, stdout) => {
        if (!err && stdout) {
          const lines = stdout.trim().split('\n')
          for (const line of lines) {
            const parts = line.trim().split(/\s+/)
            const pid = parts[parts.length - 1]
            if (pid && pid !== '0') {
              console.log(`[TeleBridge] Killing existing server on port ${SERVER_PORT} (PID: ${pid})`)
              exec(`taskkill /F /PID ${pid}`, { windowsHide: true }, () => { })
            }
          }
        }
        resolve() // no delay needed
      })
    } else {
      resolve()
    }
  })
}

// ──────────────────────────────────────────────
// App Lifecycle
// ──────────────────────────────────────────────
app.whenReady().then(async () => {
  // Show splash screen immediately (no black screen!)
  createSplashWindow()

  try {
    // Kill any leftover server process
    await killExistingServer()

    // Start the Next.js server
    await startServer()

    // Wait for server to be ready (with retry)
    // 120 retries * 500ms = 60 seconds
    await checkServerReady(120, 500)

    updateSplashStatus('Ready!')

    // Open main window immediately (no artificial delay)
    createMainWindow()

    // Start ngrok tunnel in background (using saved authtoken) and auto-register webhooks
    const settings = loadSettings()
    startNgrokTunnel(settings.ngrokAuthtoken).then(publicUrl => {
      if (publicUrl) {
        registerWebhooksForAllBots(publicUrl)
      }
    })
  } catch (err) {
    console.error('[TeleBridge] Startup failed:', err.message)
    updateSplashStatus('Error: ' + err.message + '. Check console for details.')

    // Keep splash visible so user sees the error
    // They can close it manually
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopServer()
  app.quit()
})

app.on('before-quit', () => {
  stopServer()
})

// Security: prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== SERVER_URL) {
      event.preventDefault()
    }
  })
})
