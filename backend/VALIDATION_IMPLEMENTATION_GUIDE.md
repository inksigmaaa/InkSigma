# Validation Implementation Guide

## Overview

This guide shows you how to implement **Zod + validator.js + disposable-email-domains** validation system in your backend.

## What We're Using

1. **Zod** - Schema validation for entire request objects (body, query, params)
2. **validator.js** - Specialized email validation (RFC 5322 compliant, 100+ edge cases)
3. **disposable-email-domains** - Comprehensive disposable email blocking (10,000+ domains)

## Installation

```bash
cd backend
npm install zod validator disposable-email-domains
```

## Files Created

```
backend/
├── validators/
│   ├── schemas.js          # All Zod validation schemas
│   └── middleware.js       # Validation middleware
└── services/
    └── emailValidationService.js  # Updated with validator.js
```

## How to Use

### Step 1: Import Validation Middleware and Schemas

```javascript
import { validateBody, validateQuery } from '../validators/middleware.js';
import { createBlogSchema, getBlogsQuerySchema } from '../validators/schemas.js';
```

### Step 2: Add Validation to Routes

**Before (Manual Validation):**
```javascript
router.post("/", getCurrentUser, async (req, res) => {
    const { title, description, content } = req.body;
    
    if (!title || !description || !content) {
        return res.status(400).json({ 
            error: "Title, description, and content are required" 
        });
    }
    
    // ... rest of code
});
```

**After (Zod Validation):**
```javascript
router.post("/", getCurrentUser, validateBody(createBlogSchema), async (req, res) => {
    // req.body is already validated and transformed
    const { title, description, content } = req.body;
    
    // ... rest of code (no manual validation needed!)
});
```

### Step 3: Update All Routes

## Route-by-Route Implementation

### 1. Auth Routes (`backend/routes/authRoutes.js`)

```javascript
import { validateBody } from '../validators/middleware.js';
import {
    forgotPasswordSchema,
    resetPasswordSchema,
    sendVerificationSchema,
    verifyEmailSchema,
    setPasswordSchema
} from '../validators/schemas.js';

// Update routes:
router.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res) => {
    // Remove manual validation - Zod handles it
    const { email, redirectTo } = req.body;
    // ... rest of code
});

router.post("/reset-password", validateBody(resetPasswordSchema), async (req, res) => {
    // Remove manual validation
    const { token, email, newPassword } = req.body;
    // ... rest of code
});

router.post("/send-verification", validateBody(sendVerificationSchema), async (req, res) => {
    // Remove manual validation
    const { email, redirectTo } = req.body;
    // ... rest of code
});

router.post("/verify-email", validateBody(verifyEmailSchema), async (req, res) => {
    // Remove manual validation
    const { token, email } = req.body;
    // ... rest of code
});

router.post("/set-password", getCurrentUser, validateBody(setPasswordSchema), async (req, res) => {
    // Remove manual validation
    const { password, confirmPassword } = req.body;
    // ... rest of code
});
```

### 2. Blog Routes (`backend/routes/blogRoutes.js`)

```javascript
import { validateBody, validateQuery } from '../validators/middleware.js';
import { createBlogSchema, updateBlogSchema, getBlogsQuerySchema } from '../validators/schemas.js';

// GET /api/blogs - Add query validation
router.get("/", validateQuery(getBlogsQuerySchema), async (req, res) => {
    // req.query is validated and transformed (strings to numbers, etc.)
    const { published, status, authorId, publicationId, categories, search, limit, offset, includeUnpublished } = req.query;
    // ... rest of code
});

// POST /api/blogs - Add body validation
router.post("/", getCurrentUser, validateBody(createBlogSchema), async (req, res) => {
    // Remove manual validation
    const { title, description, content, categories, published, status, scheduledAt, publicationId } = req.body;
    // ... rest of code
});

// PUT /api/blogs/:id - Add body validation
router.put("/:id", getCurrentUser, validateBody(updateBlogSchema), async (req, res) => {
    // Remove manual validation
    const { title, description, content, categories, published, status, scheduledAt, publicationId } = req.body;
    // ... rest of code
});
```

### 3. Comment Routes (`backend/routes/commentRoutes.js`)

