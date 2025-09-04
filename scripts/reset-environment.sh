#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}🔄 Environment Reset Utility${NC}"
echo -e "=================================="
echo -e "This will:"
echo -e "  • Stop and remove PostgreSQL and GreenMail containers"
echo -e "  • Stop any running Next.js dev servers"
echo -e "  • Restart database and GreenMail"
echo -e "  ${RED}• ERASE all local database data${NC}"
echo -e "==================================\n"

# Prompt for confirmation
read -p "Are you sure you want to reset the dev environment? This will erase the local DB and greenmail server. (Y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Reset cancelled.${NC}"
    exit 0
fi

echo -e "\n${BLUE}🚀 Starting environment reset...${NC}\n"

# Step 1: Stop and remove containers
echo -e "${BLUE}📦 Stopping and removing containers...${NC}"
docker stop my-postgres-container greenmail-smtp 2>/dev/null || true
docker rm my-postgres-container greenmail-smtp 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped and removed${NC}\n"

# Step 2: Kill any running Next.js processes
echo -e "${BLUE}🔪 Stopping any running Next.js processes...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true
echo -e "${GREEN}✅ Next.js processes stopped${NC}\n"

# Step 3: Remove Docker volumes to ensure clean state
echo -e "${BLUE}🗑️  Removing database volumes...${NC}"
docker volume rm boilerplater_postgres_data 2>/dev/null || true
echo -e "${GREEN}✅ Database volumes removed${NC}\n"

# Step 4: Restart database and GreenMail
echo -e "${BLUE}🐘 Restarting database and GreenMail server...${NC}"
if ! ./scripts/startDB-compose.sh; then
    echo -e "${RED}❌ Failed to start database and GreenMail server${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database and GreenMail server started${NC}\n"

echo -e "${GREEN}✅ Environment reset complete${NC}"
echo -e "${YELLOW}📧 GreenMail web interface: http://localhost:8080${NC}"
echo -e "${YELLOW}🔍 Next steps: Run 'yarn build' then 'yarn start' before running e2e tests${NC}"