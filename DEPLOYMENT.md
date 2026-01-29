# 🚀 Production Deployment Guide

## Overview

This guide covers deploying your Next.js multizone application to production environments.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Google OAuth production credentials configured
- [ ] Domain names configured
- [ ] SSL certificates ready
- [ ] Error monitoring setup (optional)

## 🌐 Environment Variables for Production

Update your `.env` file for production:

```env
# Production Database
DATABASE_URL="postgresql://user:pass@production-host:5432/production_db"

# Production URLs
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="secure-random-secret-min-32-chars"

# Google OAuth Production
GOOGLE_CLIENT_ID="production-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="production-client-secret"

# Production App URLs
HOST_URL="https://yourdomain.com"
USER_APP_URL="https://user.yourdomain.com"
ADMIN_APP_URL="https://admin.yourdomain.com"

# Public URLs (client-side)
NEXT_PUBLIC_HOST_URL="https://yourdomain.com"
NEXT_PUBLIC_USER_APP_URL="https://user.yourdomain.com"
NEXT_PUBLIC_ADMIN_APP_URL="https://admin.yourdomain.com"
```

## 🎯 Deployment Options

### Option 1: Vercel (Recommended)

**Advantages:**
- Automatic deployments
- Edge network
- Built-in SSL
- Easy scaling

**Steps:**

1. **Deploy Database Package**
   ```bash
   # Not deployed - used by apps
   ```

2. **Deploy Host App**
   ```bash
   cd apps/host
   vercel deploy --prod
   ```
   - Set environment variables in Vercel dashboard
   - Configure domain: `yourdomain.com`

3. **Deploy User App**
   ```bash
   cd apps/user-app
   vercel deploy --prod
   ```
   - Set environment variables
   - Configure domain: `user.yourdomain.com`

4. **Deploy Admin App**
   ```bash
   cd apps/admin-app
   vercel deploy --prod
   ```
   - Set environment variables
   - Configure domain: `admin.yourdomain.com`

5. **Configure Google OAuth**
   - Add production callback: `https://yourdomain.com/api/auth/callback/google`

6. **Run Database Migrations**
   ```bash
   cd packages/database
   npx prisma migrate deploy
   ```

### Option 2: Docker + VPS

**Advantages:**
- Full control
- Cost-effective
- Custom infrastructure

**Docker Setup:**

1. **Create Dockerfile for Host App** (`apps/host/Dockerfile`):
   ```dockerfile
   FROM node:18-alpine AS base
   
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   COPY packages/database ./packages/database
   COPY packages/auth ./packages/auth
   COPY packages/shared ./packages/shared
   RUN npm ci
   
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
         POSTGRES_DB: ${DB_NAME}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
     
     host:
       build:
         context: ./apps/host
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: ${DATABASE_URL}
         NEXTAUTH_URL: ${NEXTAUTH_URL}
         NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
         GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
         GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
       depends_on:
         - postgres
     
     user-app:
       build:
         context: ./apps/user-app
       ports:
         - "3001:3001"
       environment:
         DATABASE_URL: ${DATABASE_URL}
         NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
         HOST_URL: ${HOST_URL}
       depends_on:
         - postgres
     
     admin-app:
       build:
         context: ./apps/admin-app
       ports:
         - "3002:3002"
       environment:
         DATABASE_URL: ${DATABASE_URL}
         NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
         HOST_URL: ${HOST_URL}
       depends_on:
         - postgres
   
   volumes:
     postgres_data:
   ```

3. **Deploy**:
   ```bash
   docker-compose up -d
   ```

4. **Nginx Reverse Proxy** (`/etc/nginx/sites-available/multizone`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   
   server {
       listen 80;
       server_name user.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   
   server {
       listen 80;
       server_name admin.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3002;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 3: AWS / DigitalOcean

**Using AWS Amplify / Elastic Beanstalk:**

1. Create 3 separate applications (host, user-app, admin-app)
2. Configure environment variables
3. Set up RDS for PostgreSQL
4. Configure Route 53 for DNS
5. Deploy each app independently

## 🔒 Security Checklist

- [ ] Use strong NEXTAUTH_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL on all domains
- [ ] Set secure cookie settings in production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up database connection pooling
- [ ] Use environment-specific OAuth credentials
- [ ] Enable security headers
- [ ] Set up monitoring and logging
- [ ] Regular security updates

## 🗃️ Database Migration

### Development to Production

```bash
# 1. Create migration
cd packages/database
npx prisma migrate dev --name production_init

# 2. Deploy to production
npx prisma migrate deploy

# 3. Verify migration
npx prisma migrate status
```

### Backup Strategy

```bash
# PostgreSQL backup
pg_dump -U username -d database_name > backup.sql

# Restore
psql -U username -d database_name < backup.sql
```

## 📊 Monitoring Setup

### Error Tracking (Sentry)

1. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   ```

2. Add to each app:
   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

### Analytics

- Google Analytics
- Vercel Analytics
- Custom analytics solution

## 🚦 Performance Optimization

1. **Enable ISR (Incremental Static Regeneration)**
   ```javascript
   export const revalidate = 60; // Revalidate every 60 seconds
   ```

2. **Database Connection Pooling**
   ```javascript
   // Add to packages/database/index.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=20`
       }
     }
   });
   ```

3. **Enable Compression**
4. **CDN for static assets**
5. **Image optimization**

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 🆘 Rollback Strategy

1. **Database Rollback**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

2. **Application Rollback**
   - Vercel: Revert to previous deployment
   - Docker: Use previous image tag
   - Manual: Restore from backup

## 📝 Post-Deployment Tasks

- [ ] Test all authentication flows
- [ ] Verify role-based access control
- [ ] Test logout across all apps
- [ ] Check database connections
- [ ] Monitor error logs
- [ ] Verify email notifications (if any)
- [ ] Test mobile responsiveness
- [ ] Check SSL certificates
- [ ] Verify Google OAuth flow

## 🎯 Scaling Considerations

1. **Horizontal Scaling**
   - Deploy multiple instances
   - Use load balancer

2. **Database Scaling**
   - Connection pooling
   - Read replicas
   - Caching layer (Redis)

3. **CDN Setup**
   - Cloudflare
   - CloudFront
   - Vercel Edge Network

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review Google OAuth settings
5. Check domain/DNS configuration

## 🎉 Success!

Your multizone application is now deployed and running in production!
