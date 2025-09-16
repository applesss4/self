// 检查用户数据的Node.js脚本
import { createClient } from '@supabase/supabase-js';

// Supabase配置
const SUPABASE_URL = 'https://ncgjyulrxlavejpgriju.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgwNzYzMiwiZXhwIjoyMDczMzgzNjMyfQ.VFO8fLfonj5f2xJh4Q8S1j4A3cc3bvf13P2rj7tE7a4';

// 创建Supabase客户端（使用服务角色密钥以获得完整权限）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkUserData() {
    console.log('开始检查用户数据...');
    
    try {
        // 检查测试用户是否存在
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', '123@123.com')
            .single();
        
        if (userError && userError.code !== 'PGRST116') {
            console.error('查询用户时出错:', userError);
            return;
        }
        
        if (user) {
            console.log('找到测试用户:', user);
        } else {
            console.log('未找到测试用户: 123@123.com');
        }
        
        // 检查该用户是否有任务数据
        if (user) {
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id);
            
            if (tasksError) {
                console.error('查询任务时出错:', tasksError);
                return;
            }
            
            console.log(`用户 ${user.email} 的任务数量:`, tasks.length);
            if (tasks.length > 0) {
                console.log('前3个任务:', tasks.slice(0, 3));
            }
        }
        
        // 检查所有用户数据
        const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('*');
        
        if (allUsersError) {
            console.error('查询所有用户时出错:', allUsersError);
            return;
        }
        
        console.log('所有用户数量:', allUsers.length);
        console.log('所有用户:', allUsers);
        
    } catch (error) {
        console.error('检查用户数据时发生异常:', error);
    }
}

// 执行检查
checkUserData();