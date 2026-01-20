# Backend Flow Documentation

## 🔄 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                           │
│              (Browser/Mobile App/API Client)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      1. SERVER.JS (Entry Point)                  │
│  • Express app initialization                                    │
│  • Port: 5000                                                    │
│  • CORS middleware applied                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. MIDDLEWARE LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ A. CORS (middleware/cors.js)                             │  │
│  │    • Allow cross-origin requests                         │  │
│  │    • Set headers                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ B. Body Parser (Express built-in)                        │  │
│  │    • Parse JSON bodies                                   │  │
│  │    • Parse URL-encoded data                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ C. Better Auth Middleware (config/betterAuth.js)         │  │
│  │    • Session management                                  │  │
│  │    • Cookie handling                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      3. ROUTE MATCHING                           │
│  • /api/auth/*          → authRoutes.js                         │
│  • /api/blogs/*         → blogRoutes.js                         │
│  • /api/comments/*      → commentRoutes.js                      │
│  • /api/publications/*  → publicationRoutes.js                  │
│  • /api/members/*       → memberRoutes.js                       │
│  • /api/notifications/* → notificationRoutes.js                 │
│  • /api/views/*         → viewRoutes.js                         │
│  • /api/profile/*       → profileRoutes.js                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. ROUTE HANDLER (routes/)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ A. Authentication Check (if required)                    │  │
│  │    • getCurrentUser() middleware                         │  │
│  │    • Verify session via Better Auth                      │  │
│  │    • Set req.user if authenticated                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ B. Validation (validators/middleware.js)                 │  │
│  │    • validateBody() / validateQuery()                    │  │
│  │    • Check against Zod schemas                           │  │
│  │    • Transform data (strings → numbers, trim, etc.)      │  │
│  │    • Return 400 error if invalid                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ C. Authorization Check (if required)                     │  │
│  │    • Check user permissions                              │  │
│  │    • Verify ownership/membership                         │  │
│  │    • Return 403 if unauthorized                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   5. BUSINESS LOGIC (services/)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • authService.js         - Authentication logic          │  │
│  │ • emailService.js        - Email sending                 │  │
│  │ • emailValidationService - Email validation              │  │
│  │ • viewTrackingService    - View/share tracking           │  │
│  │ • notificationService    - Notifications                 │  │
│  │ • schedulerService       - Blog scheduling               │  │
│  │ • invitationService      - Member invitations            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    6. DATA ACCESS LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ A. Cache Check (Redis - config/redis.js)                │  │
│  │    • Check if data exists in Redis                       │  │
│  │    • Return cached data if available                     │  │
│  │    • Skip database query                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ B. Database Query (Drizzle ORM)                          │  │
│  │    • Use schema from models/schema.js                    │  │
│  │    • Execute SQL via Drizzle                             │  │
│  │    • PostgreSQL database                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ C. Cache Update (if applicable)                          │  │
│  │    • Store result in Redis                               │  │
│  │    • Set expiration time                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    7. RESPONSE FORMATTING                        │
│  • Format data as JSON                                           │
│  • Set appropriate status code (200, 201, 400, 404, 500)       │
│  • Add headers if needed                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      8. SEND RESPONSE                            │
│                    Back to Client                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Detailed Flow Examples

### Example 1: Create Blog Post

```
1. CLIENT REQUEST
   POST /api/blogs
   Headers: { Cookie: "session=...", Content-Type: "application/json" }
   Body: { title: "My Blog", description: "...", content: "..." }

2. SERVER.JS
   ✓ Receives request on port 5000
   ✓ Applies CORS middleware
   ✓ Parses JSON body

3. ROUTE MATCHING
   ✓ Matches: POST /api/blogs → blogRoutes.js

4. ROUTE HANDLER (blogRoutes.js)
   ┌─────────────────────────────────────────┐
   │ A. Authentication                       │
   │    getCurrentUser() middleware          │
   │    ├─ Extract session from cookie       │
   │    ├─ Call Better Auth API              │
   │    ├─ Verify session is valid           │
   │    └─ Set req.user = { id, email, ... } │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ B. Validation                           │
   │    validateBody(createBlogSchema)       │
   │    ├─ Check title exists & length       │
   │    ├─ Check description exists & length │
   │    ├─ Check content exists              │
   │    ├─ Transform/trim strings            │
   │    └─ Return 400 if invalid             │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ C. Authorization                        │
   │    ├─ Check if publicationId provided   │
   │    ├─ Verify user has access            │
   │    └─ Return 403 if unauthorized        │
   └─────────────────────────────────────────┘

5. BUSINESS LOGIC
   ┌─────────────────────────────────────────┐
   │ • Generate slug from title              │
   │ • Ensure slug is unique                 │
   │ • Sync status and published fields      │
   │ • Prepare blog data object              │
   └─────────────────────────────────────────┘

6. DATA ACCESS
   ┌─────────────────────────────────────────┐
   │ A. Database Insert                      │
   │    db.insert(blog).values({...})        │
   │    ├─ Use Drizzle ORM                   │
   │    ├─ Insert into PostgreSQL            │
   │    └─ Return new blog with ID           │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ B. Post-Insert Actions                  │
   │    ├─ If scheduled: notify scheduler    │
   │    ├─ If review: send notifications     │
   │    └─ Clear related caches              │
   └─────────────────────────────────────────┘

7. RESPONSE
   Status: 201 Created
   Body: { id: 123, title: "My Blog", slug: "my-blog", ... }

8. CLIENT RECEIVES
   ✓ Blog created successfully
```

---

### Example 2: View Blog (with Redis Caching)

```
1. CLIENT REQUEST
   GET /api/blogs/slug/my-blog?incrementView=true

2. SERVER.JS → ROUTE MATCHING
   GET /api/blogs/slug/:slug → blogRoutes.js

3. ROUTE HANDLER
   ┌─────────────────────────────────────────┐
   │ A. Optional Authentication              │
   │    ├─ Try to get session                │
   │    └─ Set currentUserId if found        │
   └─────────────────────────────────────────┘

4. BUSINESS LOGIC
   ┌─────────────────────────────────────────┐
   │ A. Fetch Blog                           │
   │    db.select().from(blog)               │
   │    .where(eq(blog.slug, 'my-blog'))     │
   └─────────────────────────────────────────┘

5. DATA ACCESS
   ┌─────────────────────────────────────────┐
   │ A. Database Query                       │
   │    ├─ Query blog by slug                │
   │    ├─ Join with user table (author)     │
   │    └─ Return blog data                  │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ B. View Tracking (if incrementView)     │
   │    viewTrackingService.trackBlogView()  │
   │    ├─ Generate viewer identifier        │
   │    │   (hash of IP + User Agent)        │
   │    ├─ Check Redis cache                 │
   │    │   Key: blog:123:view:abc123        │
   │    ├─ If exists → Skip (within 24h)     │
   │    ├─ If not exists:                    │
   │    │   ├─ Store in Redis (24h expiry)   │
   │    │   └─ Insert into blog_view table   │
   │    └─ Return { isNewView: true/false }  │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ C. Get View Count                       │
   │    ├─ Query blog_view table             │
   │    ├─ Count records for this blog       │
   │    └─ Add to response                   │
   └─────────────────────────────────────────┘

6. RESPONSE
   Status: 200 OK
   Body: { 
     id: 123, 
     title: "My Blog", 
     content: "...",
     views: 42,
     author: { name: "John", ... }
   }
```

---

### Example 3: User Authentication Flow

```
1. CLIENT REQUEST
   POST /api/auth/sign-in
   Body: { email: "user@example.com", password: "password123" }

2. SERVER.JS → ROUTE MATCHING
   POST /api/auth/sign-in → Better Auth handles this

3. BETTER AUTH (config/betterAuth.js)
   ┌─────────────────────────────────────────┐
   │ A. Email Validation                     │
   │    emailValidationService.validateEmail()│
   │    ├─ Check format (validator.js)       │
   │    ├─ Check disposable domain           │
   │    └─ Return error if invalid           │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ B. Find User                            │
   │    authService.findUserByEmail()        │
   │    ├─ Query user table                  │
   │    └─ Return user or null               │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ C. Verify Password                      │
   │    ├─ Get hashed password from DB       │
   │    ├─ Compare with bcrypt               │
   │    └─ Return error if mismatch          │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ D. Create Session                       │
   │    ├─ Generate session token            │
   │    ├─ Store in session table            │
   │    ├─ Set secure HTTP-only cookie       │
   │    └─ Return session data               │
   └─────────────────────────────────────────┘

4. RESPONSE
   Status: 200 OK
   Headers: { Set-Cookie: "session=...; HttpOnly; Secure" }
   Body: { user: { id, email, name, ... }, session: {...} }
```

---

### Example 4: Comment Creation (Guest or Authenticated)

```
1. CLIENT REQUEST
   POST /api/comments
   Body: { 
     blogId: 123, 
     content: "Great post!",
     guestName: "John" (if guest)
   }

2. ROUTE HANDLER (commentRoutes.js)
   ┌─────────────────────────────────────────┐
   │ A. Optional Authentication              │
   │    optionalAuth middleware              │
   │    ├─ Try to get session                │
   │    ├─ Set req.user if found             │
   │    └─ Continue even if not found        │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ B. Validation                           │
   │    validateBody(createCommentSchema)    │
   │    ├─ Check blogId is number            │
   │    ├─ Check content length (1-2000)     │
   │    ├─ Trim content                      │
   │    └─ Validate guestName if provided    │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ C. Guest Check                          │
   │    if (!req.user && !guestName)         │
   │    └─ Return 400 error                  │
   └─────────────────────────────────────────┘

3. BUSINESS LOGIC
   ┌─────────────────────────────────────────┐
   │ A. Verify Blog Exists                   │
   │    db.select().from(blog)               │
   │    .where(eq(blog.id, blogId))          │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ B. Prepare Comment Data                 │
   │    if (req.user):                       │
   │      authorId = req.user.id             │
   │    else:                                │
   │      guestName = provided name          │
   │      guestEmail = provided email        │
   └─────────────────────────────────────────┘

4. DATA ACCESS
   ┌─────────────────────────────────────────┐
   │ A. Insert Comment                       │
   │    db.insert(comment).values({...})     │
   │    └─ Return new comment with ID        │
   └─────────────────────────────────────────┘
   ┌─────────────────────────────────────────┐
   │ B. Fetch with Author Info               │
   │    if (authenticated):                  │
   │      Join with user table               │
   │      Return comment with author data    │
   └─────────────────────────────────────────┘

5. RESPONSE
   Status: 201 Created
   Body: { 
     id: 456, 
     content: "Great post!",
     guestName: "John" (if guest),
     author: { name, image } (if authenticated),
     createdAt: "2025-01-19T..."
   }
```

---

## 🔐 Authentication Flow Details

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. User Signs Up
   ├─ POST /api/auth/sign-up (Better Auth)
   ├─ Validate email (emailValidationService)
   ├─ Hash password (bcrypt via Better Auth)
   ├─ Create user in database
   ├─ Generate verification token
   ├─ Send verification email (emailService)
   └─ Return user data (not logged in yet)

2. User Verifies Email
   ├─ Click link in email
   ├─ POST /api/custom/verify-email
   ├─ Validate token
   ├─ Update user.emailVerified = true
   └─ Delete verification token

3. User Signs In
   ├─ POST /api/auth/sign-in (Better Auth)
   ├─ Find user by email
   ├─ Verify password with bcrypt
   ├─ Create session in database
   ├─ Set HTTP-only secure cookie
   └─ Return user + session data

4. Authenticated Requests
   ├─ Client sends cookie with request
   ├─ getCurrentUser() middleware
   ├─ Extract session from cookie
   ├─ Verify session in database
   ├─ Load user data
   └─ Set req.user for route handler

5. User Signs Out
   ├─ POST /api/auth/sign-out (Better Auth)
   ├─ Delete session from database
   ├─ Clear cookie
   └─ Return success
```

---

## 📊 Data Flow Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         LAYER ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

Layer 1: PRESENTATION (Routes)
├─ Handles HTTP requests/responses
├─ Thin layer - delegates to services
├─ Applies middleware (auth, validation)
└─ Files: routes/*.js

Layer 2: BUSINESS LOGIC (Services)
├─ Contains core application logic
├─ Reusable across multiple routes
├─ Handles complex operations
└─ Files: services/*.js

Layer 3: DATA ACCESS (Drizzle ORM)
├─ Database queries and operations
├─ Schema definitions
├─ Migrations
└─ Files: models/schema.js, drizzle/*

Layer 4: CACHING (Redis)
├─ Fast data retrieval
├─ Session storage
├─ Rate limiting
└─ Files: config/redis.js

Layer 5: EXTERNAL SERVICES
├─ Email (Nodemailer)
├─ Authentication (Better Auth)
├─ File Storage (Local uploads/)
└─ Database (PostgreSQL)
```

---

## 🔄 Common Patterns

### Pattern 1: CRUD Operations
```
1. CREATE: POST /api/resource
   → Validate → Insert DB → Return 201

2. READ: GET /api/resource/:id
   → Check cache → Query DB → Cache result → Return 200

3. UPDATE: PUT /api/resource/:id
   → Auth → Validate → Update DB → Clear cache → Return 200

4. DELETE: DELETE /api/resource/:id
   → Auth → Check ownership → Delete DB → Clear cache → Return 200
```

### Pattern 2: With Redis Caching
```
1. Check Redis cache
   ├─ If found: Return cached data (fast)
   └─ If not found: Continue to database

2. Query database
   └─ Get data from PostgreSQL

3. Store in Redis
   ├─ Set key with data
   ├─ Set expiration (e.g., 24 hours)
   └─ Return data to client

4. Next request
   └─ Served from Redis (much faster)
```

### Pattern 3: With Validation
```
1. Request arrives
2. Validation middleware runs FIRST
   ├─ Parse request data
   ├─ Check against Zod schema
   ├─ Transform data
   └─ Return 400 if invalid
3. Route handler runs (data is clean)
4. Business logic (no validation needed)
5. Database operation
6. Response
```

---

## 🎯 Key Takeaways

1. **Layered Architecture**: Routes → Services → Data Access
2. **Middleware Chain**: CORS → Body Parser → Auth → Validation → Route Handler
3. **Validation First**: Always validate before processing
4. **Caching Strategy**: Redis for frequently accessed data
5. **Authentication**: Better Auth handles sessions, cookies, password hashing
6. **Error Handling**: Consistent error responses at each layer
7. **Separation of Concerns**: Each file has a single responsibility

---

**This flow ensures:**
✅ Security (auth, validation)  
✅ Performance (caching)  
✅ Maintainability (clear layers)  
✅ Scalability (service-oriented)  
✅ Reliability (error handling)
