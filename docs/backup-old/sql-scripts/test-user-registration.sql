-- TEST USER REGISTRATION FIX
-- Run this after running the manual-sql-fix.sql script
-- This will test if user registration works correctly

-- Step 1: Create a test user (this will trigger all the functions)
-- Note: Replace 'test@example.com' with a unique email for each test
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test-' || extract(epoch from now()) || '@example.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Test User", "avatar_url": "https://example.com/avatar.jpg"}'::jsonb,
    false,
    '',
    '',
    '',
    ''
) RETURNING id;

-- Step 2: Get the user ID from the result above and check if related data was created
-- Replace 'USER_ID_HERE' with the actual user ID from the result above

-- Check profile
SELECT 'Profile created:' as check_type, * FROM public.profiles 
WHERE email LIKE 'test-%@example.com' 
ORDER BY created_at DESC LIMIT 1;

-- Check settings
SELECT 'Settings created:' as check_type, * FROM public.user_settings 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE 'test-%@example.com' 
    ORDER BY created_at DESC LIMIT 1
);

-- Check subscription
SELECT 'Subscription created:' as check_type, * FROM public.subscriptions 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE 'test-%@example.com' 
    ORDER BY created_at DESC LIMIT 1
);

-- Step 3: Clean up test data (optional)
-- Uncomment the lines below to clean up after testing
/*
DELETE FROM public.subscriptions WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test-%@example.com'
);
DELETE FROM public.user_settings WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test-%@example.com'
);
DELETE FROM public.profiles WHERE email LIKE 'test-%@example.com';
DELETE FROM auth.users WHERE email LIKE 'test-%@example.com';
*/

SELECT '=== TEST COMPLETE ===' as status;
SELECT 'If you see data in all three tables above, the fix is working!' as result; 