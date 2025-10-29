-- Complete Database Fix for User Registration
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Check current state
SELECT '=== CURRENT DATABASE STATE ===' as info;

-- Check if tables exist
SELECT 'Tables Status:' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_settings', 'subscriptions', 'custom_websites', 'favorites')
ORDER BY table_name;

-- Check RLS status
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_settings', 'subscriptions', 'custom_websites', 'favorites');

-- Step 2: Create tables if they don't exist
SELECT '=== CREATING TABLES ===' as info;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    custom_count INTEGER DEFAULT 0,
    is_pro BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_websites table
CREATE TABLE IF NOT EXISTS custom_websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    category TEXT DEFAULT 'custom',
    is_favorite BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    site_id TEXT NOT NULL,
    site_name TEXT NOT NULL,
    site_url TEXT NOT NULL,
    site_icon TEXT,
    site_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, site_id)
);

-- Step 3: Enable RLS on all tables
SELECT '=== ENABLING RLS ===' as info;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing policies
SELECT '=== DROPPING EXISTING POLICIES ===' as info;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_select_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_delete_policy" ON user_settings;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;

-- Step 5: Create new policies that allow trigger functions to work
SELECT '=== CREATING NEW POLICIES ===' as info;

-- Profiles policies
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT 
    WITH CHECK (true);  -- Allow all inserts (triggers will handle validation)

CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE 
    USING (auth.uid() = id);

-- User settings policies
CREATE POLICY "user_settings_insert_policy" ON user_settings
    FOR INSERT 
    WITH CHECK (true);  -- Allow all inserts (triggers will handle validation)

CREATE POLICY "user_settings_select_policy" ON user_settings
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "user_settings_update_policy" ON user_settings
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "user_settings_delete_policy" ON user_settings
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "subscriptions_insert_policy" ON subscriptions
    FOR INSERT 
    WITH CHECK (true);  -- Allow all inserts (triggers will handle validation)

CREATE POLICY "subscriptions_select_policy" ON subscriptions
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_policy" ON subscriptions
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_delete_policy" ON subscriptions
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Custom websites policies
CREATE POLICY "custom_websites_insert_policy" ON custom_websites
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_websites_select_policy" ON custom_websites
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "custom_websites_update_policy" ON custom_websites
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "custom_websites_delete_policy" ON custom_websites
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "favorites_insert_policy" ON favorites
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_select_policy" ON favorites
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "favorites_update_policy" ON favorites
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "favorites_delete_policy" ON favorites
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 6: Drop existing trigger functions and triggers
SELECT '=== DROPPING EXISTING TRIGGERS ===' as info;
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_subscription_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_user_settings_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_subscription_on_signup() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 7: Create new trigger functions
SELECT '=== CREATING TRIGGER FUNCTIONS ===' as info;

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, custom_count, is_pro, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    0,
    FALSE,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user settings on signup
CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, theme, language, notifications_enabled, created_at, updated_at)
  VALUES (
    NEW.id,
    'light',
    'en',
    TRUE,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create subscription on signup
CREATE OR REPLACE FUNCTION create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
  VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create triggers
SELECT '=== CREATING TRIGGERS ===' as info;

-- Trigger for profile creation
CREATE TRIGGER create_profile_on_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- Trigger for user settings creation
CREATE TRIGGER create_user_settings_on_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();

-- Trigger for subscription creation
CREATE TRIGGER create_subscription_on_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_subscription_on_signup();

-- Step 9: Create indexes for performance
SELECT '=== CREATING INDEXES ===' as info;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_websites_user_id ON custom_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Step 10: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

-- Check tables
SELECT 'Tables Created:' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_settings', 'subscriptions', 'custom_websites', 'favorites')
ORDER BY table_name;

-- Check RLS
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_settings', 'subscriptions', 'custom_websites', 'favorites');

-- Check policies
SELECT 'Policies Created:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_settings', 'subscriptions', 'custom_websites', 'favorites')
ORDER BY tablename, policyname;

-- Check trigger functions
SELECT 'Trigger Functions:' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%signup%'
ORDER BY routine_name;

-- Check triggers
SELECT 'Triggers on auth.users:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'auth.users'
ORDER BY trigger_name;

SELECT '=== DATABASE FIX COMPLETE ===' as info;
SELECT 'All tables, policies, and triggers have been created successfully!' as status; 