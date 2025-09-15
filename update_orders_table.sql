-- 更新现有orders表结构的SQL脚本
-- 如果您的orders表已经存在但缺少某些字段，请运行此脚本

-- 添加缺失的字段
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS items JSONB;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2);

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 为新添加的字段设置默认值（如果需要）
UPDATE public.orders 
SET items = '[]' WHERE items IS NULL;

UPDATE public.orders 
SET total = 0.00 WHERE total IS NULL;

UPDATE public.orders 
SET date = NOW() WHERE date IS NULL;

UPDATE public.orders 
SET created_at = NOW() WHERE created_at IS NULL;

UPDATE public.orders 
SET updated_at = NOW() WHERE updated_at IS NULL;

-- 设置NOT NULL约束（在设置默认值之后）
ALTER TABLE public.orders 
ALTER COLUMN items SET NOT NULL;

ALTER TABLE public.orders 
ALTER COLUMN total SET NOT NULL;

-- 为orders表启用RLS（如果尚未启用）
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 显示成功消息
SELECT 'orders表结构更新完成' as message;