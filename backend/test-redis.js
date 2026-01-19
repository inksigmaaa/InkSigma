// test-redis.js - Simple script to test Redis connection
import 'dotenv/config';
import { getRedisClient, userCache, redisSessionStorage } from './config/redis.js';

async function testRedis() {
    console.log('🔍 Testing Redis Connection...\n');
    
    try {
        const client = getRedisClient();
        
        // Test 1: Basic connection
        console.log('Test 1: Basic Connection');
        const pingResult = await client.ping();
        console.log(`✅ PING: ${pingResult}\n`);
        
        // Test 2: Set and Get
        console.log('Test 2: Set and Get');
        await client.set('test:key', 'Hello Redis!');
        const value = await client.get('test:key');
        console.log(`✅ Value: ${value}`);
        await client.del('test:key');
        console.log('✅ Cleanup done\n');
        
        // Test 3: Session Storage
        console.log('Test 3: Session Storage');
        const testSession = {
            id: 'test-session-123',
            userId: 'user-456',
            expiresAt: new Date(Date.now() + 3600000).toISOString()
        };
        await redisSessionStorage.set('test-session-123', testSession, 60);
        const retrievedSession = await redisSessionStorage.get('test-session-123');
        console.log(`✅ Session stored and retrieved:`, retrievedSession);
        await redisSessionStorage.delete('test-session-123');
        console.log('✅ Session cleanup done\n');
        
        // Test 4: User Cache
        console.log('Test 4: User Cache');
        const testUser = {
            id: 'user-789',
            email: 'test@example.com',
            name: 'Test User'
        };
        await userCache.set('user-789', testUser, 60);
        const retrievedUser = await userCache.get('user-789');
        console.log(`✅ User cached and retrieved:`, retrievedUser);
        await userCache.delete('user-789');
        console.log('✅ User cache cleanup done\n');
        
        // Test 5: TTL (Time To Live)
        console.log('Test 5: TTL Test');
        await client.set('test:ttl', 'expires soon', { ex: 5 }); // Upstash syntax
        const ttl = await client.ttl('test:ttl');
        console.log(`✅ TTL: ${ttl} seconds`);
        await client.del('test:ttl');
        console.log('✅ TTL test cleanup done\n');
        
        console.log('🎉 All tests passed! Upstash Redis is working correctly.\n');
        console.log('Next steps:');
        console.log('1. Start your server: npm run dev');
        console.log('2. Test health endpoint: http://localhost:5000/api/custom/redis-health');
        console.log('3. Sign up or log in to test session management\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Redis test failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check if Redis is running: redis-cli ping');
        console.error('2. Verify REDIS_URL in .env file');
        console.error('3. Check Redis logs for errors');
        console.error('4. See REDIS_SETUP.md for installation help\n');
        process.exit(1);
    }
}

testRedis();
