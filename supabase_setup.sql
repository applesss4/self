-- Supabase 数据库设置脚本
-- 运行此脚本以正确设置数据库表结构和权限

-- 1. 创建 users 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 tasks 表（如果不存在）
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

-- 3. 启用 tasks 表的行级安全 (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. 为 users 表创建行级安全策略
CREATE POLICY "用户只能查看自己的信息" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以插入自己的信息" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "用户可以更新自己的信息" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 5. 为 tasks 表创建行级安全策略
CREATE POLICY "用户只能查看自己的任务" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的任务" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的任务" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的任务" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 授予表权限
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.tasks TO authenticated;

-- 7. 创建更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 为表创建触发器
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

-- 9. 启用实时功能
-- 注意：这需要在 Supabase 仪表板中手动启用
-- 进入 Supabase 项目 -> Database -> Replication
-- 选择 tasks 表并启用实时功能

-- 10. 创建用户注册时的自动触发器
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
SELECT '数据库设置完成' as message;