# How to Read the Code - Beginner's Guide

## 🎯 Goal
Understand how your backend works by reading code in the right order.

## 📚 Reading Order (Follow This!)

### 🌟 LEVEL 1: Start Here (Foundation)

#### Step 1: Entry Point (5 minutes)
**File:** `server.js`

**What to look for:**
```javascript
// 1. Imports - What packages are used?
import express from 'express';
import { db } from './config/database.js';

// 2. App setup - How is Express configured?
const app = express();

// 3. Middleware - What runs on every request?
app.use(cors());
app.use(express.json());

// 4. Routes - What endpoints exist?
app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authRoutes);

// 5. Server start - What port?
app.listen(5000);
```

**Questions to answer:**
- ✅ What port does the server run on? (5000)
- ✅ What routes are registered?
- ✅ What middleware is applied?

---

#### Step 2: Database Schema (10 minutes)
**File:** `models/schema.js`

**What to look for:**
```javascript
// 1. What tables exist?
export const user = pgTable("user", { ... });
export const blog = pgTable("blog", { ... });
export const comment = pgTable("comment", { ... });

// 2. What columns does each table have?
export const blog = pgTable("blog", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  authorId: integer("author_id").references(() => user.id),
});

// 3. What are the relationships?
// authorId references user.id (blog belongs to user)
```

**Questions to answer:**
- ✅ What are the main tables? (user, blog, comment, publication, etc.)
- ✅ How are they related? (foreign keys)
- ✅ What data does each table store?

**Draw a simple diagram:**
```
user (id, name, email)
  ↓ (has many)
blog (id, title, content, authorId)
  ↓ (has many)
comment (id, content, blogId, authorId)
```

---

#### Step 3: Configuration Files (5 minutes)
**Files:** `config/` folder

**Read in order:**
1. `config/database.js` - How to connect to PostgreSQL
2. `config/redis.js` - How to connect to Redis
3. `config/betterAuth.js` - How authentication works

**What to look for:**
```javascript
// database.js
export const db = drizzle(pool); // Database connection

// redis.js
export const getRedisClient = () => redis; // Redis connection

// betterAuth.js
export const auth = betterAuth({ ... }); // Auth configuration
```

---

### 🚀 LEVEL 2: Understanding Requests (Core Concepts)

#### Step 4: Pick ONE Simple Route (15 minutes)
**Recommended:** `routes/commentRoutes.js` (simpler than blogs)

**Read like this:**

```javascript
// 1. IMPORTS - What does this route need?
import express from 'express';
import { db } from '../config/database.js';
import { comment } from '../models/schema.js';

// 2. MIDDLEWARE - What checks happen first?
const optionalAuth = async (req, res, next) => {
  // Try to get user, but don't require it
};

// 3. ROUTE DEFINITION - What endpoint?
router.get("/blog/:blogId", async (req, res) => {
  // GET /api/comments/blog/123
});

// 4. ROUTE LOGIC - What happens?
router.get("/blog/:blogId", async (req, res) => {
  // A. Get parameter
  const { blogId } = req.params;
  
  // B. Query database
  const comments = await db
    .select()
    .from(comment)
    .where(eq(comment.blogId, blogId));
  
  // C. Return response
  res.json(comments);
});
```

**Follow this pattern for EVERY route:**
1. What HTTP method? (GET, POST, PUT, DELETE)
2. What URL path? (/api/comments/blog/:blogId)
3. What middleware? (auth, validation)
4. What does it do? (get comments for a blog)
5. What does it return? (array of comments)

---

#### Step 5: Understand ONE Service (10 minutes)
**Recommended:** `services/viewTrackingService.js`

**What to look for:**
```javascript
// 1. EXPORTS - What functions are available?
export const trackBlogView = async (blogId, ip, userAgent) => {
  // Track a view
};

export const getBlogViewCount = async (blogId) => {
  // Get view count
};

// 2. FUNCTION LOGIC - How does it work?
export const trackBlogView = async (blogId, ip, userAgent) => {
  // Step 1: Generate identifier
  const viewerIdentifier = generateViewerIdentifier(ip, userAgent);
  
  // Step 2: Check Redis cache
  const existingView = await redis.get(redisKey);
  if (existingView) return { isNewView: false };
  
  // Step 3: Store in Redis (24h expiry)
  await redis.setex(redisKey, 86400, Date.now());
  
  // Step 4: Store in database
  await db.insert(blogView).values({ blogId, viewerIdentifier });
  
  return { isNewView: true };
};
```

**Questions to answer:**
- ✅ What does this service do? (Track blog views)
- ✅ Why use Redis? (Fast cache, 24h deduplication)
- ✅ Why use database? (Permanent record)

---

### 💪 LEVEL 3: Deep Dive (Advanced)

#### Step 6: Follow ONE Complete Request (20 minutes)
**Example:** User creates a blog post

**Trace the flow:**

