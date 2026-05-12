import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { callTelegram } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────────
// ALL free models available on OpenRouter — cycled best-first
// Last updated: 2025-05 (fetched from /api/v1/models)
const FREE_MODELS = [
  // Top-tier large models (best quality first)
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'minimax/minimax-m2.5:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'openai/gpt-oss-20b:free',
  'arcee-ai/trinity-large-thinking:free',
  'inclusionai/ring-2.6-1t:free',
  'qwen/qwen3-coder:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'poolside/laguna-m.1:free',
  'poolside/laguna-xs.2:free',
  'z-ai/glm-4.5-air:free',
  // Smaller/fallback models
  'meta-llama/llama-3.2-3b-instruct:free',
  'liquid/lfm-2.5-1.2b-thinking:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'baidu/cobuddy:free',
  'baidu/qianfan-ocr-fast:free',
];


// Helper: call OpenRouter API with automatic free-model fallback carousel
async function callOpenRouter(apiKey: string, prompt: string, instructions?: string) {
  if (!apiKey) throw new Error('OpenRouter API key is missing');

  const messages: any[] = [];
  if (instructions) messages.push({ role: 'system', content: instructions });
  messages.push({ role: 'user', content: prompt });

  let attempt = 0;
  const MAX_ATTEMPTS = FREE_MODELS.length * 3; // 3 full rotations max

  while (attempt < MAX_ATTEMPTS) {
    const model = FREE_MODELS[attempt % FREE_MODELS.length];
    attempt++;
    console.log(`[OpenRouter] Intentando modelo (intento ${attempt}/${MAX_ATTEMPTS}): ${model}`);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://telebridge.app',
          'X-Title': 'TeleBridge',
        },
        body: JSON.stringify({ model, messages }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429 || res.status === 503 || res.status === 403 || res.status === 401 || res.status === 529) {
        console.warn(`[OpenRouter] Modelo ${model} no disponible (${res.status}), probando siguiente...`);
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn(`[OpenRouter] Error en ${model}:`, res.status, errorData);
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) {
        console.log(`[OpenRouter] ✅ Respuesta de ${model} en intento ${attempt}`);
        return reply;
      }
    } catch (e: any) {
      console.warn(`[OpenRouter] Excepción en ${model}:`, e.message);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  throw new Error(`No se pudo obtener respuesta de ningún modelo tras ${MAX_ATTEMPTS} intentos.`);
}


// ──────────────────────────────────────────────────────────────────────────────
// POST Webhook Handler
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const body = await request.json();
    const { message } = body;

    if (!message || !message.text || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const userText = message.text;

    // Find bot in DB
    const bot = await db.bot.findUnique({ where: { token } });
    if (!bot) {
      console.error(`[Webhook] Bot no encontrado para el token: ${token.split(':')[0]}:***`);
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    console.log(`[Webhook] Mensaje de ${message.from?.username || chatId}: ${userText}`);
    
    // Process message with AI
    try {
      const openRouterKey = bot.openRouterKey || process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        await callTelegram(token, 'sendMessage', { chat_id: chatId, text: '❌ Error: API Key de OpenRouter no configurada.' });
        return NextResponse.json({ ok: true });
      }

      const aiResponse = await callOpenRouter(
        openRouterKey,
        userText,
        bot.instructions || undefined
      );

      // Send back to Telegram with fallback for Markdown
      console.log(`[Webhook] Respondiendo a ${chatId}...`);
      const tgRes = await callTelegram(token, 'sendMessage', {
        chat_id: chatId,
        text: aiResponse,
        parse_mode: 'Markdown'
      });

      // Fallback if Markdown fails
      if (!tgRes.ok && tgRes.error && (tgRes.error.includes('parse') || tgRes.error.includes('Markdown'))) {
        console.warn('[Webhook] Fallback a texto plano por error de Markdown');
        await callTelegram(token, 'sendMessage', {
          chat_id: chatId,
          text: aiResponse
        });
      }

      // Log incoming message
      await db.messageLog.create({
        data: {
          botId: bot.id,
          chatId,
          direction: 'incoming',
          sender: message.from?.username || chatId,
          content: userText,
          apiStatus: 'success'
        }
      });

      // Log outgoing message
      await db.messageLog.create({
        data: {
          botId: bot.id,
          chatId,
          direction: 'outgoing',
          sender: 'bot',
          content: aiResponse,
          apiStatus: 'success'
        }
      });

    } catch (aiError: any) {
      console.error('[Webhook] AI Error:', aiError);
      await callTelegram(token, 'sendMessage', {
        chat_id: chatId,
        text: `❌ Error al procesar con IA: ${aiError.message}`
      });
      
      await db.messageLog.create({
        data: {
          botId: bot.id,
          chatId,
          direction: 'outgoing',
          sender: 'bot',
          content: `❌ Error al procesar con IA: ${aiError.message}`,
          apiStatus: 'error',
          error: aiError.message
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Webhook] Global Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
