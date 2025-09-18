-- Budget Buddy Mobile Database Schema
-- Run this in your Supabase SQL Editor

-- User Profiles Table
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
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

-- App Settings Table
CREATE TABLE public.app_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  currency TEXT DEFAULT 'PHP',
  notifications BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Data Table (for future use)
CREATE TABLE public.budget_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_amount DECIMAL(12,2) NOT NULL,
  budget_duration INTEGER NOT NULL, -- in days
  allocated_amounts JSONB, -- stores the budget breakdown
  gamification_data JSONB, -- stores achievements, progress, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table (for future use)
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_location ON public.user_profiles(location);
CREATE INDEX idx_budget_data_user_id ON public.budget_data(user_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);

-- Row Level Security Policies

-- User Profiles RLS
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- App Settings RLS
CREATE POLICY "Users can manage own settings" ON public.app_settings
  FOR ALL USING (auth.uid() = user_id);

-- Budget Data RLS
CREATE POLICY "Users can manage own budget data" ON public.budget_data
  FOR ALL USING (auth.uid() = user_id);

-- Expenses RLS
CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  
  INSERT INTO public.app_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_data_updated_at
  BEFORE UPDATE ON public.budget_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();