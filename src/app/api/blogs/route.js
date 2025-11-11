import { db } from '@/db';
import { blog, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest');

    let query = db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        image: blog.image,
        categories: blog.categories,
        createdAt: blog.createdAt,
        author: {
          name: user.name,
          avatar: user.image,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(eq(blog.published, true))
      .orderBy(desc(blog.createdAt));

    if (latest === 'true') {
      query = query.limit(1);
    }

    const blogs = await query;

    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}
