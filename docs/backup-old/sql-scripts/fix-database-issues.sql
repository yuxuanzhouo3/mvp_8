-- Fix Database Issues
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing language column to user_settings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'language'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_settings ADD COLUMN language TEXT DEFAULT 'en';
    END IF;
END $$;

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Drop existing RLS policies that are too restrictive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- 5. Create more permissive RLS policies for triggers to work
-- Profiles table policies
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- User settings table policies
CREATE POLICY "Enable read access for authenticated users" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions table policies
CREATE POLICY "Enable read access for authenticated users" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Drop and recreate trigger functions with proper error handling
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_subscription_on_signup ON auth.users;

DROP FUNCTION IF EXISTS create_profile_on_signup();
DROP FUNCTION IF EXISTS create_user_settings_on_signup();
DROP FUNCTION IF EXISTS create_subscription_on_signup();

-- Recreate functions with better error handling
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

-- 7. Recreate triggers
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

CREATE TRIGGER create_user_settings_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();

CREATE TRIGGER create_subscription_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_subscription_on_signup();

-- 8. Verify everything is set up correctly
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 9. Test the setup with a manual insert (this should work now)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Test manual inserts (these should work with the new RLS policies)
    INSERT INTO public.profiles (id, email, full_name, avatar_url, custom_count, is_pro, created_at, updated_at)
    VALUES (test_user_id, 'test@example.com', 'Test User', '', 0, FALSE, NOW(), NOW());
    
    INSERT INTO public.user_settings (user_id, theme, language, notifications_enabled, created_at, updated_at)
    VALUES (test_user_id, 'light', 'en', TRUE, NOW(), NOW());
    
    INSERT INTO public.subscriptions (user_id, plan_type, status, created_at, updated_at)
    VALUES (test_user_id, 'free', 'active', NOW(), NOW());
    
    RAISE NOTICE '✅ Manual inserts completed successfully for user %', test_user_id;
    
    -- Clean up
    DELETE FROM public.subscriptions WHERE user_id = test_user_id;
    DELETE FROM public.user_settings WHERE user_id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    
    RAISE NOTICE '✅ Test data cleaned up';
END $$; 