```
1. CLIENT
   POST /api/blogs
   Body: { title: "My Blog", content: "..." }

2. server.js
   ├─ Receives request
   ├─ Applies CORS middleware
   └─ Routes to blogRoutes.js

3. routes/blogRoutes.js
   router.post("/", getCurrentUser, validateBody(createBlogSchema), async (req, res) => {
     
     // A. getCurrentUser middleware runs first
     //    → Checks session cookie
     //    → Sets req.user
     
     // B. validateBody middleware runs second
     //    → Validates title, content, etc.
     //    → Returns 400 if invalid
     
     // C. Route handler runs third
     const { title, content } = req.body;
     
     // D. Generate slug
     const slug = generateSlug(title);
     
     // E. Insert into database
     const [newBlog] = await db.insert(blog).values({
       title,
       content,
       slug,
       authorId: req.user.id
     }).returning();
     
     // F. Return response
     res.status(201).json(newBlog);
   });

4. DATABASE
   ├─ Drizzle ORM converts to SQL
   ├─ PostgreSQL executes INSERT
   └─ Returns new blog with ID

5. RESPONSE
   Status: 201 Created
   Body: { id: 123, title: "My Blog", slug: "my-blog", ... }
```

**Now YOU trace another request:**
- Pick: GET /api/blogs (get all blogs)
- Open: `routes/blogRoutes.js`
- Find: `router.get("/", ...)`
- Trace: What happens step by step?

---

#### Step 7: Understand Middleware (15 minutes)

**Read these in order:**

1. **Authentication Middleware**
   ```javascript
   // routes/blogRoutes.js (line ~160)
   const getCurrentUser = async (req, res, next) => {
     // 1. Get session from cookie
     const session = await auth.api.getSession({ headers });
     
     // 2. Check if valid
     if (!session?.user) {
       return res.status(401).json({ error: "Unauthorized" });
     }
     
     // 3. Set user on request
     req.user = session.user;
     
     // 4. Continue to next middleware
     next();
   };
   ```

2. **Validation Middleware**
   ```javascript
   // validators/middleware.js
   export const validate = (schema, source = 'body') => {
     return async (req, res, next) => {
       try {
         // 1. Get data from request
         const dataToValidate = req[source]; // req.body, req.query, etc.
         
         // 2. Validate with Zod
         const validated = await schema.parseAsync(dataToValidate);
         
         // 3. Replace with validated data
         req[source] = validated;
         
         // 4. Continue
         next();
       } catch (error) {
         // 5. Return error if invalid
         return res.status(400).json({ error: "Validation failed" });
       }
     };
   };
   ```

**Key concept:** Middleware runs BEFORE your route handler!

```
Request → Middleware 1 → Middleware 2 → Route Handler → Response
          (auth)         (validation)     (your code)
```

---

### 🎓 LEVEL 4: Master Level

#### Step 8: Understand Validation Schemas (10 minutes)
**File:** `validators/schemas.js`

**Pick one schema:**
```javascript
export const createBlogSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .trim(),
  content: z.string()
    .min(1, 'Content is required'),
  categories: z.array(z.string()).optional().default([]),
});
```

**Understand:**
- `z.object({...})` - Defines shape of data
- `z.string()` - Must be a string
- `.min(1)` - Minimum length
- `.max(200)` - Maximum length
- `.trim()` - Remove whitespace
- `.optional()` - Not required
- `.default([])` - Default value if not provided

**Try to read:** What does `createCommentSchema` validate?

---

#### Step 9: Understand Database Queries (15 minutes)
**File:** Any route file (e.g., `routes/blogRoutes.js`)

**Common patterns:**

```javascript
// 1. SELECT (Read)
const blogs = await db
  .select()
  .from(blog)
  .where(eq(blog.authorId, userId));
// SQL: SELECT * FROM blog WHERE author_id = ?

// 2. INSERT (Create)
const [newBlog] = await db
  .insert(blog)
  .values({ title, content, authorId })
  .returning();
// SQL: INSERT INTO blog (title, content, author_id) VALUES (?, ?, ?) RETURNING *

// 3. UPDATE (Update)
await db
  .update(blog)
  .set({ title: "New Title" })
  .where(eq(blog.id, blogId));
// SQL: UPDATE blog SET title = ? WHERE id = ?

// 4. DELETE (Delete)
await db
  .delete(blog)
  .where(eq(blog.id, blogId));
// SQL: DELETE FROM blog WHERE id = ?

// 5. JOIN (Combine tables)
const blogsWithAuthors = await db
  .select({
    id: blog.id,
    title: blog.title,
    authorName: user.name,
  })
  .from(blog)
  .leftJoin(user, eq(blog.authorId, user.id));
// SQL: SELECT blog.id, blog.title, user.name 
//      FROM blog 
//      LEFT JOIN user ON blog.author_id = user.id
```

**Practice:** Find 3 different queries in `routes/blogRoutes.js`

