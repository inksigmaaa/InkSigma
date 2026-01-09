// Check publication members
import 'dotenv/config';
import { db } from './config/database.js';
import { publicationMember, publication, user } from './models/schema.js';
import { eq } from 'drizzle-orm';

async function checkMembers() {
  try {
    console.log('\n=== PUBLICATION MEMBERS ===');
    const members = await db
      .select({
        id: publicationMember.id,
        publicationId: publicationMember.publicationId,
        userId: publicationMember.userId,
        role: publicationMember.role,
        userName: user.name,
        pubName: publication.name
      })
      .from(publicationMember)
      .leftJoin(user, eq(publicationMember.userId, user.id))
      .leftJoin(publication, eq(publicationMember.publicationId, publication.id));

    if (members.length === 0) {
      console.log('No members found');
    } else {
      members.forEach(m => {
        console.log(`User: ${m.userName} (${m.userId})`);
        console.log(`Publication: ${m.pubName} (ID: ${m.publicationId})`);
        console.log(`Role: ${m.role}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkMembers();
