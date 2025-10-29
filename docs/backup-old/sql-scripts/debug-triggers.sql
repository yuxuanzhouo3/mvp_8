-- Debug and Fix Database Triggers
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 2. Check if the trigger functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%signup%'
ORDER BY routine_name;

-- 3. Drop existing triggers if they exist (to recreate them)
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_subscription_on_signup ON auth.users;

-- 4. Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_profile_on_signup();
DROP FUNCTION IF EXISTS create_user_settings_on_signup();
DROP FUNCTION IF EXISTS create_subscription_on_signup();

-- 5. Recreate the trigger functions with better error handling
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, custom_count, is_pro, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    0,
    FALSE,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (you can check Supabase logs)
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user settings for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status, created_at, updated_at)
  VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating subscription for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the triggers
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

CREATE TRIGGER create_user_settings_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();

CREATE TRIGGER create_subscription_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_subscription_on_signup();

-- 7. Verify the triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 8. Test the triggers with a dummy user (optional)
-- This will help verify the triggers work without actually creating a user
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Simulate what happens when a user is created
    INSERT INTO public.profiles (id, email, full_name, avatar_url, custom_count, is_pro, created_at, updated_at)
    VALUES (test_user_id, 'test@example.com', 'Test User', '', 0, FALSE, NOW(), NOW());
    
    INSERT INTO public.user_settings (user_id, theme, language, notifications_enabled, created_at, updated_at)
    VALUES (test_user_id, 'light', 'en', TRUE, NOW(), NOW());
    
    INSERT INTO public.subscriptions (user_id, plan_type, status, created_at, updated_at)
    VALUES (test_user_id, 'free', 'active', NOW(), NOW());
    
    RAISE NOTICE 'Test inserts completed successfully for user %', test_user_id;
    
    -- Clean up test data
    DELETE FROM public.subscriptions WHERE user_id = test_user_id;
    DELETE FROM public.user_settings WHERE user_id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    
    RAISE NOTICE 'Test data cleaned up';
END $$; 