# View and Share Tracking Implementation

## 24-Hour View Tracking Rules ⏰

**The system enforces a 24-hour cooldown period for view counting:**

| Scenario | Action | Stored in Database? |
|----------|--------|---------------------|
| User views blog for the first time | ✅ Count as new view | ✅ YES - Recorded |
| Same user views same blog within 24 hours | ❌ Do NOT count | ❌ NO - Skipped |
| Same user views same blog after 24+ hours | ✅ Count as new view | ✅ YES - Recorded |

**How users are identified:**
- Unique identifier = SHA256 hash of (IP Address + User Agent)
- Same device + same browser = same user
- Different browser or device = different user

**Example Timeline:**
```
Day 1, 10:00 AM - User views blog → ✅ View #1 recorded
Day 1, 2:00 PM  - Same user views again → ❌ Skipped (within 24h)
Day 1, 11:00 PM - Same user views again → ❌ Skipped (within 24h)
Day 2, 10:01 AM - Same user views again → ✅ View #2 recorded (24h passed)
```

## Overview
This implementation adds intelligent view and share tracking to your blog platform using Redis for 24-hour deduplication and PostgreSQL for persistent storage.

## Features

### 1. View Tracking
- **24-Hour Deduplication**: Uses Redis to prevent counting the same viewer multiple times within 24 hours
- **IP + User Agent Hashing**: Creates unique viewer identifiers based on IP address and browser fingerprint
- **Automatic Fallback**: If Redis is unavailable, falls back to database-only tracking
- **Privacy-Focused**: Stores hashed identifiers, not raw IP addresses

### 2. Share Tracking
- Tracks shares across multiple platforms: Twitter, Facebook, LinkedIn, WhatsApp, Email, Copy Link
- Records each share action in the database
- Provides share count analytics

## Database Schema

### New Tables

