# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials

## Installation (5 minutes)

### 1. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install all dependencies
- Create `.env` files
- Generate Prisma Client

### 2. Configure Environment Variables

Edit `.env` file:

```bash
# Required: PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# Required: Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"

# Required: Get from Google Cloud Console
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 3. Setup Google OAuth (2 minutes)

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Copy Client ID and Secret to `.env`

### 4. Initialize Database

```bash
# Push schema to database
npm run db:push
```

### 5. Start Development

```bash
# Start all apps
npm run dev
```

Apps will be available at:
- **Host**: http://localhost:3000 (Landing & Auth)
- **User App**: http://localhost:3001 (User Dashboard)
- **Admin App**: http://localhost:3002 (Admin Panel)

## 🧪 Testing

### Create Your First User

1. Visit http://localhost:3000
2. Click "Sign in with Google"
3. Complete OAuth flow
4. You'll be redirected to User Dashboard (default role is USER)

### Create Admin User

Open Prisma Studio:
```bash
npm run db:studio
```

Or use SQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Now sign out and sign in again - you'll be redirected to Admin Panel!

## 🎯 What to Try

1. **Sign in as User**
   - View user dashboard
   - Check profile information
   - Sign out

2. **Sign in as Admin**
   - View all users
   - See system statistics
   - Manage users
   - Sign out

3. **Test Cross-App Logout**
   - Sign in and navigate between apps
   - Sign out from any app
   - Verify session is cleared everywhere

## 📚 Project Structure

```
multizone-project/
├── apps/
│   ├── host/          # Port 3000 - Landing & Auth
│   ├── user-app/      # Port 3001 - User Dashboard
│   └── admin-app/     # Port 3002 - Admin Panel
├── packages/
│   ├── database/      # Shared Prisma
│   ├── auth/          # Shared NextAuth
│   └── shared/        # Shared utilities
└── .env              # Configuration
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start all apps

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push         # Push schema to DB
npm run db:studio       # Open Prisma Studio

# Build
npm run build           # Build all apps

# Production
npm run start           # Start production servers
```

## ❓ Troubleshooting

### "Cannot find module '@repo/database'"
```bash
npm run db:generate
```

### "Database connection failed"
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists

### "Google OAuth error"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check callback URL in Google Console
- Ensure NEXTAUTH_URL matches your domain

### "Session not working across apps"
- Ensure all apps have same NEXTAUTH_SECRET
- Check that .env.local exists in all apps
- Restart all development servers

## 🎉 Next Steps

- Customize the UI in each app
- Add more features to dashboards
- Set up CI/CD pipeline
- Deploy to production

For detailed documentation, see [README.md](./README.md)
