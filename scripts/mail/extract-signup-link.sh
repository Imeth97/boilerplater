#!/bin/bash

# Config
IMAP_HOST="localhost"
IMAP_PORT="3143"
USERNAME="test"
PASSWORD="secret"

# Fetch the full message
EMAIL_RAW=$( (echo "a1 LOGIN $USERNAME $PASSWORD";
              echo "a2 SELECT INBOX";
              echo "a3 FETCH 1:* (BODY[])";
              echo "a4 LOGOUT") | nc $IMAP_HOST $IMAP_PORT )

# Step 1: Remove soft line breaks (= at end of line)
CLEANED=$(echo "$EMAIL_RAW" | sed 's/=\r//g' | sed 's/=\n//g')

# Step 2: Decode =3D to =
CLEANED=$(echo "$CLEANED" | sed 's/=3D/=/g')

# Step 3: Flatten to single line
CLEANED=$(echo "$CLEANED" | tr -d '\n')

# Step 4: Extract first HTTP(S) link
LINK=$(echo "$CLEANED" | grep -oE 'https?://[^"]+')

# Output result
if [ -n "$LINK" ]; then
    echo "$LINK"
else
    echo "No link found."
fi
