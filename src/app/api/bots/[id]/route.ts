import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// GET /api/bots/[id] - Get a specific bot
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bot = await db.bot.findUnique({
      where: { id },
      include: {
        messageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    return NextResponse.json(bot);
  } catch (error) {
    console.error('Error fetching bot:', error);
    return NextResponse.json({ error: 'Failed to fetch bot' }, { status: 500 });
  }
}

// PUT /api/bots/[id] - Update a bot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, instructions, status, openRouterKey, model } = body;

    const bot = await db.bot.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(instructions !== undefined && { instructions }),
        ...(status !== undefined && { status }),
        ...(openRouterKey !== undefined && { openRouterKey }),
        ...(model !== undefined && { model }),
      },
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error('Error updating bot:', error);
    return NextResponse.json({ error: 'Failed to update bot' }, { status: 500 });
  }
}

// DELETE /api/bots/[id] - Delete a bot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.bot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 });
  }
}
