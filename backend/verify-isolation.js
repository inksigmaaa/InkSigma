import 'dotenv/config';
import { db } from './config/database.js';
import { blog, publication, publicationMember } from './models/schema.js';
import { eq, isNull } from 'drizzle-orm';

async function verifyIsolation() {
  console.log('🔍 Verifying article isolation...\n');

  try {
    // Check 1: Verify no blogs without publicationId
    const orphanedBlogs = await db
      .select()
      .from(blog)
      .where(isNull(blog.publicationId));

    if (orphanedBlogs.length > 0) {
      console.log('❌ Found orphaned blogs without publicationId:', orphanedBlogs.length);
      console.log('   These blogs need to be assigned to a publication');
      return false;
    } else {
      console.log('✅ All blogs have a publicationId');
    }

    // Check 2: Get all publications
    const publications = await db.select().from(publication);
    console.log(`\n📊 Found ${publications.length} publication(s)\n`);

    // Check 3: Show blog distribution per publication
    for (const pub of publications) {
      const pubBlogs = await db
        .select()
        .from(blog)
        .where(eq(blog.publicationId, pub.id));

      const members = await db
        .select()
        .from(publicationMember)
        .where(eq(publicationMember.publicationId, pub.id));

      console.log(`📚 Publication: ${pub.name} (ID: ${pub.id})`);
      console.log(`   - Owner: ${pub.userId}`);
      console.log(`   - Members: ${members.length}`);
      console.log(`   - Blogs: ${pubBlogs.length}`);
      
      if (pubBlogs.length > 0) {
        console.log(`   - Blog authors: ${[...new Set(pubBlogs.map(b => b.authorId))].join(', ')}`);
      }
      console.log('');
    }

    // Check 4: Verify all blog authors are members or owners
    let isolationIssues = 0;
    for (const pub of publications) {
      const pubBlogs = await db
        .select()
        .from(blog)
        .where(eq(blog.publicationId, pub.id));

      const members = await db
        .select()
        .from(publicationMember)
        .where(eq(publicationMember.publicationId, pub.id));

      const memberIds = new Set([pub.userId, ...members.map(m => m.userId)]);

      for (const blogItem of pubBlogs) {
        if (!memberIds.has(blogItem.authorId)) {
          console.log(`⚠️  Blog ${blogItem.id} in publication ${pub.name} has author ${blogItem.authorId} who is not a member`);
          isolationIssues++;
        }
      }
    }

    if (isolationIssues === 0) {
      console.log('✅ All blog authors are members or owners of their publications\n');
    } else {
      console.log(`❌ Found ${isolationIssues} isolation issue(s)\n`);
      return false;
    }

    console.log('🎉 Article isolation is working correctly!');
    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error);
    return false;
  }
}

verifyIsolation().then(success => {
  process.exit(success ? 0 : 1);
});
