# Vercel Deployment Guide

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### 1. Database
```
DATABASE_URL=your-postgresql-connection-string
```
Get this from Neon, Supabase, or your PostgreSQL provider.

### 2. Better Auth
```
BETTER_AUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.vercel.app
BETTER_AUTH_SECRET=your-secure-random-secret-min-32-chars
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 3. Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Google OAuth Setup for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth client
3. Add your production URLs:

**Authorized JavaScript origins:**
```
https://your-domain.vercel.app
```

**Authorized redirect URIs:**
```
https://your-domain.vercel.app/api/auth/callback/google
```

## Deployment Steps

1. **Push to GitHub** (already done)

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the branch (e.g., `test-samar`)

3. **Add Environment Variables:**
   - In Vercel project settings → Environment Variables
   - Add all the variables listed above
   - Make sure to add them for Production, Preview, and Development

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

5. **Run Database Migration:**
   After first deployment, you need to push the database schema:
   
   ```bash
   # Locally, with production DATABASE_URL
   DATABASE_URL=your-production-db-url npm run db:push
   ```

## Troubleshooting

**Build fails with "DATABASE_URL is not set":**
- Make sure you added the environment variable in Vercel
- Redeploy after adding variables

**Google OAuth not working:**
- Check that you added the production redirect URI
- Wait 5-10 minutes for Google changes to propagate
- Make sure BETTER_AUTH_URL matches your Vercel domain

**Database connection errors:**
- Verify your DATABASE_URL is correct
- Make sure your database allows connections from Vercel IPs
- For Neon/Supabase, this is usually automatic
