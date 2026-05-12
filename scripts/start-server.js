/**
 * Cross-platform start script for TeleBridge
 * Starts the standalone Next.js server (works on Windows, macOS, Linux)
 */
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const ROOT = path.resolve(__dirname, '..')
const serverPath = path.join(ROOT, '.next', 'standalone', 'server.js')

if (!fs.existsSync(serverPath)) {
  console.error('[TeleBridge] Build not found!')
  console.error('  Run: npm run build')
  process.exit(1)
}

// Ensure database directory exists
const dbDir = path.join(ROOT, 'db')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const dbFile = path.join(dbDir, 'custom.db')
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, '')
}

console.log('[TeleBridge] Starting server...')
console.log('[TeleBridge] Server path:', serverPath)
console.log('[TeleBridge] Database:', dbFile)

const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: '3001',
  HOSTNAME: 'localhost',
  DATABASE_URL: `file:${dbFile}`,
}

const child = spawn('node', [serverPath], {
  cwd: path.dirname(serverPath),
  env,
  stdio: 'inherit',
})

child.on('error', (err) => {
  console.error('[TeleBridge] Failed to start server:', err.message)
  console.error('Make sure you ran "npm run build" first.')
  process.exit(1)
})

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[TeleBridge] Server exited with code ${code}`)
  }
  process.exit(code || 0)
})

const poller = spawn('node', [path.join(ROOT, 'scripts', 'polling.js')], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
})

poller.on('error', (err) => {
  console.error('[TeleBridge] Failed to start poller:', err.message)
})

// Graceful shutdown
process.on('SIGINT', () => {
  child.kill('SIGINT')
  poller.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  child.kill('SIGTERM')
  poller.kill('SIGTERM')
  process.exit(0)
})

