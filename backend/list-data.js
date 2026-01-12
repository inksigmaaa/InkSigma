// List publications and users
import 'dotenv/config';
import { db } from './config/database.js';
import { publication, user } from './models/schema.js';

async function listData() {
  try {
    console.log('\n=== PUBLICATIONS ===');
    const pubs = await db.select().from(publication);
    pubs.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name}, Subdomain: ${p.subdomain}, Owner: ${p.userId}`);
    });

    console.log('\n=== USERS ===');
    const users = await db.select().from(user);
    users.forEach(u => {
      console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
    });

    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

listData();
