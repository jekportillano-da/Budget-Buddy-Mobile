#!/usr/bin/env python3
"""
Direct Schema Import Script for Render PostgreSQL
Uses psycopg2 to import schema without requiring psql client
"""

import psycopg2
import sys
from pathlib import Path

# Render PostgreSQL connection details
DATABASE_CONFIG = {
    'host': 'dpg-d3hjcm8gjchc73ahttu0-a.singapore-postgres.render.com',
    'port': 5432,
    'database': 'budget_buddy_db_50pb',
    'user': 'budget_buddy_db_50pb_user',
    'password': 'VCdOXkMZdWVufdd4U7BDHrApyGPPM9py'
}

def import_schema():
    """Import schema from render_schema.sql"""
    schema_file = Path(__file__).parent / 'render_schema.sql'
    
    if not schema_file.exists():
        print(f"❌ Schema file not found: {schema_file}")
        return False
    
    try:
        print("🔗 Connecting to Render PostgreSQL...")
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()
        
        print("📖 Reading schema file...")
        with open(schema_file, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        print("🏗️ Importing schema...")
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ Schema imported successfully!")
        
        # Verify tables were created
        print("🔍 Verifying tables...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📋 Created {len(tables)} tables:")
        for table in tables:
            print(f"   ✅ {table[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_connection():
    """Test connection to Render PostgreSQL"""
    try:
        print("🧪 Testing connection...")
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Connected to: {version}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def main():
    print("=" * 60)
    print("🚀 Render PostgreSQL Schema Import")
    print("=" * 60)
    
    # Test connection first
    if not test_connection():
        print("❌ Connection test failed. Check your database details.")
        sys.exit(1)
    
    # Import schema
    if import_schema():
        print("\n🎉 Migration completed successfully!")
        print("✅ Your Render PostgreSQL database is ready!")
        print("\nNext steps:")
        print("1. Update your .env file with the new DATABASE_URL")
        print("2. Deploy to Render")
    else:
        print("❌ Schema import failed")
        sys.exit(1)

if __name__ == "__main__":
    main()