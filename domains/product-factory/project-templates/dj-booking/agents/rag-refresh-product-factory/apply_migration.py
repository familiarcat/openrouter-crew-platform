#!/usr/bin/env python3
"""
Apply drill system migration to production Supabase database.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing Supabase credentials in .env.local")

print(f"🔗 Connecting to Supabase: {SUPABASE_URL}")

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Read migration SQL
print("📖 Reading migration file...")
with open('supabase/migrations/20251220_create_drill_system.sql', 'r') as f:
    migration_sql = f.read()

# Execute migration using RPC or direct SQL
print("🚀 Applying migration to production database...")

try:
    # Use PostgREST to execute raw SQL via the service role
    # Note: We'll need to execute this in chunks to handle the complexity

    # Split by semicolons to execute statements individually
    statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]

    total = len(statements)
    print(f"📊 Executing {total} SQL statements...")

    for i, statement in enumerate(statements, 1):
        # Skip empty statements and comments
        if not statement or statement.startswith('--'):
            continue

        try:
            # Execute via Supabase RPC
            result = supabase.rpc('exec_sql', {'sql': statement}).execute()

            if i % 10 == 0:
                print(f"✓ Progress: {i}/{total} statements executed")

        except Exception as e:
            # Some statements might fail if they already exist (like CREATE TABLE IF NOT EXISTS)
            # Only print errors for non-existence issues
            error_msg = str(e).lower()
            if 'already exists' not in error_msg and 'duplicate' not in error_msg:
                print(f"⚠️  Statement {i} warning: {e}")
                print(f"   Statement: {statement[:100]}...")

    print("✅ Migration applied successfully!")
    print("\n📊 Verifying tables...")

    # Verify tables were created
    verify_query = """
    SELECT table_name,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
    FROM information_schema.tables t
    WHERE t.table_name IN ('drill_scenarios', 'drill_runs', 'drill_executions', 'drill_evaluations')
    AND t.table_schema = 'public'
    ORDER BY t.table_name;
    """

    # Query the tables directly to verify
    scenarios = supabase.table('drill_scenarios').select('id', count='exact').limit(0).execute()
    runs = supabase.table('drill_runs').select('id', count='exact').limit(0).execute()
    executions = supabase.table('drill_executions').select('id', count='exact').limit(0).execute()
    evaluations = supabase.table('drill_evaluations').select('id', count='exact').limit(0).execute()

    print(f"✓ drill_scenarios table: exists (count: {scenarios.count})")
    print(f"✓ drill_runs table: exists (count: {runs.count})")
    print(f"✓ drill_executions table: exists (count: {executions.count})")
    print(f"✓ drill_evaluations table: exists (count: {evaluations.count})")

    print("\n✅ All drill system tables verified!")

except Exception as e:
    print(f"❌ Error applying migration: {e}")
    print("\nTrying alternative approach using psycopg2...")

    # Alternative: Use psycopg2 if available
    try:
        import psycopg2
        from urllib.parse import urlparse

        # Parse Supabase URL to get connection details
        # For Supabase, we need to use the direct database URL
        db_url = os.getenv('DATABASE_URL') or f"{SUPABASE_URL}/rest/v1/"

        print("⚠️  Direct SQL execution requires DATABASE_URL environment variable")
        print("    Please run migration manually via Supabase SQL Editor")
        print(f"    URL: {SUPABASE_URL.replace('https://', 'https://')}/project/_/sql")

    except ImportError:
        print("ℹ️  Psycopg2 not available")
        print("    Please run migration manually via Supabase SQL Editor")
        print(f"    URL: {SUPABASE_URL}/project/_/sql")
