// Script to fix existing publications by adding creators as admin members
import { db } from "./config/database.js";
import { publication, publicationMember } from "./models/schema.js";
import { eq, and } from "drizzle-orm";

async function fixPublicationMembers() {
  try {
    console.log('🔧 Checking publications without admin members...');
    
    // Get all publications
    const publications = await db.select().from(publication);
    
    console.log(`Found ${publications.length} publications to check`);
    
    let fixedCount = 0;
    
    for (const pub of publications) {
      // Check if the creator is already a member
      const existingMember = await db
        .select()
        .from(publicationMember)
        .where(
          and(
            eq(publicationMember.publicationId, pub.id),
            eq(publicationMember.userId, pub.userId)
          )
        );
      
      if (existingMember.length === 0) {
        console.log(`🔧 Adding creator as admin for publication: "${pub.name}" (ID: ${pub.id})`);
        
        // Add creator as admin member
        await db
          .insert(publicationMember)
          .values({
            publicationId: pub.id,
            userId: pub.userId,
            role: "admin",
            invitedBy: pub.userId, // Self-invited as creator
          });
        
        fixedCount++;
      } else {
        console.log(`✅ Publication "${pub.name}" already has creator as member`);
      }
    }
    
    console.log('\n--- Summary ---');
    console.log(`Total publications: ${publications.length}`);
    console.log(`Fixed publications: ${fixedCount}`);
    console.log(`Already correct: ${publications.length - fixedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n✅ All publications now have their creators as admin members!');
    }
    
  } catch (error) {
    console.error('Error fixing publication members:', error);
  }
}

// Run the fix
fixPublicationMembers().then(() => {
  console.log('Publication member fix completed');
  process.exit(0);
}).catch((error) => {
  console.error('Failed to fix publication members:', error);
  process.exit(1);
});