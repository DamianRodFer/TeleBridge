import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Fetch original bot
    const bot = await db.bot.findUnique({
      where: { id },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // 2. Create new bot with copied data
    const newBot = await db.bot.create({
      data: {
        name: `${bot.name} (Copy)`,
        token: `${bot.token}_copy_${Math.random().toString(36).substring(7)}`, // Needs a unique token
        username: bot.username ? `${bot.username}_copy` : null,
        instructions: bot.instructions,
        status: 'disconnected',
      },
    });

    return NextResponse.json(newBot);
  } catch (error) {
    console.error('Error duplicating bot:', error);
    return NextResponse.json({ error: 'Failed to duplicate bot' }, { status: 500 });
  }
}
