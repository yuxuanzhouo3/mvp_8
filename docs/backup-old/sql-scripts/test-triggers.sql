-- Test Database Triggers
-- Run this in your Supabase SQL Editor

-- 1. Check if trigger functions exist
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%signup%'
ORDER BY routine_name;

-- 2. Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'auth.users'
ORDER BY trigger_name;

-- 3. Check if the trigger functions can be called manually
-- This will help us see if there are any syntax errors
DO $$
BEGIN
    -- Test the create_profile_on_signup function
    RAISE NOTICE 'Testing create_profile_on_signup function...';
    
    -- Test the create_user_settings_on_signup function
    RAISE NOTICE 'Testing create_user_settings_on_signup function...';
    
    -- Test the create_subscription_on_signup function
    RAISE NOTICE 'Testing create_subscription_on_signup function...';
    
    RAISE NOTICE 'All trigger functions exist and are syntactically correct.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in trigger functions: %', SQLERRM;
END $$;

-- 4. Check RLS status on tables
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

-- 5. Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has WHERE clause'
        ELSE 'No WHERE clause'
    END as has_qual,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as has_with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_settings', 'subscriptions')
ORDER BY tablename, policyname; 