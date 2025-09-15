// 查询Supabase表结构的脚本
import { createClient } from '@supabase/supabase-js';

// Supabase配置
const SUPABASE_URL = 'https://ncgjyulrxlavejpgriju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 通过查询系统表获取列信息
async function getTableColumns(tableName) {
    try {
        // 直接查询information_schema.columns表
        const { data, error } = await supabase
            .rpc('execute_sql', {
                sql: `
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM 
                        information_schema.columns 
                    WHERE 
                        table_name = $1 
                        AND table_schema = 'public'
                    ORDER BY 
                        ordinal_position
                `,
                params: [tableName]
            });

        if (error) {
            console.log(`查询表 ${tableName} 结构时出错:`, error.message);
            return [];
        }

        return data || [];
    } catch (error) {
        console.log(`获取表 ${tableName} 结构时出错:`, error.message);
        return [];
    }
}

// 通过查询系统表获取表信息
async function getAllTables() {
    try {
        const { data, error } = await supabase
            .rpc('execute_sql', {
                sql: `
                    SELECT tablename 
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                `,
                params: []
            });

        if (error) {
            console.log('查询表列表时出错:', error.message);
            return [];
        }

        return (data || []).map(row => row.tablename);
    } catch (error) {
        console.log('获取表列表时出错:', error.message);
        return [];
    }
}

async function describeTable(tableName) {
    console.log(`\n=== 表 ${tableName} ===`);
    
    // 获取列结构
    const columns = await getTableColumns(tableName);
    
    if (columns.length > 0) {
        console.log('列信息:');
        columns.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
            console.log(`  ${col.column_name} ${col.data_type.toUpperCase()} ${nullable} ${defaultValue}`);
        });
    } else {
        console.log('  无法获取列信息');
    }
    
    // 获取记录总数
    try {
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (!error) {
            console.log(`记录总数: ${count}`);
        }
    } catch (error) {
        console.log(`无法获取记录总数: ${error.message}`);
    }
}

async function main() {
    console.log('查询Supabase数据库表结构');
    console.log('========================');
    
    // 测试连接
    try {
        // 获取所有表
        const tables = await getAllTables();
        
        if (tables.length === 0) {
            console.log('未找到任何表');
            // 使用默认表列表
            const defaultTables = ['users', 'tasks', 'foods', 'orders'];
            for (const table of defaultTables) {
                await describeTable(table);
            }
        } else {
            console.log('发现的表:', tables.join(', '));
            for (const table of tables) {
                await describeTable(table);
            }
        }
        
    } catch (error) {
        console.error('查询过程中出错:', error);
    }
}

main();