# Validation Quick Start

## Step 1: Install Packages

```bash
cd backend
npm install zod validator disposable-email-domains
```

## Step 2: Files Already Created

✅ `backend/validators/schemas.js` - All validation schemas  
✅ `backend/validators/middleware.js` - Validation middleware  
✅ `backend/services/emailValidationService.js` - Updated email validation

## Step 3: Update Each Route File

### authRoutes.js

**Add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import {
    forgotPasswordSchema,
    resetPasswordSchema,
    sendVerificationSchema,
    verifyEmailSchema,
    setPasswordSchema
} from '../validators/schemas.js';
```

**Update routes:**
```javascript
// Line ~18: Add validateBody
router.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res) => {
    // DELETE lines 21-24 (manual validation)
    
// Line ~48: Add validateBody  
router.post("/reset-password", validateBody(resetPasswordSchema), async (req, res) => {
    // DELETE lines 51-59 (manual validation)
    
// Line ~95: Add validateBody
router.post("/send-verification", validateBody(sendVerificationSchema), async (req, res) => {
    // DELETE lines 98-100 (manual validation)
    
// Line ~125: Add validateBody
router.post("/verify-email", validateBody(verifyEmailSchema), async (req, res) => {
    // No manual validation to remove
    
// Line ~175: Add validateBody
router.post("/set-password", getCurrentUser, validateBody(setPasswordSchema), async (req, res) => {
    // DELETE lines 182-195 (manual validation)
```

### blogRoutes.js

**Add at top:**
```javascript
import { validateBody, validateQuery } from '../validators/middleware.js';
import { createBlogSchema, updateBlogSchema, getBlogsQuerySchema } from '../validators/schemas.js';
```

**Update routes:**
```javascript
// Line ~220: Add validateQuery
router.get("/", validateQuery(getBlogsQuerySchema), async (req, res) => {
    // Keep existing code - query params are auto-transformed
    
// Line ~650: Add validateBody
router.post("/", getCurrentUser, validateBody(createBlogSchema), async (req, res) => {
    // DELETE lines 653-656 (manual validation for title/description/content)
    
// Line ~750: Add validateBody (if you have PUT route)
router.put("/:id", getCurrentUser, validateBody(updateBlogSchema), async (req, res) => {
    // DELETE manual validation
```

### commentRoutes.js

**Add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { createCommentSchema, updateCommentSchema, getCommentCountsSchema } from '../validators/schemas.js';
```

**Update routes:**
```javascript
// Line ~90: Add validateBody
router.post("/", optionalAuth, validateBody(createCommentSchema), async (req, res) => {
    // DELETE lines 95-125 (ALL manual validation)
    // KEEP ONLY this check:
    if (!req.user && !guestName) {
        return res.status(400).json({ error: "Name is required for guest comments" });
    }
    
// Line ~240: Add validateBody
router.put("/:id", optionalAuth, validateBody(updateCommentSchema), async (req, res) => {
    // DELETE lines 248-255 (manual validation)
    
// Line ~320: Add validateBody
router.post("/counts", validateBody(getCommentCountsSchema), async (req, res) => {
    // DELETE lines 323-325 (manual validation)
```

### publicationRoutes.js

**Add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { createPublicationSchema, updatePublicationSchema } from '../validators/schemas.js';
```

**Update routes:**
```javascript
// Line ~220: Add validateBody
router.post("/", getCurrentUser, validateBody(createPublicationSchema), async (req, res) => {
    // DELETE lines 230-260 (ALL manual validation)
    // Keep only database checks (existing publication, subdomain taken)
    
// Line ~350: Add validateBody
router.put("/:id", validateBody(updatePublicationSchema), async (req, res) => {
    // DELETE lines 355-358 (manual validation)
```

### memberRoutes.js

**Add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { inviteMemberSchema } from '../validators/schemas.js';
```

**Update routes:**
```javascript
// Line ~180: Add validateBody
router.post("/:publicationId/invite", getCurrentUser, requireAdmin, validateBody(inviteMemberSchema), async (req, res) => {
    // DELETE lines 186-193 (manual validation)
```

### resendVerificationRoutes.js

**Add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { resendVerificationSchema } from '../validators/schemas.js';
```

**Update routes:**
```javascript
// Line ~10: Add validateBody
router.post("/resend-verification", validateBody(resendVerificationSchema), async (req, res) => {
    // DELETE lines 14-16 (manual validation)
```

## Step 4: Test

Start your server and test with invalid data:

```bash
# Test invalid email
curl -X POST http://localhost:5000/api/custom/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}'

# Expected: {"error": "Validation failed", "details": [...]}
```

## What Gets Removed

❌ **Remove all these patterns:**
```javascript
if (!email) { return res.status(400).json({ error: "..." }); }
if (!title || !description) { return res.status(400).json({ error: "..." }); }
if (password.length < 8) { return res.status(400).json({ error: "..." }); }
if (content.trim().length === 0) { return res.status(400).json({ error: "..." }); }
const parsedId = parseInt(id); if (isNaN(parsedId)) { ... }
```

✅ **Keep only:**
- Database checks (user exists, subdomain taken, etc.)
- Business logic checks (user is owner, member has permission, etc.)
- Authentication checks (already handled by middleware)

## Summary

1. Install: `npm install zod validator disposable-email-domains`
2. Add imports to 6 route files
3. Add `validateBody()` or `validateQuery()` to routes
4. Delete manual validation code
5. Test with invalid data

Done! 🎉
