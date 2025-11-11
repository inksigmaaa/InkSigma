import { db } from '@/db';
import { comment } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = params;

    await db.delete(comment).where(eq(comment.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
