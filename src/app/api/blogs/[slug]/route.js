import { db } from '@/db';
import { blog, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { slug } = params;

    const blogPost = await db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
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
      .where(eq(blog.slug, slug))
      .limit(1);

    if (!blogPost || blogPost.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blogPost[0]);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}
