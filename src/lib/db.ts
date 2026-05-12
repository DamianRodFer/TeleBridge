import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let dbPath = '';

// Check if we have an explicit DATABASE_URL from main.js
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
  // Use the one provided by Electron
  dbPath = process.env.DATABASE_URL.replace('file:', '');
} else {
  // Fallback for when running via 'npm run dev' directly without Electron
  const userDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')
  const teleBridgeDir = path.join(userDataPath, 'TeleBridge')
  const dbDir = path.join(teleBridgeDir, 'db')
  dbPath = path.join(dbDir, 'custom.db')
}

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Log for debugging
console.log(`[TeleBridge] Permanent Database: ${dbPath}`);

const isProduction = process.env.NODE_ENV === 'production';

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
    log: isProduction ? ['error'] : ['query', 'error'],
  })

if (!isProduction) globalForPrisma.prisma = db
