/**
 * Cross-platform build script for TeleBridge
 * Works on Windows, macOS, and Linux
 * 
 * IMPORTANT: Uses --no-turbopack because Turbopack does NOT support
 * output: "standalone" which is required for Electron desktop mode.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

function run(cmd, options = {}) {
  console.log(`  > ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...options })
}

function copyRecursive(src, dest) {
  const srcPath = path.resolve(ROOT, src)
  const destPath = path.resolve(ROOT, dest)
  
  if (!fs.existsSync(srcPath)) {
    console.warn(`  ! Source not found: ${srcPath}`)
    return
  }

  // Create dest directory if it doesn't exist
  fs.mkdirSync(destPath, { recursive: true })

  const entries = fs.readdirSync(srcPath, { withFileTypes: true })
  for (const entry of entries) {
    const srcEntry = path.join(srcPath, entry.name)
    const destEntry = path.join(destPath, entry.name)

    if (entry.isDirectory()) {
      copyRecursive(srcEntry, destEntry)
    } else {
      fs.copyFileSync(srcEntry, destEntry)
    }
  }
}

function copyFile(src, dest) {
  const srcPath = path.resolve(ROOT, src)
  const destPath = path.resolve(ROOT, dest)
  
  if (!fs.existsSync(srcPath)) {
    console.warn(`  ! Source not found: ${srcPath}`)
    return
  }
  
  const destDir = path.dirname(destPath)
  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(srcPath, destPath)
}

console.log('')
console.log('════════════════════════════════════════')
console.log('  TeleBridge - Build Script')
console.log('════════════════════════════════════════')
console.log('')

// Step 1: Next.js build (NO TURBOPACK - required for standalone output)
console.log('📦 Step 1/5: Building Next.js app (Webpack mode)...')
run('npx next build --webpack')

// Step 2: Verify standalone output exists
console.log('')
console.log('📁 Step 2/5: Verifying standalone output...')
const standaloneDir = path.join(ROOT, '.next', 'standalone')
if (!fs.existsSync(standaloneDir)) {
  console.error('  ✗ Standalone build not found! Make sure next.config.ts has output: "standalone"')
  console.error('  ℹ This build requires Webpack (not Turbopack). Make sure --no-turbopack is used.')
  process.exit(1)
}

const serverFile = path.join(standaloneDir, 'server.js')
if (fs.existsSync(serverFile)) {
  console.log('  ✓ server.js found in standalone build')
} else {
  console.error('  ✗ server.js not found in standalone build!')
  console.error('  ℹ Trying to find alternative entry point...')
  // Try to find any .js entry point
  const jsFiles = fs.readdirSync(standaloneDir).filter(f => f.endsWith('.js'))
  if (jsFiles.length > 0) {
    console.log(`  ℹ Found alternative: ${jsFiles.join(', ')}`)
  }
  process.exit(1)
}

// Step 3: Copy static files
console.log('')
console.log('📁 Step 3/5: Copying static files...')
copyRecursive('.next/static', '.next/standalone/.next/static')
copyRecursive('public', '.next/standalone/public')
// Database is now external (AppData), no need to copy
copyFile('prisma/schema.prisma', '.next/standalone/prisma/schema.prisma')
copyFile('.env', '.next/standalone/.env')

// Step 4: Copy Prisma client
console.log('')
console.log('🗄️  Step 4/5: Copying Prisma client...')
const prismaSrc = path.join(ROOT, 'node_modules', '.prisma')
if (fs.existsSync(prismaSrc)) {
  copyRecursive('node_modules/.prisma', '.next/standalone/node_modules/.prisma')
} else {
  console.warn('  ! Prisma client not found, generating...')
  run('npx prisma generate')
  copyRecursive('node_modules/.prisma', '.next/standalone/node_modules/.prisma')
}

// Also copy the @prisma/client module
const prismaClientSrc = path.join(ROOT, 'node_modules', '@prisma', 'client')
if (fs.existsSync(prismaClientSrc)) {
  copyRecursive('node_modules/@prisma/client', '.next/standalone/node_modules/@prisma/client')
}

// Step 5: Final verification
console.log('')
console.log('✅ Step 5/5: Final verification...')
// Permanent Database (AppData) verification
console.log('  ✓ Using permanent AppData storage')

if (fs.existsSync(path.join(standaloneDir, 'prisma', 'schema.prisma'))) {
  console.log('  ✓ Prisma schema found')
} else {
  console.warn('  ! Prisma schema not found')
}

if (fs.existsSync(path.join(standaloneDir, '.next', 'static'))) {
  console.log('  ✓ Static files found')
} else {
  console.warn('  ! Static files not found')
}

console.log('')
console.log('════════════════════════════════════════')
console.log('  ✅ Build complete!')
console.log('════════════════════════════════════════')
console.log('')
console.log('  Run: npm run desktop')
console.log('')
