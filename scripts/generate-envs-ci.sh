#!/bin/bash

# CI-specific environment generation script
# This script generates .env file without user prompts, specifically for CI/E2E testing with GreenMail

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

# GreenMail SMTP settings for E2E testing
SMTP_SERVER_HOST="localhost"
SMTP_SERVER_USERNAME="test@localhost"
SMTP_SERVER_PASSWORD=""
SMTP_SERVER_PORT="3025"
SMTP_SERVICE=""

# Create .env file and populate it
cat <<EOL > .env
EMAIL_VERIFICATION_SECRET=$EMAIL_VERIFICATION_SECRET
EMAIL_PASSWORD_RESET_SECRET=$EMAIL_PASSWORD_RESET_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL 
NEXT_DATABASE_URL=$NEXT_DATABASE_URL
AUTH_DRIZZLE_URL=$AUTH_DRIZZLE_URL
SMTP_SERVER_HOST=$SMTP_SERVER_HOST
SMTP_SERVER_USERNAME=$SMTP_SERVER_USERNAME
SMTP_SERVER_PASSWORD="$SMTP_SERVER_PASSWORD"
SMTP_SERVER_PORT=$SMTP_SERVER_PORT
SMTP_SERVICE=$SMTP_SERVICE
EOL

echo ".env file has been generated for CI with GreenMail SMTP settings."