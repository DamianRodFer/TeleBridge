import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


// GET /api/bots/[id]/messages - Get message logs for a bot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const direction = searchParams.get('direction'); // incoming, outgoing

    const where: Record<string, unknown> = { botId: id };
    if (direction) {
      where.direction = direction;
    }

    const [messages, total] = await Promise.all([
      db.messageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.messageLog.count({ where }),
    ]);

    return NextResponse.json({ messages, total, limit, offset });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/bots/[id]/messages - Create a message log entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { direction, sender, content, apiStatus, error } = body;

    if (!direction || !content) {
      return NextResponse.json({ error: 'Direction and content are required' }, { status: 400 });
    }

    const message = await db.messageLog.create({
      data: {
        botId: id,
        direction,
        sender: sender || null,
        content,
        apiStatus: apiStatus || null,
        error: error || null,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

// DELETE /api/bots/[id]/messages - Clear all messages for a bot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.messageLog.deleteMany({ where: { botId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing messages:', error);
    return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 });
  }
}
