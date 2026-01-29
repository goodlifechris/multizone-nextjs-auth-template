#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Next.js Multizone Setup Script                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
echo ""

# Install root dependencies
echo -e "${BLUE}📦 Installing root dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Root dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install root dependencies${NC}"
    exit 1
fi
echo ""

# Install workspace dependencies
echo -e "${BLUE}📦 Installing workspace dependencies...${NC}"
npm install --workspaces
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Workspace dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install workspace dependencies${NC}"
    exit 1
fi
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please update the .env file with your actual values!${NC}"
    echo ""
fi

# Copy .env to all apps
echo -e "${BLUE}📋 Copying .env to all apps...${NC}"
cp .env apps/host/.env.local
cp .env apps/user-app/.env.local
cp .env apps/admin-app/.env.local
echo -e "${GREEN}✓ .env files copied to all apps${NC}"
echo ""

# Generate Prisma Client
echo -e "${BLUE}🔧 Generating Prisma Client...${NC}"
npm run db:generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma Client generation skipped (configure database first)${NC}"
fi
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  Setup Complete! 🎉                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "1. ${YELLOW}Update .env file with your actual values:${NC}"
echo -e "   - DATABASE_URL (PostgreSQL connection string)"
echo -e "   - NEXTAUTH_SECRET (generate with: ${BLUE}openssl rand -base64 32${NC})"
echo -e "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo ""
echo -e "2. ${YELLOW}Setup Google OAuth:${NC}"
echo -e "   - Visit: ${BLUE}https://console.cloud.google.com${NC}"
echo -e "   - Create OAuth 2.0 credentials"
echo -e "   - Add callback URL: ${BLUE}http://localhost:3000/api/auth/callback/google${NC}"
echo ""
echo -e "3. ${YELLOW}Push database schema:${NC}"
echo -e "   ${BLUE}npm run db:push${NC}"
echo ""
echo -e "4. ${YELLOW}Start development servers:${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo -e "5. ${YELLOW}Access the apps:${NC}"
echo -e "   - Host: ${BLUE}http://localhost:3000${NC}"
echo -e "   - User App: ${BLUE}http://localhost:3001${NC}"
echo -e "   - Admin App: ${BLUE}http://localhost:3002${NC}"
echo ""
echo -e "${GREEN}For detailed documentation, see README.md${NC}"
echo ""
