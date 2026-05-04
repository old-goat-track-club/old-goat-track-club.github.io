#!/bin/bash

# Configuration
INPUT_DIR="/repo"
MAX_SIZE_KB=500
THRESHOLD_BYTES=$((MAX_SIZE_KB * 1024))

# 1. We use -print0 and 'read -d' to handle filenames with spaces perfectly
# 2. We prune (skip) the 'image-optimizer' folder and any hidden folders
find "$INPUT_DIR" \( -path "$INPUT_DIR/image-optimizer" -o -path '*/.*' \) -prune -o \
     -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0 | while read -r -d '' FILE; do

    # Check if FILE is empty (prevents the "integer expected" error)
    [ -z "$FILE" ] && continue

    FILE_SIZE=$(stat -c%s "$FILE" 2>/dev/null)
    
    # If stat fails for some reason, skip this file
    [ -z "$FILE_SIZE" ] && continue

    if [ "$FILE_SIZE" -le "$THRESHOLD_BYTES" ]; then
        echo "Skipping: $FILE (Already under limit)"
        continue
    fi

    echo "Optimizing: $FILE ($((FILE_SIZE/1024))KB)..."
    
    TEMP_FILE="${FILE}.tmp"

    # Using 'magick' instead of 'convert' for IMv7+
    if magick "$FILE" -resize "1920x1920>" -define jpeg:extent="${MAX_SIZE_KB}kb" "$TEMP_FILE"; then
        NEW_SIZE=$(stat -c%s "$TEMP_FILE")
        if [ "$NEW_SIZE" -lt "$FILE_SIZE" ]; then
            mv "$TEMP_FILE" "$FILE"
            echo "Success: New size $((NEW_SIZE/1024))KB"
        else
            echo "Warning: No size reduction. Keeping original."
            rm "$TEMP_FILE"
        fi
    else
        echo "Error: Failed to process $FILE"
        [ -f "$TEMP_FILE" ] && rm "$TEMP_FILE"
    fi
done
