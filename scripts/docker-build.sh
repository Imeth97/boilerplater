# If not provided, load environment variables from .env file
if [ -z "${NEXT_DATABASE_URL}" ]; then
    if [ -f ../.env ]; then
        source ../.env
    elif [ -f .env ]; then
        source .env
    else
        echo "Error: .env file not found in project root"
        exit 1
    fi
fi

# prompt if not on CI
if [ -z "${CI}" ]; then
    echo "This will re-seed the database and create a docker image. Are you sure you want to continue? (y/n)"
    read -s -n 1 answer
    if [ "$answer" != "y" ]; then
    echo "Aborting."
        exit 1
    fi
fi

echo "Starting database locally..."
scripts/startDB.sh

if [ -z "${NEXT_DATABASE_URL}" ]; then
    echo "Error: NEXT_DATABASE_URL environment variable is not set in .env file"
    echo "Please add NEXT_DATABASE_URL=your_database_url to your .env file"
    exit 1
fi

echo "Building docker image..."
docker build --build-arg DATABASE_URL=${NEXT_DATABASE_URL} --network=host -t my-image .