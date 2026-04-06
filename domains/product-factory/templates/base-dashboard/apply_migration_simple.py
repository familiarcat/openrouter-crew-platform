#!/usr/bin/env python3
"""
Apply drill system migration to production Supabase database.
Uses Supabase SQL Editor programmatically.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing Supabase credentials in .env.local")

# Extract project ref from URL
project_ref = SUPABASE_URL.split('//')[1].split('.')[0]

print(f"🔗 Connecting to Supabase project: {project_ref}")
print(f"📍 URL: {SUPABASE_URL}")

# Read migration SQL
print("\n📖 Reading migration file...")
with open('supabase/migrations/20251220_create_drill_system.sql', 'r') as f:
    migration_sql = f.read()

print(f"📊 Migration file size: {len(migration_sql)} characters")

# Option 1: Try using Supabase Management API
print("\n🚀 Attempting to apply migration via Supabase Management API...")

# Construct the SQL endpoint
sql_endpoint = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

# This won't work without custom RPC function, so let's try the database endpoint
# Actually, let's use a more direct approach via postgrest

print("\n⚠️  Direct SQL execution via API requires additional setup.")
print("📋 Here are your options:")
print("\n" + "="*80)
print("OPTION 1: Manual Application (Recommended)")
print("="*80)
print(f"1. Open Supabase SQL Editor: {SUPABASE_URL.replace('https://', 'https://')}")
print("   Navigate to: SQL Editor in the dashboard")
print("2. Create a new query")
print("3. Paste the contents of: supabase/migrations/20251220_create_drill_system.sql")
print("4. Run the query")
print("\n" + "="*80)
print("OPTION 2: Using Supabase CLI")
print("="*80)
print("1. Run: supabase link --project-ref", project_ref)
print("2. Enter your database password when prompted")
print("3. Run: supabase db push")
print("\n" + "="*80)
print("OPTION 3: Using psql directly")
print("="*80)
print(f"1. Get your database direct connection string from:")
print(f"   {SUPABASE_URL.replace('https://', 'https://')}/project/{project_ref}/settings/database")
print("2. Run: psql 'your_connection_string' -f supabase/migrations/20251220_create_drill_system.sql")
print("="*80)

# Try to verify if tables already exist (to see if migration already applied)
print("\n🔍 Checking if tables already exist...")
try:
    from supabase import create_client

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Try to query each table
    tables = ['drill_scenarios', 'drill_runs', 'drill_executions', 'drill_evaluations']
    existing_tables = []

    for table in tables:
        try:
            result = supabase.table(table).select('id', count='exact').limit(0).execute()
            existing_tables.append(table)
            print(f"✓ {table}: exists (count: {result.count})")
        except Exception as e:
            print(f"✗ {table}: does not exist")

    if len(existing_tables) == 4:
        print("\n✅ All drill tables already exist! Migration may have been applied.")
    elif len(existing_tables) > 0:
        print(f"\n⚠️  Partial migration detected ({len(existing_tables)}/4 tables exist)")
        print("    Please complete the migration using one of the options above.")
    else:
        print("\n📝 No drill tables found. Please apply migration using one of the options above.")

except Exception as e:
    print(f"⚠️  Could not verify tables: {e}")
    print("    Please apply migration using one of the options above.")
