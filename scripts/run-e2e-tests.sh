#!/bin/bash

set -e

echo "🚀 Starting E2E Test Suite"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test database configuration
TEST_DB_NAME="test_boilerplater"
TEST_DB_URL="postgresql://postgres:postgres@localhost:5433/${TEST_DB_NAME}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ ! -z "$TEST_CONTAINER_ID" ]; then
        echo "Stopping test database container..."
        docker stop "$TEST_CONTAINER_ID" >/dev/null 2>&1 || true
        docker rm "$TEST_CONTAINER_ID" >/dev/null 2>&1 || true
    fi
}

# Trap to ensure cleanup happens
trap cleanup EXIT

echo -e "${BLUE}📦 Setting up test database...${NC}"

# Start PostgreSQL container for testing
TEST_CONTAINER_ID=$(docker run -d \
    --name "test-postgres-$(date +%s)" \
    -e POSTGRES_DB="$TEST_DB_NAME" \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -p 5433:5432 \
    postgres:15-alpine)

echo "Test database container started: $TEST_CONTAINER_ID"

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
for i in {1..30}; do
    if docker exec "$TEST_CONTAINER_ID" pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Run database migrations on test database
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
export DATABASE_URL="$TEST_DB_URL"
npx drizzle-kit migrate

# Set test environment variables
export TEST_DATABASE_URL="$TEST_DB_URL"
export NODE_ENV=test
export EMAIL_VERIFICATION_SECRET="test-secret-for-email-verification"
export NEXTAUTH_SECRET="test-secret-for-nextauth"

# Run the E2E tests
echo -e "${BLUE}🧪 Running E2E tests...${NC}"
if npm run test:e2e; then
    echo -e "${GREEN}✅ All E2E tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ E2E tests failed${NC}"
    exit 1
fi