-- 修复orders表结构的SQL脚本
-- 请在Supabase SQL编辑器中运行此脚本

-- 首先检查orders表是否存在以及当前结构
-- 如果表不存在，创建它
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 如果表已存在但缺少某些字段，添加它们
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]';

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 确保字段类型正确
ALTER TABLE public.orders 
ALTER COLUMN items SET NOT NULL;

ALTER TABLE public.orders 
ALTER COLUMN total SET NOT NULL;

-- 为orders表启用RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 为orders表创建RLS策略
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

-- 授予表权限
GRANT ALL ON public.orders TO authenticated;

-- 创建或更新触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 显示成功消息
SELECT 'orders表结构修复完成' as message;