// 测试登录功能
async function testLogin() {
    try {
        // 从 CDN 导入 Supabase 客户端
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        // Supabase 配置
        const SUPABASE_URL = 'https://ncgjyulrxlavejpgriju.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';
        
        // 创建 Supabase 客户端
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        console.log('Supabase客户端创建成功');
        
        // 测试登录
        const { data, error } = await supabase.auth.signInWithPassword({
            email: '123@123.com',
            password: '123'
        });
        
        if (error) {
            console.error('登录失败:', error);
            return { success: false, error: error.message };
        }
        
        console.log('登录成功:', data);
        return { success: true, data };
        
    } catch (error) {
        console.error('登录异常:', error);
        return { success: false, error: error.message };
    }
}

// 运行测试
testLogin().then(result => {
    console.log('测试结果:', result);
});