import { db } from '@/db';
import { comment, user } from '@/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId');

    if (!blogId) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }

    const comments = await db
      .select({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        author: {
          name: user.name,
          avatar: user.image,
        },
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.blogId, blogId))
      .orderBy(desc(comment.createdAt));

    // Organize comments with replies
    const topLevelComments = comments.filter(c => !c.parentId);
    const organizedComments = topLevelComments.map(topComment => ({
      ...topComment,
      replies: comments.filter(c => c.parentId === topComment.id.toString()),
    }));

    return NextResponse.json(organizedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    // Return empty array instead of error for better UX
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { content, blogId, authorId, parentId } = body;

    if (!content || !blogId || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newComment = await db
      .insert(comment)
      .values({
        content,
        blogId,
        authorId,
        parentId: parentId || null,
      })
      .returning();

    return NextResponse.json(newComment[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
