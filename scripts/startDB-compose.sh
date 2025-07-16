#!/bin/bash

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "\n❌❌❌ ERROR ❌❌❌"
    echo -e "===================================="
    echo -e "🐳 Docker is not running!"
    echo -e "   Please start Docker and try again."
    echo -e "====================================\n"
    exit 1
fi

# Start PostgreSQL and SMTP server using docker-compose
echo "Starting PostgreSQL and SMTP server using docker-compose..."
docker-compose up -d db smtp

# Wait for PostgreSQL to be ready using healthcheck
echo "Waiting for PostgreSQL to start..."
until docker-compose exec -T db pg_isready -U myuser -d mydb > /dev/null 2>&1; do
    sleep 1
done

# Wait for SMTP server to be ready
echo "Waiting for SMTP server to start..."
until nc -z localhost 3025 > /dev/null 2>&1; do
    sleep 1
done

DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"

# if the --re-seed flag is passed, then run the seed script
if [ "$1" == "--re-seed" ]; then
    echo "Re-seeding the database..."
    DATABASE_URL=$DATABASE_URL npx drizzle-kit seed
fi

# Run migrations
DATABASE_URL=$DATABASE_URL npx drizzle-kit generate

# Apply migrations from ./drizzle
DATABASE_URL=$DATABASE_URL npx drizzle-kit migrate

# Add decorative lines and emojis
echo -e "\n=========================================="
echo -e "🎉 Development Environment Setup Complete! 🎉"
echo -e "==========================================\n"

echo "🐘 PostgreSQL container is ready."
echo "📊 Local database 'mydb' is accessible with user 'myuser'."
echo -e "\n🔗 Database Connection Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo -e "   Database URL: $DATABASE_URL\n"

echo "📧 GreenMail SMTP server is ready."
echo -e "\n🔗 SMTP Connection Details:"
echo "   Host: localhost"
echo "   Port: 3025 (SMTP)"
echo "   Web Interface: http://localhost:8080"
echo -e "   No authentication required for local development\n"

echo -e "==========================================\n"