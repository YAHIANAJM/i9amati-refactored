# I9AMATI Setup and Usage Guide

This document outlines the recent infrastructure changes, how to run the application locally, and how to manage user accounts.

## 1. What We Did (Infrastructure & Auth Setup)

We transitioned the project into a proper monorepo setup and integrated a robust authentication and database system:

- **Turborepo Integration**: We added `turbo` to manage our monorepo workspaces (`apps/api`, `apps/web`, `apps/mobile`, and `packages/shared`). This allows us to run both the frontend and backend concurrently with a single command.
- **Docker Compose for Database**: We created a `docker-compose.yml` file at the root to spin up a local PostgreSQL instance (`postgres:15-alpine`) for development and testing. Production now uses `docker-compose.prod.yml` to run the API and PostgreSQL in Docker containers behind host Nginx.
- **Better Auth Configuration**: We explicitly configured the Better Auth client and server with the required environment variables (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS`). 
- **Database Seeding**: We created a robust seed script (`apps/api/src/prisma/seed.ts`) that programmatically uses Better Auth to hash passwords and link accounts, creating an initial **Syndic** user, a Syndic Organization, and a Residence.

## 2. How to Use the App

### Prerequisites
Make sure you have Docker installed and running on your machine.

### Starting the Development Environment

To start the database, the backend API, and the frontend web app all at once, simply run this from the root of the project:

```bash
npm run dev
```

**What happens under the hood:**
1. `docker compose up -d postgres` runs to ensure your database is up.
2. `turbo run dev` executes, which simultaneously starts your Vite frontend and your API backend on your local machine.

### Production Deployment

On the VPS, use Docker Compose instead of PM2:

1. Configure `apps/api/.env.production` with your secrets.
2. From the repo root on the VPS, run `API_DOMAIN=srv1765015.hstgr.cloud CERTBOT_EMAIL=you@example.com bash deploy/setup.sh` once to configure Nginx and Certbot. Docker must already be installed on the VPS.
3. Run `bash deploy/deploy.sh` for each release to pull code, rebuild the API image, run migrations, and restart the stack.

### Database Management

If you ever change your `schema.prisma` file, you can apply the changes to your local database using:

```bash
npm --workspace apps/api run db:push
```

If you need to view or edit the database directly via a GUI, run:

```bash
npm --workspace apps/api run db:studio
```

## 3. How to Add a New Account

Because we are using Better Auth, user accounts should not be created manually via raw SQL or raw Prisma inserts unless you are properly hashing the passwords with `bcryptjs` and creating the linked `Account` records.

### Method 1: Using the UI (Recommended)
The easiest way to add a new account is to start the app (`npm run dev`) and use the frontend Sign Up or Invitation flow. Better Auth handles the password hashing, session creation, and organization linking automatically.

### Method 2: Programmatically (For Seeding)
If you need to programmatically create an account (e.g., for testing or seeding), use the Better Auth API. You can see an example of this in `apps/api/src/prisma/seed.ts`:

```typescript
import { auth } from '../auth';

// 1. Create the user using Better Auth
const result = await auth.api.signUpEmail({
  body: {
    email: "newuser@example.com",
    password: "securepassword123",
    name: "New User",
  }
});

// 2. Update additional fields via Prisma if necessary
if (result && result.user) {
  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: 'tenant' } // Or 'owner', 'syndic', etc.
  });
}
```

### Initial Syndic Account
If you need to log in right now to test the app, we have already seeded an initial Syndic account for you:
- **Email**: `syndic@i9amati.com`
- **Password**: `password123`
- **Role**: Syndic
- **Organization**: Acme Syndic Management
