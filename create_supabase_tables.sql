-- Supabase 数据库表创建脚本
-- 运行此脚本以正确创建所有必要的数据库表结构和权限

-- 1. 创建 users 表（如果不存在）
-- 用于存储用户基本信息
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 tasks 表（如果不存在）
-- 用于存储用户任务信息
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME WITHOUT TIME ZONE,
    category TEXT DEFAULT 'life',
    status TEXT DEFAULT 'pending',
    work_start_time TIME WITHOUT TIME ZONE,
    work_end_time TIME WITHOUT TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 foods 表（存储菜品信息）
-- 用于存储买菜功能中的菜品信息
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    image TEXT,
    supermarkets JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建 orders 表（存储订单信息）
-- 用于存储买菜功能中的订单信息
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 启用所有表的行级安全 (RLS)
-- 确保用户只能访问自己的数据
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6. 为 users 表创建行级安全策略
-- 用户只能查看、插入和更新自己的信息
DROP POLICY IF EXISTS "用户只能查看自己的信息" ON public.users;
CREATE POLICY "用户只能查看自己的信息" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户可以插入自己的信息" ON public.users;
CREATE POLICY "用户可以插入自己的信息" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "用户可以更新自己的信息" ON public.users;
CREATE POLICY "用户可以更新自己的信息" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 7. 为 tasks 表创建行级安全策略
-- 用户只能查看、插入、更新和删除自己的任务
DROP POLICY IF EXISTS "用户只能查看自己的任务" ON public.tasks;
CREATE POLICY "用户只能查看自己的任务" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以插入自己的任务" ON public.tasks;
CREATE POLICY "用户可以插入自己的任务" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的任务" ON public.tasks;
CREATE POLICY "用户可以更新自己的任务" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的任务" ON public.tasks;
CREATE POLICY "用户可以删除自己的任务" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 8. 为 foods 表创建行级安全策略
-- 用户只能查看、插入、更新和删除自己的菜品
DROP POLICY IF EXISTS "用户只能查看自己的菜品" ON public.foods;
CREATE POLICY "用户只能查看自己的菜品" ON public.foods
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以插入自己的菜品" ON public.foods;
CREATE POLICY "用户可以插入自己的菜品" ON public.foods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的菜品" ON public.foods;
CREATE POLICY "用户可以更新自己的菜品" ON public.foods
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的菜品" ON public.foods;
CREATE POLICY "用户可以删除自己的菜品" ON public.foods
    FOR DELETE USING (auth.uid() = user_id);

-- 9. 为 orders 表创建行级安全策略
-- 用户只能查看、插入、更新和删除自己的订单
DROP POLICY IF EXISTS "用户只能查看自己的订单" ON public.orders;
CREATE POLICY "用户只能查看自己的订单" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以插入自己的订单" ON public.orders;
CREATE POLICY "用户可以插入自己的订单" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的订单" ON public.orders;
CREATE POLICY "用户可以更新自己的订单" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的订单" ON public.orders;
CREATE POLICY "用户可以删除自己的订单" ON public.orders
    FOR DELETE USING (auth.uid() = user_id);

-- 10. 授予表权限
-- 确保认证用户可以访问所有表
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.foods TO authenticated;
GRANT ALL ON public.orders TO authenticated;

-- 11. 创建更新 updated_at 字段的函数
-- 用于自动更新记录的更新时间
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 为表创建触发器
-- 确保在更新记录时自动更新 updated_at 字段
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_foods_updated_at ON public.foods;
CREATE TRIGGER update_foods_updated_at 
    BEFORE UPDATE ON public.foods 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 13. 启用实时功能
-- 注意：这需要在 Supabase 仪表板中手动启用
-- 进入 Supabase 项目 -> Database -> Replication
-- 选择需要实时功能的表并启用

-- 14. 创建用户注册时的自动触发器
-- 这将确保用户在注册时自动添加到 users 表中
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 显示成功消息
SELECT '数据库表创建完成' as message;