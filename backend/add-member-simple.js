// Add member to publication
import 'dotenv/config';
import { db } from './config/database.js';
import { publicationMember } from './models/schema.js';

async function addMember() {
  try {
    const [newMember] = await db
      .insert(publicationMember)
      .values({
        publicationId: 9,
        userId: '0S8WmErILx6j8791lu3rVS6cz9l0pJpb',
        role: 'editor',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log('✅ Member added successfully:', newMember);
  } catch (error) {
    console.error('Error adding member:', error);
  } finally {
    process.exit(0);
  }
}

addMember();
