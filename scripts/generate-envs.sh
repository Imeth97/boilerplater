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

# Notify user about additional credentials needed
cat <<EOL

The .env file has been generated with initial values. You also need to set up email credentials for the SMTP server.

Skip this step if you do not care about email sending for now.

Please note that depending on your email provier, the configuration might be different.
Please see src/components/email/sendEmail.ts to customize the email sending process.

Please provide the following details:
EOL

# Prompt user for SMTP credentials
read -p "SMTP_SERVER_HOST (e.g., smtp.gmail.com): " SMTP_SERVER_HOST
read -p "SMTP_SERVER_USERNAME: " SMTP_SERVER_USERNAME
read -sp "SMTP_SERVER_PASSWORD: " SMTP_SERVER_PASSWORD
printf "\n"
read -p "SMTP_SERVER_PORT (default 587): " SMTP_SERVER_PORT
SMTP_SERVER_PORT=${SMTP_SERVER_PORT:-587}
read -p "SMTP_SERVICE (e.g., gmail): " SMTP_SERVICE

# Append SMTP values to .env
cat <<EOL >> .env
SMTP_SERVER_HOST=$SMTP_SERVER_HOST
SMTP_SERVER_USERNAME=$SMTP_SERVER_USERNAME
SMTP_SERVER_PASSWORD="$SMTP_SERVER_PASSWORD"
SMTP_SERVER_PORT=$SMTP_SERVER_PORT
SMTP_SERVICE=$SMTP_SERVICE
EOL

# Confirmation message
echo ".env file has been successfully created and updated with SMTP credentials."
