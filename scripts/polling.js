const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SERVER_PORT = process.env.PORT || 3001;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

// Log to AppData for debugging
const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
const logDir = path.join(appData, 'TeleBridge');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'poller.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

log(`--- Iniciando Poller (Puerto: ${SERVER_PORT}) ---`);

// Store last update ID for each bot
const lastUpdateIds = new Map();

// Track which bots are using webhook vs polling
const webhookBots = new Set();

async function fetchBots() {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/bots`, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Status ${res.statusCode}`));
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function callTelegramGet(token, method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));
    https.get(url.toString(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function postToWebhook(token, update) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(update);
    const req = http.request(`${SERVER_URL}/api/telegram/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => resolve(responseData));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function checkWebhookActive(token) {
  try {
    const info = await callTelegramGet(token, 'getWebhookInfo');
    return !!(info.ok && info.result && info.result.url && info.result.url.length > 0);
  } catch (e) {
    return false;
  }
}

async function poll() {
  try {
    const bots = await fetchBots();
    if (!bots || !Array.isArray(bots)) {
      log('No se pudieron obtener los bots o el formato es incorrecto');
      setTimeout(poll, 3000);
      return;
    }

    for (const bot of bots) {
      if (!bot.token) continue;

      // Only poll bots that are connected
      if (bot.status !== 'connected') continue;

      // Check if this bot has a webhook registered — if so, skip it
      // We check every 30 seconds per bot to avoid spamming Telegram
      const hasWebhook = await checkWebhookActive(bot.token);
      if (hasWebhook) {
        if (!webhookBots.has(bot.token)) {
          log(`[${bot.name}] Webhook activo detectado. Usando modo webhook (no polling).`);
          webhookBots.add(bot.token);
        }
        continue; // Telegram will push messages via webhook — no polling needed
      }

      // No webhook → use polling
      if (webhookBots.has(bot.token)) {
        log(`[${bot.name}] Webhook removido. Cambiando a modo polling.`);
        webhookBots.delete(bot.token);
      }

      const offset = lastUpdateIds.get(bot.token) || null;
      try {
        const updatesRes = await callTelegramGet(bot.token, 'getUpdates', {
          timeout: 5,
          limit: 10,
          ...(offset && { offset }),
        });

        if (updatesRes.ok && updatesRes.result && updatesRes.result.length > 0) {
          for (const update of updatesRes.result) {
            lastUpdateIds.set(bot.token, update.update_id + 1);
            log(`[${bot.name}] Mensaje recibido (ID: ${update.update_id}). Enviando a servidor...`);
            const response = await postToWebhook(bot.token, update);
            log(`[${bot.name}] Servidor respondió: ${String(response).substring(0, 80)}`);
          }
        } else if (!updatesRes.ok) {
          log(`[${bot.name}] Telegram Error: ${updatesRes.description}`);
        }
      } catch (err) {
        log(`[${bot.name}] Error de conexión Telegram: ${err.message}`);
      }
    }
  } catch (err) {
    log(`Error en ciclo de polling: ${err.message}`);
  }

  setTimeout(poll, 2000);
}

poll();
