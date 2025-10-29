-- 修复触发器权限问题
-- 在Supabase SQL Editor中运行此脚本

-- 1. 删除现有触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 删除现有函数
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. 创建新的处理函数（使用SECURITY DEFINER）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入用户配置文件
  INSERT INTO public.profiles (id, email, full_name, avatar_url, custom_count, is_pro, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    0,
    FALSE,
    NOW(),
    NOW()
  );
  
  -- 插入用户设置
  INSERT INTO public.user_settings (user_id, theme, layout, show_favorites_first, auto_sync, notifications_enabled, created_at, updated_at)
  VALUES (
    NEW.id,
    'dark',
    'grid',
    TRUE,
    TRUE,
    TRUE,
    NOW(),
    NOW()
  );
  
  -- 插入订阅信息
  INSERT INTO public.subscriptions (user_id, plan_type, status, current_period_start, current_period_end, created_at, updated_at)
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

-- 4. 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. 验证触发器是否创建成功
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. 验证函数是否创建成功
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'; 