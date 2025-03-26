
# Manual Installation Guide

Since you're encountering issues with the automated setup, here's a step-by-step manual approach:

## 1. Set up PostgreSQL

Make sure PostgreSQL is running and create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create a new database 
CREATE DATABASE lms_db;

# Create a user (replace username/password as needed)
CREATE USER lms_user WITH ENCRYPTED PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;

# Exit PostgreSQL
\q
```

## 2. Update your .env file

Make sure your .env file has the correct database URL:

```
DATABASE_URL="postgresql://username:password@localhost:5432/lms_db"
```

Replace `username` and `password` with your PostgreSQL credentials.

## 3. Install Prisma and generate client

```bash
# Install Prisma CLI and client
npm install prisma @prisma/client

# Generate Prisma client
npx prisma generate

# Push schema to database (If this fails, see Section 7)
npx prisma db push
```

## 4. Seed the database

```bash
# Update package.json to include the seed script
node scripts/update-package-json.js

# Run the seed script
npx prisma db seed
```

## 5. Start the backend

```bash
# Navigate to the backend directory
cd backend

# Install ts-node if not already installed
npm install -g ts-node typescript

# Start the backend server
ts-node api.ts
```

## 6. Start the frontend (in a new terminal)

```bash
# Go back to project root if needed
cd ..

# Start the frontend
npm run dev
```

## 7. Handling Database Conflicts

If you encounter an error about views or rules when running `prisma db push`, like:

```
ERROR: cannot alter type of a column used by a view or rule
DETAIL: rule _RETURN on view student_details depends on column "batch_name"
```

Use our helper script:

```bash
node scripts/fix-prisma-migration.js
```

Or manually:

```bash
# Connect to PostgreSQL using the credentials from your .env file
psql -U your_username -d lms_db

# Drop the problematic view
DROP VIEW IF EXISTS student_details;

# Exit PostgreSQL
\q

# Run Prisma db push again
npx prisma db push
```

## Troubleshooting

If you encounter issues with Prisma:

1. Make sure your PostgreSQL service is running
2. Verify your database credentials are correct in the .env file
3. Try reinstalling Prisma: `npm uninstall prisma @prisma/client && npm install prisma @prisma/client`
4. Check PostgreSQL is listening on the expected port (default 5432)
5. For issues with views or dependencies, see Section 7 above
