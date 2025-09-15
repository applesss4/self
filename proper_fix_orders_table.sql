-- 正确的orders表结构修复脚本
-- 解决total和total_amount字段冲突问题

-- 1. 首先检查是否存在total_amount字段
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        -- 2. 如果total字段为空但total_amount有数据，则迁移数据
        UPDATE public.orders 
        SET total = total_amount 
        WHERE total IS NULL AND total_amount IS NOT NULL;
        
        -- 3. 删除total_amount字段
        ALTER TABLE public.orders DROP COLUMN total_amount;
    END IF;
END $$;

-- 4. 确保total字段存在且类型正确
ALTER TABLE IF EXISTS public.orders 
    ALTER COLUMN total TYPE DECIMAL(10, 2);

-- 5. 确保total字段不为空
ALTER TABLE IF EXISTS public.orders 
    ALTER COLUMN total SET NOT NULL;

-- 6. 确保必需的字段存在
ALTER TABLE IF EXISTS public.orders 
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    ADD COLUMN IF NOT EXISTS items JSONB NOT NULL,
    ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. 重新创建触发器（如果不存在）
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. 重新创建行级安全策略
DROP POLICY IF EXISTS "用户只能查看自己的订单" ON public.orders;
DROP POLICY IF EXISTS "用户可以插入自己的订单" ON public.orders;
DROP POLICY IF EXISTS "用户可以更新自己的订单" ON public.orders;
DROP POLICY IF EXISTS "用户可以删除自己的订单" ON public.orders;

CREATE POLICY "用户只能查看自己的订单" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的订单" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的订单" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的订单" ON public.orders
    FOR DELETE USING (auth.uid() = user_id);