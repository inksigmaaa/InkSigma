import 'dotenv/config';
import { db } from './config/database.js';
import { blog, publication } from './models/schema.js';
import { isNull, eq } from 'drizzle-orm';

/**
 * This script handles data migration for existing blogs without publicationId
 * Run this BEFORE running drizzle-kit push/migrate
 */
async function migrateExistingData() {
  console.log('🔄 Migrating existing blog data...\n');

  try {
    // Check for blogs without publicationId
    const orphanedBlogs = await db
      .select()
      .from(blog)
      .where(isNull(blog.publicationId));

    if (orphanedBlogs.length === 0) {
      console.log('✅ No orphaned blogs found. All blogs already have publicationId.');
      return true;
    }

    console.log(`📊 Found ${orphanedBlogs.length} blog(s) without publicationId\n`);

    let assigned = 0;
    let deleted = 0;

    for (const blogItem of orphanedBlogs) {
      // Try to find author's first publication
      const [authorPub] = await db
        .select()
        .from(publication)
        .where(eq(publication.userId, blogItem.authorId))
        .limit(1);

      if (authorPub) {
        // Assign blog to author's publication
        await db
          .update(blog)
          .set({ publicationId: authorPub.id })
          .where(eq(blog.id, blogItem.id));
        
        console.log(`✅ Assigned blog "${blogItem.title}" (ID: ${blogItem.id}) to publication "${authorPub.name}" (ID: ${authorPub.id})`);
        assigned++;
      } else {
        // Delete blog if author has no publication
        await db
          .delete(blog)
          .where(eq(blog.id, blogItem.id));
        
        console.log(`❌ Deleted blog "${blogItem.title}" (ID: ${blogItem.id}) - author has no publication`);
        deleted++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   - Blogs assigned to publications: ${assigned}`);
    console.log(`   - Blogs deleted (no publication): ${deleted}`);
    console.log(`   - Total processed: ${orphanedBlogs.length}`);
    
    console.log('\n✅ Data migration completed successfully!');
    console.log('👉 Now run: npm run db:push');
    
    return true;

  } catch (error) {
    console.error('❌ Data migration failed:', error.message);
    console.error(error);
    return false;
  }
}

migrateExistingData().then(success => {
  process.exit(success ? 0 : 1);
});
