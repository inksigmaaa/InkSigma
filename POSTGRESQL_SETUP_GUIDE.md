# PostgreSQL Setup Guide with pgAdmin

## Step 1: Open pgAdmin
1. Open pgAdmin 4 (installed with PostgreSQL)
2. Enter your master password if prompted
3. Expand "Servers" in the left panel
4. Click on "PostgreSQL [version]" - it will ask for the password you set during installation

## Step 2: Create a New Database
1. Right-click on "Databases"
2. Select "Create" → "Database..."
3. In the "General" tab:
   - Database name: `inksigma` (or your preferred name)
   - Owner: `postgres`
4. Click "Save"

## Step 3: Get Your Connection Details
Your connection string will be:
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/inksigma
```

Replace:
- `YOUR_PASSWORD` with the password you set during PostgreSQL installation
- `inksigma` with your database name if you chose a different one

## Step 4: Update .env.local
Replace the DATABASE_URL in your `.env.local` file with your new connection string.

## Step 5: Run Database Migration
After updating the .env.local file, run:
```bash
npm run db:push
```

This will create all the necessary tables (user, session, account, verification) in your local PostgreSQL database.

## Step 6: Verify in pgAdmin
1. In pgAdmin, expand your database → Schemas → public → Tables
2. You should see the tables: user, session, account, verification

## Troubleshooting

### Connection Failed
- Make sure PostgreSQL service is running (check Windows Services)
- Verify the password is correct
- Check if port 5432 is not blocked by firewall

### Tables Not Created
- Check the console output for errors
- Verify DATABASE_URL format is correct
- Make sure the database exists in pgAdmin

### Permission Errors
- Make sure the postgres user has proper permissions
- Try running pgAdmin as administrator

## Viewing Data in pgAdmin
1. Expand your database → Schemas → public → Tables
2. Right-click on a table (e.g., "user")
3. Select "View/Edit Data" → "All Rows"
4. You can see all records in the table
