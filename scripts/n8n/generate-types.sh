#!/bin/bash

# Generate TypeScript types from Supabase Schema

OUTPUT_FILE="packages/shared-schemas/database.types.ts"

echo "Generating Supabase types..."

# Ensure directory exists
mkdir -p $(dirname "$OUTPUT_FILE")

npx supabase gen types typescript --local > "$OUTPUT_FILE"
echo "Types generated at $OUTPUT_FILE"