import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { publication, user } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local file
dotenv.config({ path: join(__dirname, '../.env.local') });

async function addDummyPublication() {
  try {
    console.log('🚀 Adding dummy publication...');

    // Create database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    const client = postgres(connectionString);
    const db = drizzle(client, { schema: { publication, user } });

    // First, check if we have any users
    const users = await db.select().from(user).limit(1);
    
    let userId;
    if (users.length === 0) {
      console.log('No users found. Creating a dummy user...');
      const [newUser] = await db.insert(user).values({
        id: 'dummy-user-' + Date.now(),
        name: 'Tennyson Demo',
        email: 'tennyson@demo.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      userId = newUser.id;
      console.log('✅ Created dummy user:', userId);
    } else {
      userId = users[0].id;
      console.log('✅ Using existing user:', userId);
    }

    // Check if publication with subdomain 'tennyson' already exists
    const existing = await db.select()
      .from(publication)
      .where(eq(publication.subdomain, 'tennyson'))
      .limit(1);

    if (existing.length > 0) {
      console.log('⚠️  Publication with subdomain "tennyson" already exists!');
      console.log('Publication details:', existing[0]);
      return;
    }

    // Create the dummy publication
    const [newPublication] = await db.insert(publication).values({
      name: 'Tennyson Publication',
      subdomain: 'tennyson',
      description: 'A demo publication for testing subdomain functionality',
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ Successfully created dummy publication!');
    console.log('📝 Publication details:');
    console.log('   - Name:', newPublication.name);
    console.log('   - Subdomain:', newPublication.subdomain);
    console.log('   - ID:', newPublication.id);
    console.log('');
    console.log('🌐 Access your publication at:');
    console.log('   - Local: http://tennyson.lvh.me:3000');
    console.log('   - Local (hosts): http://tennyson.inksigma.local:3000');
    console.log('   - Production: https://tennyson.inksigma.com');
    console.log('');
    console.log('💡 Make sure your middleware is configured to handle subdomains!');

  } catch (error) {
    console.error('❌ Error adding dummy publication:', error);
    process.exit(1);
  }
}

addDummyPublication();
