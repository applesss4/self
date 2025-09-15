ALTER TABLE IF EXISTS public.orders 
    RENAME COLUMN total_amount TO total;
ALTER TABLE IF EXISTS public.orders 
    ALTER COLUMN total TYPE DECIMAL(10, 2);
ALTER TABLE IF EXISTS public.orders 
    ALTER COLUMN total SET NOT NULL;
ALTER TABLE IF EXISTS public.orders 
    DROP COLUMN IF EXISTS total_amount;
ALTER TABLE IF EXISTS public.orders 
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    ADD COLUMN IF NOT EXISTS items JSONB NOT NULL,
    ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2) NOT NULL,
    ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
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
