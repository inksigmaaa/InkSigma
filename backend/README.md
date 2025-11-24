# InkSigma Backend

Express.js backend server for InkSigma with Better Auth authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random secret key for auth
- `RESEND_API_KEY`: Resend email service API key
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials

4. Run database migrations:
```bash
npm run db:push
```

## Development

Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## Production

Build and start:
```bash
npm start
```

## API Routes

### Authentication
- `POST /api/auth/sign-up` - Sign up
- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/send-verification-email` - Send verification email
- `POST /api/auth/verify-email` - Verify email

### Publications
- `GET /api/publication/check` - Check if user has a publication
- `GET /api/publication` - Get user's publication
- `POST /api/publication` - Create new publication
- `PUT /api/publication/:id` - Update publication

## Database

Migrations are managed with Drizzle Kit.

Generate new migrations:
```bash
npm run db:generate
```

Push migrations to database:
```bash
npm run db:push
```
