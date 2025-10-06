#!/bin/bash
# Budget Buddy Database Migration Script
# Export from Supabase and Import to Render PostgreSQL

set -e  # Exit on any error

echo "🔄 Starting Budget Buddy Database Migration..."
echo "From: Supabase PostgreSQL"
echo "To: Render PostgreSQL"
echo "=================================================="

# Configuration
SUPABASE_HOST="aws-1-ap-southeast-1.pooler.supabase.com"
SUPABASE_USER="postgres.muiuzeprorylariammzz"
SUPABASE_DB="postgres"
SUPABASE_PORT="5432"

# These will be provided after Render DB creation
RENDER_HOST="dpg-xxxxx-a.oregon-postgres.render.com"  # Replace with actual
RENDER_USER="budget_buddy_user"                        # Replace with actual  
RENDER_DB="budget_buddy"                              # Replace with actual
RENDER_PORT="5432"

BACKUP_FILE="budget_buddy_backup.sql"
SCHEMA_FILE="render_schema.sql"

echo "📤 Step 1: Exporting data from Supabase..."

# Export schema and data from Supabase
# Note: We'll adapt the schema for standalone PostgreSQL (no Supabase auth)
pg_dump \
  --host="$SUPABASE_HOST" \
  --port="$SUPABASE_PORT" \
  --username="$SUPABASE_USER" \
  --dbname="$SUPABASE_DB" \
  --no-owner \
  --no-privileges \
  --no-acl \
  --schema=public \
  --exclude-table-data=auth.* \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=realtime \
  --exclude-schema=supabase_functions \
  --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Supabase export completed: $BACKUP_FILE"
else
    echo "❌ Supabase export failed!"
    exit 1
fi

echo "🔧 Step 2: Adapting schema for Render PostgreSQL..."

# Create adapted schema for standalone PostgreSQL
cat > "$SCHEMA_FILE" << 'EOF'
-- Adapted Budget Buddy Schema for Render PostgreSQL
-- Removes Supabase-specific dependencies

-- Users table (replaces auth.users dependency)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  hashed_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  tier TEXT DEFAULT 'Starter',
  total_savings DECIMAL(12,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- User Profiles Table (adapted to reference users table)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  contact_number TEXT,
  email TEXT NOT NULL,
  address TEXT,
  location TEXT CHECK (location IN ('ncr', 'province')) DEFAULT 'ncr',
  
  -- Employment Information  
  employment_status TEXT CHECK (employment_status IN ('employed', 'self_employed', 'freelancer', 'student', 'unemployed', 'retired')) DEFAULT 'employed',
  monthly_gross_income DECIMAL(12,2) DEFAULT 0,
  monthly_net_income DECIMAL(12,2) DEFAULT 0,
  
  -- Family Information
  has_spouse BOOLEAN DEFAULT false,
  spouse_income DECIMAL(12,2),
  number_of_dependents INTEGER DEFAULT 0,
  
  -- User tier for gamification
  tier TEXT DEFAULT 'Starter',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App Settings Table (adapted to reference users table)
CREATE TABLE IF NOT EXISTS app_settings (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  currency TEXT DEFAULT 'PHP',
  notifications BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Data Table
CREATE TABLE IF NOT EXISTS budget_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  budget_amount DECIMAL(12,2) NOT NULL,
  budget_duration INTEGER NOT NULL,
  allocated_amounts JSONB,
  gamification_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh Tokens Table (from SQLAlchemy models)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT false
);

-- Password Reset Tokens Table (from SQLAlchemy models)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT false
);

-- User Preferences Table (from SQLAlchemy models)  
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT,
  is_active BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Usage Table (from SQLAlchemy models)
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tier_at_usage TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_budget_data_user_id ON budget_data(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_data_updated_at
  BEFORE UPDATE ON budget_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO budget_buddy_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO budget_buddy_user;

EOF

echo "✅ Render schema created: $SCHEMA_FILE"

echo "📥 Step 3: Importing to Render PostgreSQL..."
echo "⚠️  Make sure you have:"
echo "   1. Created Render PostgreSQL database"
echo "   2. Updated RENDER_* variables in this script"
echo "   3. Have psql client installed"
echo ""
echo "Run the following commands manually:"
echo ""
echo "# Import schema:"
echo "psql -h $RENDER_HOST -p $RENDER_PORT -U $RENDER_USER -d $RENDER_DB -f $SCHEMA_FILE"
echo ""
echo "# If you have existing data to migrate, adapt and import:"
echo "# psql -h $RENDER_HOST -p $RENDER_PORT -U $RENDER_USER -d $RENDER_DB -f $BACKUP_FILE"
echo ""
echo "🔍 Step 4: Verify migration..."
echo "psql -h $RENDER_HOST -p $RENDER_PORT -U $RENDER_USER -d $RENDER_DB -c \"\\dt\""

echo ""
echo "🎯 Next steps:"
echo "1. Update DATABASE_URL in your .env file"
echo "2. Test connection locally"
echo "3. Deploy to Render"
echo ""
echo "✅ Migration scripts prepared!"