#!/bin/bash

# Script to create a Greenmail user
# Usage: ./scripts/mail/create-greenmail-user.sh <email> <login> <password>

if [ $# -ne 3 ]; then
    echo "Usage: $0 <email> <login> <password>"
    echo "Example: $0 test@localhost.com testuser secret"
    exit 1
fi

EMAIL="$1"
LOGIN="$2" 
PASSWORD="$3"

echo "Creating Greenmail user: $EMAIL with login: $LOGIN"

# First try to delete the user if it exists (ignore errors)
curl -s -X DELETE "http://localhost:8080/api/user/$(echo "$EMAIL" | sed 's/@/%40/g')" > /dev/null 2>&1

# Create the user
RESPONSE=$(curl -s -X POST "http://localhost:8080/api/user" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}" \
    -w "HTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    echo "Successfully created Greenmail user: $EMAIL"
    exit 0
else
    echo "Failed to create Greenmail user. HTTP Status: $HTTP_STATUS"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi