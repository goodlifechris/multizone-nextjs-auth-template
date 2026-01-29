# Next.js Multizone Monorepo with Shared Authentication

A complete Next.js multizone architecture with shared NextAuth authentication, Prisma database, and role-based access control.

## 🏗️ Architecture

- **Host App** (Port 3000) - Landing page and authentication
- **User App** (Port 3001) - User dashboard (accessible to users with role "USER")
- **Admin App** (Port 3002) - Admin panel (accessible to users with role "ADMIN")
- **Shared Packages** - Database (Prisma), Auth (NextAuth), and utilities

## 🚀 Features

- ✅ Single sign-on across all apps
- ✅ Google OAuth authentication
- ✅ Shared Prisma database
- ✅ Role-based access control (USER/ADMIN)
- ✅ Automatic role-based redirects
- ✅ Cross-app logout functionality
- ✅ Turborepo for efficient builds
- ✅ TypeScript support

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Install dependencies for all workspaces
npm install --workspaces
```

### 2. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your values:
# - DATABASE_URL (PostgreSQL connection string)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
```

### 3. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### 4. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view/edit data
npm run db:studio
```

### 5. Copy .env to each app

```bash
# Copy .env to all apps
cp .env apps/host/.env.local
cp .env apps/user-app/.env.local
cp .env apps/admin-app/.env.local
```

### 6. Run Development Servers

```bash
# Start all apps in parallel
npm run dev
```

The apps will be available at:
- Host: http://localhost:3000
- User App: http://localhost:3001
- Admin App: http://localhost:3002

## 🧪 Testing

### Create Test Users

After your first sign-in, you'll need to manually assign roles:

**Option 1: Using Prisma Studio**
```bash
npm run db:studio
```
Then navigate to the Users table and change the `role` field to either `USER` or `ADMIN`.

**Option 2: Using SQL**
```sql
-- Make user an admin
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';

-- Keep user as regular user
UPDATE users SET role = 'USER' WHERE email = 'user@example.com';
```

### Test Scenarios

1. **Regular User Flow:**
   - Sign in with Google
   - Should redirect to User Dashboard (`/user`)
   - Try accessing `/admin` - should be blocked

2. **Admin User Flow:**
   - Sign in with admin account
   - Should redirect to Admin Dashboard (`/admin`)
   - Should see list of all users

3. **Logout Flow:**
   - Sign out from any app
   - Should redirect to landing page
   - Session should be cleared across all apps

## 📁 Project Structure

```
multizone-project/
├── apps/
│   ├── host/              # Main authentication app
│   ├── user-app/          # User dashboard
│   └── admin-app/         # Admin panel
├── packages/
│   ├── database/          # Shared Prisma client
│   ├── auth/              # Shared NextAuth config
│   └── shared/            # Shared utilities & types
├── package.json           # Root package.json
├── turbo.json            # Turborepo config
└── .env                  # Environment variables
```

## 🔒 How Authentication Works

1. User visits host app (`localhost:3000`)
2. Clicks "Sign in with Google"
3. NextAuth handles OAuth flow
4. User data saved to PostgreSQL via Prisma
5. Based on role, user is redirected:
   - `ADMIN` → `/admin` (admin-app)
   - `USER` → `/user` (user-app)
6. Session is shared across all apps via database
7. Logout clears session from database, affecting all apps

## 🔑 Key Technologies

- **Next.js 14** - React framework with App Router
- **NextAuth.js** - Authentication
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Turborepo** - Monorepo build system
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## 📦 Available Scripts

```bash
# Development
npm run dev              # Run all apps in development mode

# Build
npm run build           # Build all apps for production

# Database
npm run db:generate     # Generate Prisma Client
npm run db:push         # Push schema to database
npm run db:studio       # Open Prisma Studio

# Cleanup
npm run clean           # Clean all build artifacts
```

## 🚀 Production Deployment

### Environment Variables

Update your `.env` for production:

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="secure-random-secret"
HOST_URL="https://yourdomain.com"
USER_APP_URL="https://user.yourdomain.com"
ADMIN_APP_URL="https://admin.yourdomain.com"
```

### Deployment Options

**Option 1: Vercel (Recommended)**
- Deploy each app separately
- Set environment variables in Vercel dashboard
- Configure custom domains

**Option 2: Docker**
- Build Docker images for each app
- Use Docker Compose for orchestration

**Option 3: Traditional VPS**
- Build apps: `npm run build`
- Use PM2 or similar for process management

### Database Migration

```bash
# Create migration
cd packages/database
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy
```

## 🔧 Troubleshooting

### Issue: "Cannot find module '@repo/database'"

**Solution:** Run `npm install` in the root and then `npm run db:generate`

### Issue: Authentication not working across apps

**Solution:** Ensure all apps have the same `NEXTAUTH_SECRET` in their `.env.local` files

### Issue: Database connection errors

**Solution:** Verify your `DATABASE_URL` is correct and PostgreSQL is running

### Issue: Google OAuth errors

**Solution:** 
1. Check that redirect URI is added in Google Console
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
3. Ensure `NEXTAUTH_URL` matches your callback URL

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Support

If you have questions or need help, please open an issue on GitHub.