```javascript
import { validateBody } from '../validators/middleware.js';
import { createCommentSchema, updateCommentSchema, getCommentCountsSchema } from '../validators/schemas.js';

// POST /api/comments - Add validation
router.post("/", optionalAuth, validateBody(createCommentSchema), async (req, res) => {
    // Remove ALL manual validation - Zod handles everything
    const { blogId, content, parentId, guestName, guestEmail } = req.body;
    
    // Only keep this check (guest name required if not authenticated)
    if (!req.user && !guestName) {
        return res.status(400).json({ error: "Name is required for guest comments" });
    }
    
    // ... rest of code
});

// PUT /api/comments/:id - Add validation
router.put("/:id", optionalAuth, validateBody(updateCommentSchema), async (req, res) => {
    // Remove manual validation
    const { content } = req.body;
    // ... rest of code
});

// POST /api/comments/counts - Add validation
router.post("/counts", validateBody(getCommentCountsSchema), async (req, res) => {
    // Remove manual validation
    const { blogIds } = req.body;
    // ... rest of code
});
```

### 4. Publication Routes (`backend/routes/publicationRoutes.js`)

```javascript
import { validateBody } from '../validators/middleware.js';
import { createPublicationSchema, updatePublicationSchema } from '../validators/schemas.js';

// POST /api/publications - Add validation
router.post("/", getCurrentUser, validateBody(createPublicationSchema), async (req, res) => {
    // Remove ALL manual validation
    const { name, subdomain, description } = req.body;
    const userId = req.user?.id;
    
    // ... rest of code (remove all validation checks)
});

// PUT /api/publications/:id - Add validation
router.put("/:id", validateBody(updatePublicationSchema), async (req, res) => {
    // Remove manual validation
    const { name, subdomain, description } = req.body;
    // ... rest of code
});
```

### 5. Member Routes (`backend/routes/memberRoutes.js`)

```javascript
import { validateBody } from '../validators/middleware.js';
import { inviteMemberSchema } from '../validators/schemas.js';

// POST /:publicationId/invite - Add validation
router.post("/:publicationId/invite", getCurrentUser, requireAdmin, validateBody(inviteMemberSchema), async (req, res) => {
    // Remove manual validation
    const { email, role } = req.body;
    // ... rest of code
});
```

### 6. Resend Verification Routes (`backend/routes/resendVerificationRoutes.js`)

```javascript
import { validateBody } from '../validators/middleware.js';
import { resendVerificationSchema } from '../validators/schemas.js';

// POST /resend-verification - Add validation
router.post("/resend-verification", validateBody(resendVerificationSchema), async (req, res) => {
    // Remove manual validation
    const { email } = req.body;
    // ... rest of code
});
```

## Benefits

### Before (Manual Validation)
```javascript
// Repeated in every route
if (!email) {
    return res.status(400).json({ error: "Email is required" });
}
if (!title || title.length < 1 || title.length > 200) {
    return res.status(400).json({ error: "Invalid title" });
}
const parsedId = parseInt(id);
if (isNaN(parsedId)) {
    return res.status(400).json({ error: "Invalid ID" });
}
```

### After (Zod Validation)
```javascript
// One line per route
router.post("/", validateBody(createBlogSchema), async (req, res) => {
    // Data is already validated, transformed, and type-safe
    const { title, description, content } = req.body;
});
```

## Error Response Format

When validation fails, Zod returns a structured error:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Email Validation

The updated `emailValidationService.js` now uses:

1. **validator.js** for format validation (RFC 5322 compliant)
2. **disposable-email-domains** for blocking 10,000+ temp email domains
3. **DNS MX record check** (optional, controlled by `VALIDATE_EMAIL_MX` env variable)

```javascript
import { emailValidationService } from '../services/emailValidationService.js';

// Async validation (includes MX check if enabled)
const result = await emailValidationService.validateEmail('test@example.com');
// { isValid: true/false, errors: [] }

// Sync validation (format + disposable check only)
const result = emailValidationService.validateEmailSync('test@example.com');
// { isValid: true/false, errors: [] }
```

## Testing

After implementing, test with invalid data:

```bash
# Test invalid email
curl -X POST http://localhost:5000/api/custom/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}'

# Expected response:
# {
#   "error": "Validation failed",
#   "details": [
#     {
#       "field": "email",
#       "message": "Invalid email format"
#     }
#   ]
# }
```

## Summary

1. ✅ Install packages: `npm install zod validator disposable-email-domains`
2. ✅ Files created: `validators/schemas.js`, `validators/middleware.js`, updated `emailValidationService.js`
3. ✅ Import validation middleware in each route file
4. ✅ Add `validateBody()` or `validateQuery()` to routes
5. ✅ Remove manual validation code
6. ✅ Test with invalid data

Your validation is now:
- **Centralized** - One source of truth
- **Type-safe** - Automatic type transformations
- **Comprehensive** - 10,000+ disposable domains blocked
- **Maintainable** - Easy to update validation rules
- **Consistent** - Same error format everywhere
