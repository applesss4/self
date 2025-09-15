// 直接查询Supabase表结构的Node.js脚本
import { createClient } from '@supabase/supabase-js';

// 从环境变量或直接定义Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ncgjyulrxlavejpgriju.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getTableInfo() {
    try {
        // 尝试查询pg_tables来获取表信息
        const { data, error } = await supabase
            .from('pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');

        if (error) {
            console.error('Error fetching tables:', error);
            return [];
        }

        return data.map(row => row.tablename);
    } catch (err) {
        console.error('Error fetching tables:', err);
        return [];
    }
}

async function getColumnInfo(tableName) {
    try {
        // 使用PostgreSQL系统视图查询列信息
        const query = `
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
        `;

        const { data, error } = await supabase
            .rpc('execute_sql', { sql: query, params: [tableName] });

        if (error) {
            console.error(`Error fetching columns for ${tableName}:`, error);
            return [];
        }

        return data;
    } catch (err) {
        console.error(`Error fetching columns for ${tableName}:`, err);
        return [];
    }
}

async function generateSQL() {
    try {
        console.log('-- Supabase 数据库表结构');
        console.log('');
        
        // 获取所有表
        const tables = await getTableInfo();
        
        if (tables.length === 0) {
            console.log('-- 未找到任何表');
            return;
        }
        
        console.log('-- 发现的表:', tables.join(', '));
        console.log('');
        
        // 为每个表生成CREATE TABLE语句
        for (const table of tables) {
            console.log(`-- 表: ${table}`);
            console.log(`-- 注意: 以下语句是基于现有表结构推断的，可能需要根据实际需求调整`);
            console.log(`-- CREATE TABLE IF NOT EXISTS public.${table} (`);
            console.log(`--     ... 表结构需要手动查询 ...`);
            console.log(`-- );`);
            console.log('');
        }
    } catch (error) {
        console.error('生成SQL时出错:', error);
    }
}

// 执行脚本
generateSQL().catch(console.error);