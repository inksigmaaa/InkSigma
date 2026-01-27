import 'dotenv/config';

console.log('Environment Variables Check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'Set ✅' : 'Not set ❌');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Not set ❌');

// Test database connection
try {
  const { db } = await import('./config/database.js');
  await db.execute('SELECT 1');
  console.log('Database connection: ✅ Success');
} catch (error) {
  console.log('Database connection: ❌ Failed -', error.message);
}