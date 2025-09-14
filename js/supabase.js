// Supabase 配置和初始化
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase 配置 - 使用环境变量或默认值
// 在 Vercel 中设置环境变量：NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL || 'https://ncgjyulrxlavejpgriju.supabase.co';
const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        // 确保自动获取用户会话
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    // 添加更详细的日志
    global: {
        headers: {
            'X-Client-Info': 'personal-life-assistant'
        }
    }
});

// 检查配置是否正确
if (SUPABASE_URL === 'https://your-project.supabase.co' || 
    SUPABASE_ANON_KEY === 'your-anon-key-here') {
    // 静默处理配置警告
}

// 导出前添加一个简单的健康检查函数
supabase.healthCheck = async function() {
    try {
        const { data, error } = await this.auth.getSession();
        if (error) {
            return { healthy: false, error: error.message };
        }
        return { healthy: true, session: data.session };
    } catch (err) {
        return { healthy: false, error: err.message };
    }
};

export default supabase;