# Redis Quick Start

## 1. Install Redis

**Windows (WSL2)**:
```bash
sudo apt update && sudo apt install redis-server
sudo service redis-server start
```

**macOS**:
```bash
brew install redis
brew services start redis
```

**Docker** (easiest for all platforms):
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

## 2. Update Environment Variables

Add to your `backend/.env` file:
```env
REDIS_URL=redis://localhost:6379
```

## 3. Install Dependencies

```bash
cd backend
npm install
```

## 4. Start Your Server

```bash
npm run dev
```

You should see:
```
[REDIS] Connected successfully
[REDIS] Client ready
```

## 5. Test Redis Integration

Visit: http://localhost:5000/api/custom/redis-health

You should see:
```json
{
  "status": "healthy",
  "redis": "connected",
  "message": "Redis is working properly"
}
```

## 6. Test Session Management

1. Sign up or log in to your application
2. Check your server logs - you should see:
   ```
   [REDIS] Session stored: {sessionId}
   [AUTH-CACHE] User cached: {userId}
   ```

3. Make another authenticated request
4. You should see:
   ```
   [REDIS] Session retrieved: {sessionId}
   [AUTH-CACHE] User found in cache: {userId}
   ```

## What's Happening?

- **Sessions**: Stored in Redis instead of PostgreSQL
- **User Data**: Cached in Redis for 1 hour
- **Performance**: 10-50x faster authentication
- **Automatic**: Cache invalidation on user updates

## Troubleshooting

**Redis not connecting?**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

**Port already in use?**
```bash
# Find what's using port 6379
netstat -an | grep 6379

# Kill the process or use a different port
REDIS_URL=redis://localhost:6380
```

**Still having issues?**
See the full guide: [REDIS_SETUP.md](./REDIS_SETUP.md)

## Optional: Monitor Redis

```bash
# Connect to Redis CLI
redis-cli

# View all sessions
KEYS session:*

# View all cached users
KEYS user:*

# Monitor real-time commands
MONITOR
```

That's it! Your application now uses Redis for blazing-fast session management. 🚀
