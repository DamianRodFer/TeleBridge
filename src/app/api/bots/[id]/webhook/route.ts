import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// GET /api/bots/[id]/webhook - Get webhook info for a bot
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bot = await db.bot.findUnique({ where: { id } });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Get current webhook info from Telegram
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${bot.token}/getWebhookInfo`,
      { signal: AbortSignal.timeout(10000) }
    );
    const webhookData = await webhookResponse.json();

    if (!webhookData.ok) {
      return NextResponse.json({
        error: 'Failed to get webhook info',
        details: webhookData.description,
      }, { status: 400 });
    }

    return NextResponse.json({
      webhookInfo: webhookData.result,
    });
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return NextResponse.json({ error: 'Failed to get webhook info' }, { status: 500 });
  }
}

// POST /api/bots/[id]/webhook - Set webhook for a bot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { webhookUrl, secretToken } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
    }

    const bot = await db.bot.findUnique({ where: { id } });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Set webhook via Telegram API
    const setWebhookParams: Record<string, string> = {
      url: webhookUrl,
    };
    if (secretToken) {
      setWebhookParams.secret_token = secretToken;
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${bot.token}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setWebhookParams),
        signal: AbortSignal.timeout(10000),
      }
    );
    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      return NextResponse.json({
        error: 'Failed to set webhook',
        details: telegramData.description,
      }, { status: 400 });
    }

    // Update bot status
    await db.bot.update({
      where: { id },
      data: { status: 'connected' },
    });

    return NextResponse.json({
      success: true,
      description: telegramData.description,
      webhookInfo: telegramData.result,
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    return NextResponse.json({ error: 'Failed to set webhook' }, { status: 500 });
  }
}

// DELETE /api/bots/[id]/webhook - Remove webhook for a bot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bot = await db.bot.findUnique({ where: { id } });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Delete webhook via Telegram API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${bot.token}/deleteWebhook`,
      { signal: AbortSignal.timeout(10000) }
    );
    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      return NextResponse.json({
        error: 'Failed to delete webhook',
        details: telegramData.description,
      }, { status: 400 });
    }

    await db.bot.update({
      where: { id },
      data: { status: 'disconnected' },
    });

    return NextResponse.json({
      success: true,
      description: telegramData.description,
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