#### `blog_view`
```sql
CREATE TABLE blog_view (
  id SERIAL PRIMARY KEY,
  blogId INTEGER NOT NULL REFERENCES blog(id) ON DELETE CASCADE,
  viewerIdentifier TEXT NOT NULL,  -- SHA256 hash of IP + User Agent
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `blog_share`
```sql
CREATE TABLE blog_share (
  id SERIAL PRIMARY KEY,
  blogId INTEGER NOT NULL REFERENCES blog(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,  -- twitter, facebook, linkedin, whatsapp, email, copy
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## API Endpoints

### View Tracking

#### POST `/api/views/track`
Track a blog view with automatic deduplication.

**Request Body:**
```json
{
  "blogId": 123
}
```

**Response:**
```json
{
  "success": true,
  "isNewView": true,
  "message": "View tracked"
}
```

#### GET `/api/views/count/:blogId`
Get view count for a specific blog.

**Response:**
```json
{
  "blogId": 123,
  "views": 456
}
```

#### POST `/api/views/stats`
Get view and share stats for multiple blogs.

**Request Body:**
```json
{
  "blogIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "1": { "views": 100, "shares": 10 },
  "2": { "views": 200, "shares": 20 },
  "3": { "views": 300, "shares": 30 }
}
```

### Share Tracking

#### POST `/api/views/share`
Track a blog share.

**Request Body:**
```json
{
  "blogId": 123,
  "platform": "twitter"
}
```

**Valid platforms:** `twitter`, `facebook`, `linkedin`, `whatsapp`, `email`, `copy`

**Response:**
```json
{
  "success": true,
  "message": "Share tracked"
}
```

#### GET `/api/views/shares/:blogId`
Get share count for a specific blog.

**Response:**
```json
{
  "blogId": 123,
  "shares": 45
}
```

## How It Works

### View Tracking Flow

1. **User visits blog page**
   - Frontend calls `/api/views/track` with blogId
   - Backend extracts IP address and User Agent from request headers

2. **Generate unique identifier**
   - Creates SHA256 hash of `IP:UserAgent`
   - This ensures privacy while maintaining uniqueness

3. **Check Redis cache (if available)**
   - Key format: `blog:{blogId}:view:{hashedIdentifier}`
   - If key exists, view was already counted in last 24 hours → Skip
   - If key doesn't exist, continue to step 4

4. **Check database (fallback)**
   - If Redis unavailable, query database for views in last 24 hours
   - If found, skip counting

5. **Record new view**
   - Store in Redis with 24-hour expiry (86400 seconds)
   - Insert record into `blog_view` table
   - Increment `views` counter in `blog` table

### Share Tracking Flow

1. **User clicks share button**
   - Frontend calls `/api/views/share` with blogId and platform
   
2. **Record share**
   - Insert record into `blog_share` table
   - No deduplication (each share action is counted)

## Frontend Integration

### Blog Detail Page
```javascript
// Track view when blog loads
useEffect(() => {
  if (blog?.status === 'published') {
    fetch('http://localhost:5000/api/views/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId: blog.id }),
    });
  }
}, [blog]);
```

### Share Buttons
```javascript
const trackShare = async (platform) => {
  await fetch('http://localhost:5000/api/views/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blogId, platform }),
  });
};

// Call trackShare when user shares
const shareOnTwitter = () => {
  trackShare('twitter');
  window.open(twitterUrl, '_blank');
};
```

### Home Page Stats
```javascript
// Fetch view and share stats for multiple blogs
const fetchStats = async () => {
  const response = await fetch('http://localhost:5000/api/views/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blogIds: [1, 2, 3] }),
  });
  const stats = await response.json();
  // stats = { "1": { views: 100, shares: 10 }, ... }
};
```

## Redis Configuration

The system uses Upstash Redis (serverless Redis). Configure in `.env`:

```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

If Redis is not configured, the system automatically falls back to database-only mode.

## Benefits

### 1. Accurate View Counts
- Prevents view inflation from page refreshes
- 24-hour window balances accuracy with user privacy
- Handles both authenticated and anonymous users

### 2. Performance
- Redis caching reduces database queries
- Fast lookups for duplicate detection
- Automatic expiry prevents memory bloat

### 3. Privacy
- No raw IP addresses stored
- Hashed identifiers cannot be reversed
- Compliant with privacy regulations

### 4. Reliability
- Graceful fallback if Redis unavailable
- Database ensures no data loss
- Error handling prevents page load failures

## Testing

### Test View Tracking
```bash
# Track a view
curl -X POST http://localhost:5000/api/views/track \
  -H "Content-Type: application/json" \
  -d '{"blogId": 1}'

# Get view count
curl http://localhost:5000/api/views/count/1
```

### Test Share Tracking
```bash
# Track a share
curl -X POST http://localhost:5000/api/views/share \
  -H "Content-Type: application/json" \
  -d '{"blogId": 1, "platform": "twitter"}'

# Get share count
curl http://localhost:5000/api/views/shares/1
```

### Test Deduplication
```bash
# First view - should count
curl -X POST http://localhost:5000/api/views/track \
  -H "Content-Type: application/json" \
  -d '{"blogId": 1}'
# Response: {"success": true, "isNewView": true}

# Second view (within 24 hours) - should not count
curl -X POST http://localhost:5000/api/views/track \
  -H "Content-Type: application/json" \
  -d '{"blogId": 1}'
# Response: {"success": true, "isNewView": false}
```

## Monitoring

Check server logs for tracking activity:
```
[VIEW TRACKING] Tracking view for blog 1 from 3a5f8b2c...
[VIEW TRACKING] Stored view in Redis with 24h expiry
[VIEW TRACKING] New view recorded in database
```

## Future Enhancements

1. **Analytics Dashboard**: Visualize views and shares over time
2. **Geographic Tracking**: Add country/region data (privacy-compliant)
3. **Referrer Tracking**: Track where traffic comes from
4. **Read Time Tracking**: Measure how long users spend reading
5. **Engagement Metrics**: Track scroll depth and interactions
