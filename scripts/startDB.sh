#!/bin/bash

# PostgreSQL configuration
DB_NAME="mydb"
DB_USER="myuser"
DB_PASSWORD="mypassword"
CONTAINER_NAME="my-postgres-container"
POSTGRES_VERSION="14"  # You can change this to your preferred version
POSTGRES_IMAGE="postgres:$POSTGRES_VERSION"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "\n❌❌❌ ERROR ❌❌❌"
    echo -e "===================================="
    echo -e "🐳 Docker is not running!"
    echo -e "   Please start Docker and try again."
    echo -e "====================================\n"
    exit 1
fi

# Stop and remove the existing container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping and removing existing PostgreSQL container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Check if the PostgreSQL image is available locally, if not pull it
if ! docker image inspect $POSTGRES_IMAGE > /dev/null 2>&1; then
    echo "PostgreSQL image not found locally. Pulling $POSTGRES_IMAGE..."
    docker pull $POSTGRES_IMAGE
fi

# Create and start new PostgreSQL container
echo "Creating and starting new PostgreSQL container..."
if ! docker run --name $CONTAINER_NAME \
    -e POSTGRES_DB=$DB_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -p 5432:5432 \
    -d $POSTGRES_IMAGE; then
    echo -e "\n❌❌❌ ERROR ❌❌❌"
    echo -e "===================================="
    echo -e "🐳 Failed to create PostgreSQL container!"
    echo -e "   Please check Docker logs and try again."
    echo -e "====================================\n"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
until docker exec $CONTAINER_NAME pg_isready > /dev/null 2>&1; do
    sleep 1
done

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

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
echo -e "🎉 PostgreSQL Setup Complete! 🎉"
echo -e "==========================================\n"

echo "🐘 PostgreSQL container is ready."
echo "📊 Local database '$DB_NAME' is accessible with user '$DB_USER'."
echo -e "\n🔗 Connection Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo -e "   Database URL: $DATABASE_URL\n"

echo -e "==========================================\n"
