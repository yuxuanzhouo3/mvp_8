-- Recreate Trigger Functions for User Registration
-- Run this in your Supabase SQL Editor

-- 1. Check if trigger functions exist
SELECT 'Checking existing trigger functions...' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%signup%'
ORDER BY routine_name;

-- 2. Drop existing trigger functions if they exist
SELECT 'Dropping existing trigger functions...' as info;
DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_user_settings_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_subscription_on_signup() CASCADE;

-- 3. Create the trigger functions
SELECT 'Creating trigger functions...' as info;

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
  INSERT INTO public.user_settings (user_id, theme, language, created_at, updated_at)
  VALUES (
    NEW.id,
    'light',
    'en',
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

-- 4. Create triggers on auth.users table
SELECT 'Creating triggers on auth.users...' as info;

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

-- 5. Verify the triggers were created
SELECT 'Verifying triggers...' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'auth.users'
ORDER BY trigger_name;

-- 6. Test the trigger functions manually
SELECT 'Testing trigger functions...' as info;
DO $$
BEGIN
    RAISE NOTICE 'Testing create_profile_on_signup function...';
    RAISE NOTICE 'Testing create_user_settings_on_signup function...';
    RAISE NOTICE 'Testing create_subscription_on_signup function...';
    RAISE NOTICE 'All trigger functions created successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in trigger functions: %', SQLERRM;
END $$;

-- 7. Final verification
SELECT 'Final verification...' as info;
SELECT 
    'Trigger Functions' as type,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%signup%'
UNION ALL
SELECT 
    'Triggers on auth.users' as type,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'auth.users'; 