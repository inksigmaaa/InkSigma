# Validation Implementation Checklist

## ✅ Prerequisites (Already Done)

- [x] Zod is already installed (checked in `node_modules/zod/`)
- [x] Created `validators/schemas.js` with all validation schemas
- [x] Created `validators/middleware.js` with validation middleware
- [x] Updated `services/emailValidationService.js` with validator.js

## 📦 Step 1: Install Missing Packages

```bash
cd backend
npm install validator disposable-email-domains
```

## 📝 Step 2: Update Route Files

### File 1: `routes/authRoutes.js`

**Lines to add at top (after existing imports):**
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

**Changes:**
- [ ] Line ~18: Change `router.post("/forgot-password", async (req, res) => {` to `router.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res) => {`
- [ ] Lines 21-24: Delete manual email validation
- [ ] Line ~48: Change `router.post("/reset-password", async (req, res) => {` to `router.post("/reset-password", validateBody(resetPasswordSchema), async (req, res) => {`
- [ ] Lines 51-59: Delete manual validation (token, email, password checks)
- [ ] Line ~95: Change `router.post("/send-verification", async (req, res) => {` to `router.post("/send-verification", validateBody(sendVerificationSchema), async (req, res) => {`
- [ ] Lines 98-100: Delete manual email validation
- [ ] Line ~125: Change `router.post("/verify-email", async (req, res) => {` to `router.post("/verify-email", validateBody(verifyEmailSchema), async (req, res) => {`
- [ ] Line ~175: Change `router.post("/set-password", getCurrentUser, async (req, res) => {` to `router.post("/set-password", getCurrentUser, validateBody(setPasswordSchema), async (req, res) => {`
- [ ] Lines 182-195: Delete manual password validation

---

### File 2: `routes/blogRoutes.js`

**Lines to add at top:**
```javascript
import { validateBody, validateQuery } from '../validators/middleware.js';
import { createBlogSchema, updateBlogSchema, getBlogsQuerySchema } from '../validators/schemas.js';
```

**Changes:**
- [ ] Line ~220: Change `router.get("/", async (req, res) => {` to `router.get("/", validateQuery(getBlogsQuerySchema), async (req, res) => {`
- [ ] Line ~650: Change `router.post("/", getCurrentUser, async (req, res) => {` to `router.post("/", getCurrentUser, validateBody(createBlogSchema), async (req, res) => {`
- [ ] Lines 653-656: Delete manual validation for title/description/content

---

### File 3: `routes/commentRoutes.js`

**Lines to add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { createCommentSchema, updateCommentSchema, getCommentCountsSchema } from '../validators/schemas.js';
```

**Changes:**
- [ ] Line ~90: Change `router.post("/", optionalAuth, async (req, res) => {` to `router.post("/", optionalAuth, validateBody(createCommentSchema), async (req, res) => {`
- [ ] Lines 95-125: Delete ALL manual validation (blogId, content, parentId checks)
- [ ] Keep only: `if (!req.user && !guestName) { return res.status(400).json({ error: "Name is required for guest comments" }); }`
- [ ] Line ~240: Change `router.put("/:id", optionalAuth, async (req, res) => {` to `router.put("/:id", optionalAuth, validateBody(updateCommentSchema), async (req, res) => {`
- [ ] Lines 248-255: Delete manual content validation
- [ ] Line ~320: Change `router.post("/counts", async (req, res) => {` to `router.post("/counts", validateBody(getCommentCountsSchema), async (req, res) => {`
- [ ] Lines 323-325: Delete manual blogIds validation

---

### File 4: `routes/publicationRoutes.js`

**Lines to add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { createPublicationSchema, updatePublicationSchema } from '../validators/schemas.js';
```

**Changes:**
- [ ] Line ~220: Change `router.post("/", getCurrentUser, async (req, res) => {` to `router.post("/", getCurrentUser, validateBody(createPublicationSchema), async (req, res) => {`
- [ ] Lines 230-260: Delete ALL manual validation (name length, subdomain format, description length)
- [ ] Keep only: Database checks (existing publication, subdomain taken)
- [ ] Line ~350: Change `router.put("/:id", async (req, res) => {` to `router.put("/:id", validateBody(updatePublicationSchema), async (req, res) => {`
- [ ] Lines 355-358: Delete manual description validation

---

### File 5: `routes/memberRoutes.js`

**Lines to add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { inviteMemberSchema } from '../validators/schemas.js';
```

**Changes:**
- [ ] Line ~180: Change `router.post("/:publicationId/invite", getCurrentUser, requireAdmin, async (req, res) => {` to `router.post("/:publicationId/invite", getCurrentUser, requireAdmin, validateBody(inviteMemberSchema), async (req, res) => {`
- [ ] Lines 186-193: Delete manual email and role validation

---

### File 6: `routes/resendVerificationRoutes.js`

**Lines to add at top:**
```javascript
import { validateBody } from '../validators/middleware.js';
import { resendVerificationSchema } from '../validators/schemas.js';
```

**Changes:**
- [ ] Line ~10: Change `router.post("/resend-verification", async (req, res) => {` to `router.post("/resend-verification", validateBody(resendVerificationSchema), async (req, res) => {`
- [ ] Lines 14-16: Delete manual email validation

---

## 🧪 Step 3: Test

### Test 1: Invalid Email
```bash
curl -X POST http://localhost:5000/api/custom/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}'
```
**Expected:** `{"error": "Validation failed", "details": [{"field": "email", "message": "Invalid email format"}]}`

### Test 2: Missing Required Field
```bash
curl -X POST http://localhost:5000/api/blogs \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"title": "Test"}'
```
**Expected:** `{"error": "Validation failed", "details": [{"field": "description", "message": "Description is required"}]}`

### Test 3: Invalid Data Type
```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"blogId": "not-a-number", "content": "Test comment"}'
```
**Expected:** `{"error": "Validation failed", "details": [{"field": "blogId", "message": "Expected number, received string"}]}`

### Test 4: Disposable Email
```bash
curl -X POST http://localhost:5000/api/custom/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@10minutemail.com"}'
```
**Expected:** `{"error": "Validation failed", "details": [{"field": "email", "message": "Temporary email addresses are not allowed"}]}`

---

## 📊 Progress Tracker

- [ ] Step 1: Install packages (`npm install validator disposable-email-domains`)
- [ ] Step 2: Update `routes/authRoutes.js` (6 routes)
- [ ] Step 3: Update `routes/blogRoutes.js` (2 routes)
- [ ] Step 4: Update `routes/commentRoutes.js` (3 routes)
- [ ] Step 5: Update `routes/publicationRoutes.js` (2 routes)
- [ ] Step 6: Update `routes/memberRoutes.js` (1 route)
- [ ] Step 7: Update `routes/resendVerificationRoutes.js` (1 route)
- [ ] Step 8: Test all endpoints with invalid data
- [ ] Step 9: Test all endpoints with valid data
- [ ] Step 10: Remove old manual validation code

---

## 🎯 Summary

**Total Changes:**
- 6 route files to update
- 15 routes to add validation
- ~200 lines of manual validation code to remove
- 2 packages to install

**Time Estimate:** 30-45 minutes

**Benefits:**
- ✅ Centralized validation (one source of truth)
- ✅ Type-safe (automatic transformations)
- ✅ Comprehensive (10,000+ disposable domains blocked)
- ✅ Maintainable (easy to update rules)
- ✅ Consistent error format
- ✅ Less code to maintain
