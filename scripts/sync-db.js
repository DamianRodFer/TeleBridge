const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
const teleBridgeDir = path.join(userDataPath, 'TeleBridge');
const dbDir = path.join(teleBridgeDir, 'db');
const dbPath = path.join(dbDir, 'custom.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbUrl = `file:${dbPath}`;
console.log(`Syncing database at: ${dbUrl}`);

try {
  execSync(`npx prisma db push`, {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
  console.log('Database synced successfully!');
} catch (error) {
  console.error('Failed to sync database:', error.message);
  process.exit(1);
}
