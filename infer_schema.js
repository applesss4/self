// 推断Supabase表结构的脚本
import { createClient } from '@supabase/supabase-js';

// Supabase配置
const SUPABASE_URL = 'https://ncgjyulrxlavejpgriju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试插入数据以推断表结构
async function inferTableStructure(tableName) {
    console.log(`\n=== 推断表 ${tableName} 结构 ===`);
    
    // 创建测试数据
    let testData = {};
    
    switch(tableName) {
        case 'users':
            testData = {
                id: '00000000-0000-0000-0000-000000000000', // 测试用UUID
                email: 'test@example.com'
            };
            break;
        case 'tasks':
            testData = {
                user_id: '00000000-0000-0000-0000-000000000000',
                title: '测试任务',
                description: '测试任务描述',
                date: '2023-01-01',
                category: 'life'
            };
            break;
        case 'foods':
            testData = {
                user_id: '00000000-0000-0000-0000-000000000000',
                name: '测试菜品',
                category: 'vegetable',
                price: 10.00,
                unit: '500g'
            };
            break;
        case 'orders':
            testData = {
                user_id: '00000000-0000-0000-0000-000000000000',
                items: [],
                total: 0.00
            };
            break;
        default:
            console.log('未知表名');
            return;
    }
    
    try {
        // 尝试插入测试数据
        const { data, error } = await supabase
            .from(tableName)
            .insert(testData)
            .select();
            
        if (error) {
            console.log(`插入数据时出错: ${error.message}`);
            // 即使插入失败，我们也可以从错误信息中获取一些结构信息
            return;
        }
        
        if (data && data.length > 0) {
            console.log('成功插入数据，返回的字段:');
            const row = data[0];
            for (const [key, value] of Object.entries(row)) {
                let type = typeof value;
                if (value === null) {
                    type = 'NULL';
                } else if (Array.isArray(value)) {
                    type = 'ARRAY';
                } else if (value instanceof Date || key.includes('date') || key.includes('time')) {
                    type = 'DATE/TIMESTAMP';
                } else if (typeof value === 'object' && value !== null) {
                    type = 'JSON';
                } else if (typeof value === 'number' && (key.includes('price') || key.includes('total'))) {
                    type = 'DECIMAL';
                }
                
                console.log(`  ${key}: ${type.toUpperCase()}`);
            }
        }
        
        // 删除测试数据
        if (data && data.length > 0 && data[0].id) {
            await supabase
                .from(tableName)
                .delete()
                .eq('id', data[0].id);
        }
        
    } catch (error) {
        console.log(`推断表结构时出错: ${error.message}`);
    }
}

async function main() {
    console.log('推断Supabase数据库表结构');
    console.log('========================');
    
    // 推断所有表的结构
    const tables = ['users', 'tasks', 'foods', 'orders'];
    
    for (const table of tables) {
        await inferTableStructure(table);
    }
}

main();