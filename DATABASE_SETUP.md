
# Database Setup Guide for LMS Application

This guide will help you set up the database for the Learning Management System (LMS) application.

## Prerequisites

1. **PostgreSQL Database** - Make sure PostgreSQL is installed and running on your machine
2. **Node.js and npm** - Required to run the setup scripts

## Step 1: Configure your Environment Variables

Make sure your `.env` file in the project root has the correct PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/lms-db"
```

Replace `username`, `password`, and the database name with your actual PostgreSQL credentials.

## Step 2: Install Dependencies

If you haven't already installed the project dependencies, run:

```bash
npm install
```

## Step 3: Run the Database Setup Script

Run the automated database setup script:

```bash
npx ts-node backend/setup-database.ts
```

This script will:
- Verify your database connection
- Create initial admin, instructor, and student users
- Create initial course categories
- Provide login credentials

## Step 4: Start the Backend Server

After the database is set up, start the backend server:

```bash
npx ts-node backend/server.ts
```

The server will run on http://localhost:3001 by default.

## Step 5: Start the Frontend Application

In a separate terminal, start the frontend:

```bash
npm run dev
```

The frontend will be available at http://localhost:5173 (or the port shown in your terminal).

## Login Credentials

After running the setup script, you can log in with the following default credentials:

- **Admin**: admin@lms.com / Admin@123
- **Instructor**: instructor@lms.com / Instructor@123
- **Student**: student@lms.com / Student@123

## Troubleshooting

If you encounter issues:

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check your connection string in the `.env` file
   - Ensure the database user has proper permissions

2. **Backend Server Issues**
   - Check the `/api/health` endpoint to verify database connectivity
   - Look for error messages in the terminal where the server is running

3. **Schema Issues**
   - Run `npx prisma validate` to check your schema
   - If schema changes are needed, run `npx prisma db push`
