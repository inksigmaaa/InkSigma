// Test script to add a member to a publication
// Usage: node test-add-member.js <publicationId> <userId> <role>
// Example: node test-add-member.js 1 "user123" "author"

import 'dotenv/config';
import { db } from './config/database.js';
import { publicationMember, publication, user } from './models/schema.js';
import { eq, and } from 'drizzle-orm';

const [publicationId, userId, role = 'author'] = process.argv.slice(2);

if (!publicationId || !userId) {
  console.error('Usage: node test-add-member.js <publicationId> <userId> <role>');
  console.error('Example: node test-add-member.js 1 "user123" "author"');
  process.exit(1);
}

async function addMember() {
  try {
    // Check if publication exists
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      console.error(`Publication with ID ${publicationId} not found`);
      process.exit(1);
    }

    console.log(`Found publication: ${pub.name}`);

    // Check if user exists
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (!userRecord) {
      console.error(`User with ID ${userId} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${userRecord.name} (${userRecord.email})`);

    // Check if already a member
    const [existing] = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, parseInt(publicationId)),
          eq(publicationMember.userId, userId)
        )
      );

    if (existing) {
      console.log(`User is already a member with role: ${existing.role}`);
      process.exit(0);
    }

    // Add member
    const [newMember] = await db
      .insert(publicationMember)
      .values({
        publicationId: parseInt(publicationId),
        userId,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log(`✅ Successfully added ${userRecord.name} as ${role} to ${pub.name}`);
    console.log('Member details:', newMember);
  } catch (error) {
    console.error('Error adding member:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

addMember();
