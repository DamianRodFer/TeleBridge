export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { callTelegram } from '@/lib/telegram';

import { unstable_noStore as noStore } from 'next/cache';

// GET /api/bots - List all bots
export async function GET() {
  noStore();
  try {
    const bots = await db.bot.findMany({
      include: { _count: { select: { messageLogs: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    console.log(`[API] GET /api/bots - Found ${bots.length} bots in DB`);
    return NextResponse.json(bots);
  } catch (error: any) {
    console.error('[TeleBridge] Error fetching bots:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los bots: ' + error.message }, { status: 500 });
  }
}

// POST /api/bots - Create a new bot
export async function POST(request: NextRequest) {
  let body: any;
  
  // 1. Parse request body safely
  try {
    const text = await request.text();
    if (!text) throw new Error('Cuerpo de petición vacío');
    body = JSON.parse(text);
  } catch (e: any) {
    return NextResponse.json({ error: 'Error al procesar los datos enviados: ' + e.message }, { status: 400 });
  }

  const { name, token, skipVerification } = body;

  // 2. Basic validation
  if (!name || !token) {
    return NextResponse.json({ error: 'El nombre y el Token son obligatorios' }, { status: 400 });
  }

  const cleanToken = token.trim();
  console.log(`[TeleBridge] Intentando conectar bot: ${name} (${cleanToken.split(':')[0]}:***)`);

  // 3. Check for existing bot
  try {
    const existing = await db.bot.findUnique({ where: { token: cleanToken } });
    if (existing) {
      // Return the existing bot so UI can select it instead of crashing
      return NextResponse.json({ ...existing, _count: { messageLogs: 0 }, warning: 'Este bot ya estaba registrado' }, { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'Error de base de datos al verificar el bot: ' + e.message }, { status: 500 });
  }

  // 4. Try to verify with Telegram (non-fatal: if it fails, save anyway as disconnected)
  let botUsername: string | null = null;
  let botStatus = 'disconnected';
  let verificationWarning: string | null = null;

  if (!skipVerification) {
    try {
      const tgResponse = await callTelegram(cleanToken, 'getMe');
      if (tgResponse.ok) {
        botUsername = tgResponse.result.username;
        botStatus = 'connected';
        console.log(`[TeleBridge] Token verificado: @${botUsername}`);
      } else {
        verificationWarning = `Token no reconocido por Telegram: ${tgResponse.error}. Bot guardado como desconectado.`;
        console.warn('[TeleBridge] Telegram rechazó el token:', tgResponse.error);
      }
    } catch (e: any) {
      verificationWarning = 'No se pudo contactar con Telegram. Bot guardado como desconectado.';
      console.warn('[TeleBridge] Error de red al verificar con Telegram:', e.message);
    }
  }

  // 5. Create in Database (always, regardless of verification result)
  let bot;
  try {
    bot = await db.bot.create({
      data: {
        name,
        token: cleanToken,
        username: botUsername,
        instructions: null,
        openRouterKey: null,
        model: 'openai/gpt-3.5-turbo',
        status: botStatus,
      },
    });
  } catch (e: any) {
    console.error('[TeleBridge] Error al guardar en DB:', e);
    return NextResponse.json({ error: 'No se pudo guardar el bot en tu ordenador: ' + e.message }, { status: 500 });
  }

  return NextResponse.json({ 
    ...bot, 
    _count: { messageLogs: 0 },
    warning: verificationWarning 
  }, { status: 201 });
}
