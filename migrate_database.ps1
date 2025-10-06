# Budget Buddy Database Migration Script - Windows PowerShell Version
# Export from Supabase and Import to Render PostgreSQL

param(
    [string]$RenderHost = "dpg-xxxxx-a.oregon-postgres.render.com",  # Replace after DB creation
    [string]$RenderUser = "budget_buddy_user",                        # Replace after DB creation
    [string]$RenderDB = "budget_buddy",                              # Replace after DB creation
    [string]$RenderPassword = "your_render_password"                  # Replace after DB creation
)

Write-Host "🔄 Starting Budget Buddy Database Migration..." -ForegroundColor Cyan
Write-Host "From: Supabase PostgreSQL" -ForegroundColor Yellow
Write-Host "To: Render PostgreSQL" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor White

# Configuration
$SupabaseHost = "aws-1-ap-southeast-1.pooler.supabase.com"
$SupabaseUser = "postgres.muiuzeprorylariammzz"
$SupabaseDB = "postgres"
$SupabasePort = "5432"

$BackupFile = "budget_buddy_backup.sql"
$SchemaFile = "render_schema.sql"

Write-Host "📤 Step 1: Creating Render-compatible schema..." -ForegroundColor Blue

# Create adapted schema for standalone PostgreSQL
@"
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
RETURNS TRIGGER AS `$`$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

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
"@ | Out-File -FilePath $SchemaFile -Encoding UTF8

Write-Host "✅ Render schema created: $SchemaFile" -ForegroundColor Green

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to Render Dashboard → Databases → New PostgreSQL" -ForegroundColor White
Write-Host "2. Name it 'budget-buddy-db'" -ForegroundColor White
Write-Host "3. Copy the connection details and update this script" -ForegroundColor White
Write-Host "4. Run the schema import command:" -ForegroundColor White
Write-Host "   psql -h [RENDER_HOST] -p 5432 -U [RENDER_USER] -d [RENDER_DB] -f $SchemaFile" -ForegroundColor Cyan
Write-Host "5. Update your .env file with the new DATABASE_URL" -ForegroundColor White

Write-Host "`n📋 Manual Commands (after updating connection details):" -ForegroundColor Magenta
Write-Host "# Verify connection:" -ForegroundColor Gray
Write-Host "psql -h $RenderHost -p 5432 -U $RenderUser -d $RenderDB -c `"\dt`"" -ForegroundColor Gray
Write-Host "`n# Import schema:" -ForegroundColor Gray  
Write-Host "psql -h $RenderHost -p 5432 -U $RenderUser -d $RenderDB -f $SchemaFile" -ForegroundColor Gray

Write-Host "`n✅ Migration preparation complete!" -ForegroundColor Green
Write-Host "Run this script again after creating the Render database to get the exact commands." -ForegroundColor Yellow