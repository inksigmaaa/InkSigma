# InkSigma Backend API

Express.js backend server for InkSigma publication management.

## Structure

```
backend/
├── server.js           # Main server entry point
├── routes/             # API route definitions
├── controllers/        # Business logic handlers
├── models/            # Database models
├── middleware/        # Express middleware
├── utils/             # Utility functions (image processing, etc.)
└── db/                # Database configuration and schema
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

Or from root:
```bash
npm run backend:install
```

### 2. Environment Variables

The backend uses the `.env.local` file from the root directory.

Required variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/inksigma
PORT=3001
```

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

Or from root:
```bash
npm run backend:dev
```

**Production mode:**
```bash
npm start
```

Or from root:
```bash
npm run backend
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Publications
- `GET /api/publications/user/:userId` - Get publication by user ID
- `GET /api/publications/:id/settings` - Get publication settings
- `PUT /api/publications/:id/settings` - Update publication settings
- `PUT /api/publications/:id/subdomain` - Update subdomain
- `GET /api/publications/check-subdomain/:subdomain` - Check subdomain availability
- `POST /api/publications/:id/logo` - Upload logo
- `POST /api/publications/:id/favicon` - Upload favicon
- `POST /api/publications/:id/meta_og` - Upload OG image
- `DELETE /api/publications/:id/:imageType` - Remove image

### Static Files
- `/uploads/*` - Serve uploaded files (logos, favicons, images)

## Port

Default: `3001`

Can be changed via `PORT` environment variable.

## Development

The backend runs independently from the Next.js frontend:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Database

Uses PostgreSQL with Drizzle ORM. Database configuration is in `db/index.js`.

## File Uploads

Uploaded files are stored in the `uploads/` directory at the root level:
- `uploads/logo/` - Publication logos
- `uploads/favicon/` - Favicons
- `uploads/meta_og/` - Open Graph images
