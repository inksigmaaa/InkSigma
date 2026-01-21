# 24-Hour View Tracking Rule - Quick Reference

## The Rule (Simple Version)

**Same user + Same blog + Within 24 hours = NO new view recorded**

## How It Works

### Timeline Example

```
Monday 10:00 AM  → User views Blog #5  ✅ View #1 RECORDED
Monday 11:30 AM  → User views Blog #5  ❌ SKIPPED (only 1.5h passed)
Monday 3:00 PM   → User views Blog #5  ❌ SKIPPED (only 5h passed)
Monday 11:00 PM  → User views Blog #5  ❌ SKIPPED (only 13h passed)
Tuesday 9:00 AM  → User views Blog #5  ❌ SKIPPED (only 23h passed)
Tuesday 10:01 AM → User views Blog #5  ✅ View #2 RECORDED (24h+ passed)
```

## User Identification

A "user" is identified by:
- **IP Address** + **Browser User Agent** (hashed together)

### Examples:

| Scenario | Counted as Same User? |
|----------|----------------------|
| Same device, same browser | ✅ YES |
| Same device, different browser | ❌ NO (different user agent) |
| Same device, incognito mode | ❌ NO (different user agent) |
| Different device, same network | ❌ NO (different user agent) |
| Mobile + Desktop | ❌ NO (different user agents) |

## Technical Implementation

### Redis (Primary Method)
```javascript
// Key format: blog:{blogId}:view:{hashedIdentifier}
// Example: blog:5:view:3a5f8b2c1d...

// When user views blog:
1. Check if Redis key exists
   - EXISTS → View was within 24h → SKIP
   - NOT EXISTS → Continue to step 2

2. Store in Redis with 24h expiry
   SETEX blog:5:view:3a5f8b2c1d... 86400 "timestamp"
   
3. Record in database
4. Increment view counter

// After 24 hours:
- Redis key automatically expires
- Next view will not find the key
- View will be counted as new
```

### Database Fallback (If Redis Unavailable)
```sql
-- Check for views in last 24 hours
SELECT * FROM blog_view 
WHERE blogId = 5 
  AND viewerIdentifier = '3a5f8b2c1d...'
  AND createdAt >= NOW() - INTERVAL '24 hours'
LIMIT 1;

-- If found → SKIP
-- If not found → Record new view
```

## API Response

```javascript
// First view
{
  "success": true,
  "isNewView": true,
  "message": "View tracked"
}

// Repeat view within 24h
{
  "success": true,
  "isNewView": false,
  "message": "View already tracked within 24 hours"
}
```

## Testing

### Test the rule:
```bash
# Run test script
cd backend
node test-24hour-rule.js
```

### Manual testing:
```bash
# View 1 (should count)
curl -X POST http://localhost:5000/api/views/track \
  -H "Content-Type: application/json" \
  -d '{"blogId": 1}'

# View 2 (should NOT count - within 24h)
curl -X POST http://localhost:5000/api/views/track \
  -H "Content-Type: application/json" \
  -d '{"blogId": 1}'
```

### Clear Redis to reset (for testing):
```bash
# If using Redis CLI
redis-cli DEL "blog:1:view:*"

# Or clear all view tracking keys
redis-cli KEYS "blog:*:view:*" | xargs redis-cli DEL
```

## Why 24 Hours?

✅ **Prevents view inflation** from page refreshes
✅ **Balances accuracy** with user privacy
✅ **Industry standard** for unique visitor tracking
✅ **Reasonable timeframe** for "unique view"

## Common Questions

**Q: What if user clears cookies?**
A: Doesn't matter - we use IP + User Agent, not cookies

**Q: What if user uses VPN?**
A: Different IP = different user = new view counted

**Q: What if user switches browsers?**
A: Different User Agent = different user = new view counted

**Q: Can I change the 24-hour period?**
A: Yes, modify the `86400` seconds in `viewTrackingService.js`

**Q: What happens if Redis is down?**
A: System automatically falls back to database checking

## Configuration

To change the cooldown period, edit `backend/services/viewTrackingService.js`:

```javascript
// Current: 24 hours (86400 seconds)
await redis.setex(redisKey, 86400, Date.now().toString());

// Change to 12 hours:
await redis.setex(redisKey, 43200, Date.now().toString());

// Change to 48 hours:
await redis.setex(redisKey, 172800, Date.now().toString());
```

Also update the database fallback:
```javascript
// Current: 24 hours
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

// Change to 12 hours:
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
```

## Monitoring

Check server logs to see the rule in action:
```
[VIEW TRACKING] Tracking view for blog 1 from 3a5f8b2c...
[VIEW TRACKING] Stored view in Redis with 24h expiry
[VIEW TRACKING] New view recorded in database - COUNT INCREMENTED

[VIEW TRACKING] Tracking view for blog 1 from 3a5f8b2c...
[VIEW TRACKING] View already tracked in Redis (within 24h) - SKIPPED
```
