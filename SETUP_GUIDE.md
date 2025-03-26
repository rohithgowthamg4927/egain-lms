
# LMS Application Setup Guide

This guide will walk you through the process of setting up your Learning Management System (LMS) application to work with a real PostgreSQL database using Prisma ORM instead of mock data.

## Prerequisites

- Node.js (v14 or higher)
- Git
- PostgreSQL database
- Basic knowledge of terminal/command line

## Step 1: Clone the Repository

```bash
# Clone the repository from GitHub
git clone <your-repository-url>

# Navigate to the project directory
cd <your-project-folder>

# Install dependencies
npm install
```

## Step 2: Database Setup

### 2.1 Configure PostgreSQL

Make sure you have PostgreSQL installed and running. You can download it from [postgresql.org](https://www.postgresql.org/download/) if needed.

Create a new database for the LMS application:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create a new database
CREATE DATABASE lms_db;

# Create a new user (optional)
CREATE USER lms_user WITH ENCRYPTED PASSWORD 'your_password';

# Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;

# Exit PostgreSQL
\q
```

### 2.2 Update Environment Variables

Check your `.env` file to ensure it contains the correct database connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/lms_db"
```

Make sure to replace `username`, `password`, and possibly the port number with your PostgreSQL configuration.

## Step 3: Initialize the Database with Prisma

```bash
# Generate Prisma client based on your schema
npx prisma generate

# Push the schema to your database
npx prisma db push

# Seed the database with initial data (if you have a seed script)
npx prisma db seed
```

## Step 4: Run the Backend API Server

```bash
# Navigate to the backend directory (if separate)
cd backend

# Start the backend server
node api.ts
```

If you don't have TypeScript compilation set up for the backend, you might need to:

```bash
# Install ts-node globally (if not already installed)
npm install -g ts-node

# Run the backend using ts-node
ts-node api.ts
```

Keep this terminal window open as it needs to stay running.

## Step 5: Start the Frontend Application

Open a new terminal window:

```bash
# Navigate back to the project root (if needed)
cd ..

# Start the frontend development server
npm run dev
```

## Step 6: Verify the Application

1. Open your browser and navigate to the application (usually at http://localhost:5173)
2. Login with the admin credentials (admin@lms.com / Admin@123)
3. Verify that real data from the database is displayed instead of mock data

## Troubleshooting

### API Connection Issues

- Make sure the backend API server is running on port 3001
- Check that the frontend is making requests to the correct API URL (http://localhost:3001/api)
- Look for CORS errors in the browser console and ensure CORS is properly configured in the backend

### Database Connection Issues

- Verify your PostgreSQL server is running
- Double-check the DATABASE_URL in your .env file
- Ensure your PostgreSQL user has the necessary permissions
- Check for any error messages in the backend terminal

### Prisma Errors

- Run `npx prisma validate` to check your schema for errors
- Try `npx prisma generate` to regenerate the Prisma client
- For schema changes, run `npx prisma db push` to update the database

## Advanced: Using Migrations (Optional)

For a production environment, you might want to use Prisma migrations instead of `db push`:

```bash
# Create an initial migration
npx prisma migrate dev --name init

# Apply migrations to the database
npx prisma migrate deploy
```

## Important Notes

1. Always backup your database before making changes to the schema
2. Never expose your .env file with database credentials to version control
3. For production, use appropriate security measures for your API and database
4. Create a separate admin user with a secure password for production use

## Next Steps

- Implement proper authentication with JWT or OAuth
- Set up Redis caching for frequent database queries
- Create automated backups for your database
- Implement proper error handling for API requests
- Add comprehensive logging for debugging
