-- COMPLETE DATABASE FIX FOR USER REGISTRATION ISSUES
-- Run this entire script in your Supabase SQL Editor
-- This will fix the trigger functions and resolve the null user_id errors

-- Step 1: Drop all existing triggers first
DROP TRIGGER IF EXISTS create_user_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_subscription_on_signup ON auth.users;

-- Step 2: Drop all existing functions
DROP FUNCTION IF EXISTS create_user_profile_on_signup();
DROP FUNCTION IF EXISTS create_user_settings_on_signup();
DROP FUNCTION IF EXISTS create_user_subscription_on_signup();

-- Step 3: Create the correct profile function
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the correct settings function (FIXED: uses user_id column)
CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, theme, notifications_enabled, created_at, updated_at)
    VALUES (
        NEW.id,
        'light',
        true,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the correct subscription function (FIXED: uses user_id column)
CREATE OR REPLACE FUNCTION create_user_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
    VALUES (
        NEW.id,
        1,
        'active',
        NOW(),
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the triggers
CREATE TRIGGER create_user_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_signup();
    
CREATE TRIGGER create_user_settings_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();
    
CREATE TRIGGER create_user_subscription_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_subscription_on_signup();

-- Step 7: Verify the setup
SELECT '=== TRIGGERS CREATED ===' as status;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'create_user_profile_on_signup',
    'create_user_settings_on_signup', 
    'create_user_subscription_on_signup'
);

SELECT '=== FUNCTIONS CREATED ===' as status;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'create_user_profile_on_signup',
    'create_user_settings_on_signup',
    'create_user_subscription_on_signup'
);

SELECT '=== FIX COMPLETE ===' as status;
SELECT 'Database triggers and functions have been fixed!' as message;
SELECT 'User registration should now work without null user_id errors.' as next_step; 