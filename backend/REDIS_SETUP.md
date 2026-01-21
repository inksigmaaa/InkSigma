# Redis Setup Guide

This guide will help you set up Redis for session management and caching in your application.

## What Redis Does in This Application

1. **Session Storage**: Stores user sessions instead of the database for faster access
2. **User Caching**: Caches user data to reduce database queries
3. **Performance**: Significantly improves authentication and user lookup performance

## Installation

### Windows

1. **Using WSL2 (Recommended)**:
   ```bash
   # Install WSL2 if not already installed
   wsl --install
   
   # Inside WSL2, install Redis
   sudo apt update
   sudo apt install redis-server
   
   # Start Redis
   sudo service redis-server start
   ```

2. **Using Memurai (Windows Native)**:
   - Download from: https://www.memurai.com/
   - Install and run as a Windows service
   - Default port: 6379

### macOS

```bash
# Using Homebrew
brew install redis

# Start Redis
brew services start redis

# Or run manually
redis-server
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable on boot
sudo systemctl enable redis-server
```

### Docker (All Platforms)

```bash
# Run Redis in Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Or using docker-compose (create docker-compose.yml):
```

```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

Then run:
```bash
docker-compose up -d
```

## Configuration

1. **Update your `.env` file**:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

2. **For remote Redis** (production):
   ```env
   REDIS_URL=redis://username:password@your-redis-host:6379
   ```

3. **For Redis with password**:
   ```env
   REDIS_URL=redis://:your-password@localhost:6379
   ```

## Install Node.js Dependencies

```bash
cd backend
npm install
```

This will install `ioredis` which is already added to package.json.

## Verify Redis is Running

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Or check if Redis is listening
netstat -an | grep 6379
```

## How It Works

### Session Flow

1. **User Signs Up/Logs In**:
   - Better-auth creates a session
   - Session is stored in Redis with key: `session:{sessionId}`
   - Session cookie is sent to the browser

2. **User Makes Authenticated Request**:
   - Session ID is read from cookie
   - Session is retrieved from Redis (fast!)
   - If not in Redis, falls back to database
   - User data is cached in Redis with key: `user:{userId}`

3. **User Logs Out**:
   - Session is deleted from Redis
   - User cache is invalidated

### Cache Invalidation

User cache is automatically invalidated when:
- User email is verified
- User password is changed
- User account is updated
- User is deleted

## Monitoring Redis

### Using Redis CLI

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# View session keys
KEYS session:*

# View user cache keys
KEYS user:*

# Get a specific key
GET session:abc123

# Check memory usage
INFO memory

# Monitor commands in real-time
MONITOR
```

### Using Redis Desktop Manager

Download from: https://resp.app/

## Performance Benefits

- **Session Lookup**: ~1ms (Redis) vs ~50-100ms (Database)
- **User Cache**: ~1ms (Redis) vs ~20-50ms (Database)
- **Reduced Database Load**: 70-80% fewer queries for auth operations

## Troubleshooting

### Redis Not Starting

```bash
# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Restart Redis
sudo systemctl restart redis-server
```

### Connection Refused

1. Check if Redis is running: `redis-cli ping`
2. Check firewall settings
3. Verify REDIS_URL in .env
4. Check Redis configuration: `/etc/redis/redis.conf`

### Memory Issues

```bash
# Check memory usage
redis-cli INFO memory

# Set max memory (in redis.conf)
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Production Considerations

1. **Use Redis Cluster** for high availability
2. **Enable persistence** (RDB or AOF)
3. **Set up monitoring** (Redis Sentinel or Redis Enterprise)
4. **Use connection pooling** (already configured in redis.js)
5. **Set appropriate TTL** for cached data
6. **Enable authentication** in production

### Example Production Redis URL

```env
# Redis Cloud
REDIS_URL=redis://username:password@redis-12345.cloud.redislabs.com:12345

# AWS ElastiCache
REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379

# Azure Cache for Redis
REDIS_URL=redis://:password@your-cache.redis.cache.windows.net:6380?ssl=true
```

## Testing

After setup, test the integration:

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Watch the logs for Redis connection messages:
   ```
   [REDIS] Connected successfully
   [REDIS] Client ready
   ```

3. Sign up or log in - you should see:
   ```
   [REDIS] Session stored: {sessionId}
   [AUTH-CACHE] User cached: {userId}
   ```

4. Make authenticated requests - you should see:
   ```
   [REDIS] Session retrieved: {sessionId}
   [AUTH-CACHE] User found in cache: {userId}
   ```

## Fallback Behavior

If Redis is unavailable:
- Sessions fall back to database storage
- User lookups go directly to database
- Application continues to work (with reduced performance)
- Errors are logged but don't crash the app

This ensures your application remains resilient even if Redis goes down.
