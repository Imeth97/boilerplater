#!/bin/bash

# Check if .env already exists in main directory
if [ -f .env ]; then
  echo ".env file already exists in the current directory. Exiting."
  exit 0
fi

# Function to generate a secure random string
generate_hash() {
  openssl rand -base64 32 | tr -d '/+=' | cut -c1-32
}

# Generate .env values
EMAIL_VERIFICATION_SECRET=$(generate_hash)
EMAIL_PASSWORD_RESET_SECRET=$(generate_hash)
NEXTAUTH_SECRET=$(generate_hash)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
AUTH_DRIZZLE_URL="$NEXT_DATABASE_URL"

# Create .env file and populate it
cat <<EOL > .env
EMAIL_VERIFICATION_SECRET=$EMAIL_VERIFICATION_SECRET
EMAIL_PASSWORD_RESET_SECRET=$EMAIL_PASSWORD_RESET_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL 
NEXT_DATABASE_URL=$NEXT_DATABASE_URL
AUTH_DRIZZLE_URL=$AUTH_DRIZZLE_URL
EOL

# Set default local greenmail SMTP values
SMTP_SERVER_HOST="localhost"
SMTP_SERVER_USERNAME="test@localhost.com"
SMTP_SERVER_PASSWORD=""
SMTP_SERVER_PORT="3025"
SMTP_SERVICE=""

# Append SMTP values to .env
cat <<EOL >> .env
SMTP_SERVER_HOST=$SMTP_SERVER_HOST
SMTP_SERVER_USERNAME=$SMTP_SERVER_USERNAME
SMTP_SERVER_PASSWORD="$SMTP_SERVER_PASSWORD"
SMTP_SERVER_PORT=$SMTP_SERVER_PORT
SMTP_SERVICE=$SMTP_SERVICE
EOL

# Confirmation message
echo ".env file has been successfully created with local greenmail SMTP configuration."