---

#### Step 10: Understand Services (15 minutes)

**Services contain reusable business logic.**

**Example:** `services/emailService.js`

```javascript
class EmailService {
  // Function to send verification email
  async sendVerification({ email, name, verifyUrl }) {
    // 1. Create email transporter
    const transporter = nodemailer.createTransport({ ... });
    
    // 2. Prepare email content
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Verify your email",
      html: `<a href="${verifyUrl}">Click here</a>`,
    };
    
    // 3. Send email
    await transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
```

**Why services?**
- ✅ Reusable (call from multiple routes)
- ✅ Testable (test logic separately)
- ✅ Organized (keeps routes clean)

**Find:** Where is `emailService.sendVerification()` called?
**Answer:** `routes/authRoutes.js` (send verification route)

---

## 🎯 Practice Exercises

### Exercise 1: Trace a Request
Pick a route and trace it completely:
1. Find the route in `server.js`
2. Open the route file
3. Identify middleware
4. Read the handler logic
5. Find database queries
6. Understand the response

**Try:** GET /api/blogs/:id (get single blog)

---

### Exercise 2: Add Console Logs
Add logs to understand flow:

```javascript
router.post("/", getCurrentUser, async (req, res) => {
  console.log("1. Route handler started");
  console.log("2. User:", req.user);
  console.log("3. Body:", req.body);
  
  const { title } = req.body;
  console.log("4. Title:", title);
  
  const [newBlog] = await db.insert(blog).values({ ... });
  console.log("5. Created blog:", newBlog);
  
  res.json(newBlog);
  console.log("6. Response sent");
});
```

Run the server and make a request. Watch the logs!

---

### Exercise 3: Modify a Route
Start small:

```javascript
// Before
router.get("/", async (req, res) => {
  const blogs = await db.select().from(blog);
  res.json(blogs);
});

// After - Add a limit
router.get("/", async (req, res) => {
  const { limit = 10 } = req.query; // Get limit from query
  const blogs = await db
    .select()
    .from(blog)
    .limit(parseInt(limit)); // Apply limit
  res.json(blogs);
});
```

Test: `GET /api/blogs?limit=5`

---

## 📋 Reading Checklist

### Beginner Level
- [ ] Read `server.js` - Understand entry point
- [ ] Read `models/schema.js` - Understand database tables
- [ ] Read one simple route (e.g., `commentRoutes.js`)
- [ ] Understand one service (e.g., `viewTrackingService.js`)

### Intermediate Level
- [ ] Trace one complete request flow
- [ ] Understand authentication middleware
- [ ] Understand validation middleware
- [ ] Read 3 different route files

### Advanced Level
- [ ] Understand all validation schemas
- [ ] Understand all database query patterns
- [ ] Understand all services
- [ ] Understand Redis caching strategy

---

## 🗺️ Code Map (Where to Find Things)

```
backend/
├── server.js              ← START HERE (entry point)
│
├── config/                ← Configuration
│   ├── database.js        ← PostgreSQL connection
│   ├── redis.js           ← Redis connection
│   └── betterAuth.js      ← Authentication setup
│
├── models/                ← Database structure
│   └── schema.js          ← All tables defined here
│
├── routes/                ← API endpoints
│   ├── blogRoutes.js      ← /api/blogs/*
│   ├── commentRoutes.js   ← /api/comments/*
│   ├── authRoutes.js      ← /api/auth/*
│   └── ...
│
├── services/              ← Business logic
│   ├── authService.js     ← Authentication logic
│   ├── emailService.js    ← Email sending
│   ├── viewTrackingService.js ← View tracking
│   └── ...
│
├── validators/            ← Input validation
│   ├── schemas.js         ← Zod validation rules
│   └── middleware.js      ← Validation middleware
│
└── middleware/            ← Express middleware
    └── cors.js            ← CORS configuration
```

---

## 💡 Tips for Reading Code

### 1. Start Small
Don't try to understand everything at once. Pick ONE route, understand it completely.

### 2. Follow the Data
Track how data flows:
- Request body → Validation → Database → Response

### 3. Use Comments
Add comments as you read:
```javascript
// This checks if user is authenticated
const getCurrentUser = async (req, res, next) => {
  // Gets session from cookie
  const session = await auth.api.getSession({ ... });
  // ...
};
```

### 4. Draw Diagrams
Visual helps understanding:
```
Client → server.js → blogRoutes.js → database → Response
```

### 5. Run the Code
Best way to learn:
```bash
npm run dev
# Make requests
# Watch console logs
# See what happens
```

### 6. Ask Questions
For each file:
- What does this do?
- Why does it exist?
- How is it used?
- What happens if I change it?

---

## 🎉 You're Ready!

Start with **Step 1** (server.js) and work your way through. Take your time, add logs, experiment!

**Remember:** Every expert was once a beginner. Reading code is a skill that improves with practice.

Good luck! 🚀
