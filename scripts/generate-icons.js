// Script to generate ICO and ICNS icons from the PNG
const fs = require('fs')
const path = require('path')
const toIco = require('to-ico')

async function generateIcons() {
  const buildDir = path.join(__dirname, '..', 'build')
  const iconPng = path.join(buildDir, 'icon.png')
  
  if (!fs.existsSync(iconPng)) {
    console.error('icon.png not found in build/ directory')
    process.exit(1)
  }

  const pngBuffer = fs.readFileSync(iconPng)

  // Generate ICO for Windows
  try {
    const ico = await toIco([pngBuffer])
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico)
    console.log('✓ Generated icon.ico')
  } catch (err) {
    console.error('Failed to generate ICO:', err.message)
    // Copy PNG as ICO fallback - electron-builder handles this
    fs.copyFileSync(iconPng, path.join(buildDir, 'icon.ico'))
    console.log('✓ Copied icon.png as icon.ico (fallback)')
  }

  // For ICNS (macOS), copy PNG - electron-builder handles conversion
  fs.copyFileSync(iconPng, path.join(buildDir, 'icon.icns'))
  console.log('✓ Copied icon.png as icon.icns')

  console.log('\nIcons generated in build/ directory:')
  console.log('  - icon.png  (1024x1024 - Linux)')
  console.log('  - icon.ico  (Windows)')
  console.log('  - icon.icns (macOS)')
}

generateIcons().catch(console.error)
