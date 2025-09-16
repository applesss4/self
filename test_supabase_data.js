// 测试Supabase数据查询
import supabase from './js/supabase.js';

async function testSupabaseData() {
    console.log('开始测试Supabase数据查询...');
    
    try {
        // 检查Supabase连接
        console.log('Supabase URL:', supabase.supabaseUrl);
        
        // 尝试获取当前会话
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('会话数据:', sessionData);
        if (sessionError) {
            console.error('会话错误:', sessionError);
        }
        
        // 尝试获取当前用户
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('当前用户:', user);
        if (userError) {
            console.error('用户错误:', userError);
        }
        
        if (user) {
            // 查询任务数据
            console.log('查询任务数据...');
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id);
            
            console.log('任务数据:', tasks);
            if (tasksError) {
                console.error('任务查询错误:', tasksError);
            } else {
                console.log(`找到 ${tasks.length} 个任务`);
            }
        } else {
            console.log('用户未登录，无法查询任务数据');
        }
    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

// 执行测试
testSupabaseData();