// Test profile update
import 'dotenv/config';
import { db } from './config/database.js';
import { user } from './models/schema.js';
import { eq } from 'drizzle-orm';

async function testProfileUpdate() {
  try {
    // Get first user
    const users = await db.select().from(user).limit(1);
    if (users.length === 0) {
      console.log('No users found');
      return;
    }

    const testUser = users[0];
    console.log('\n=== BEFORE UPDATE ===');
    console.log('ID:', testUser.id);
    console.log('Name:', testUser.name);
    console.log('Username:', testUser.username);
    console.log('Bio:', testUser.bio);
    console.log('Image:', testUser.image);

    // Update the user
    const updateData = {
      name: 'Test Name Updated',
      username: 'testuser123',
      bio: 'This is a test bio',
      updatedAt: new Date(),
    };

    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, testUser.id));

    // Fetch updated user
    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, testUser.id));

    console.log('\n=== AFTER UPDATE ===');
    console.log('ID:', updatedUser.id);
    console.log('Name:', updatedUser.name);
    console.log('Username:', updatedUser.username);
    console.log('Bio:', updatedUser.bio);
    console.log('Image:', updatedUser.image);

    console.log('\n✅ Profile update test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testProfileUpdate();
