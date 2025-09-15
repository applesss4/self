// 查询Supabase数据库表结构的脚本
import supabase from './supabase.js';

async function queryDatabaseSchema() {
    try {
        const output = document.getElementById('output');
        if (output) {
            output.innerHTML = '开始查询数据库表结构...\n';
        }
        
        // 查询所有表的信息
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public')
            .order('table_name');
            
        if (tablesError) {
            const errorMsg = `查询表信息失败: ${tablesError.message}\n`;
            console.error(errorMsg);
            if (output) output.innerHTML += errorMsg;
            return;
        }
        
        let result = '数据库中的表:\n';
        const tableNames = tables.map(table => table.table_name);
        result += tableNames.join(', ') + '\n\n';
        
        // 查询每个表的列信息
        for (const tableName of tableNames) {
            result += `表 ${tableName} 的结构:\n`;
            
            const { data: columns, error: columnsError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_name', tableName)
                .eq('table_schema', 'public')
                .order('ordinal_position');
                
            if (columnsError) {
                const errorMsg = `查询表 ${tableName} 结构失败: ${columnsError.message}\n\n`;
                console.error(errorMsg);
                result += errorMsg;
                continue;
            }
            
            result += '列信息:\n';
            columns.forEach(column => {
                result += `  ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${column.column_default ? `DEFAULT ${column.column_default}` : ''}\n`;
            });
            
            // 查询表的主键信息
            const { data: primaryKey, error: pkError } = await supabase
                .from('information_schema.table_constraints')
                .select('constraint_name')
                .eq('table_name', tableName)
                .eq('constraint_type', 'PRIMARY KEY');
                
            if (!pkError && primaryKey.length > 0) {
                result += `主键约束: ${primaryKey[0].constraint_name}\n`;
            }
            
            // 查询表的外键信息
            const { data: foreignKeys, error: fkError } = await supabase
                .from('information_schema.table_constraints')
                .select('constraint_name, constraint_type')
                .eq('table_name', tableName)
                .eq('constraint_type', 'FOREIGN KEY');
                
            if (!fkError && foreignKeys.length > 0) {
                result += `外键约束: ${foreignKeys.length} 个\n`;
                foreignKeys.forEach(fk => {
                    result += `  ${fk.constraint_name}\n`;
                });
            }
            
            // 查询RLS状态
            const { data: rlsStatus, error: rlsError } = await supabase
                .from('pg_tables')
                .select('relname, relrowsecurity')
                .eq('relname', tableName);
                
            if (!rlsError && rlsStatus.length > 0) {
                result += `RLS启用状态: ${rlsStatus[0].relrowsecurity ? '启用' : '未启用'}\n`;
            }
            
            result += '\n';
        }
        
        // 查询触发器信息
        result += '触发器信息:\n';
        const { data: triggers, error: triggersError } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, event_manipulation, event_object_table')
            .eq('trigger_schema', 'public');
            
        if (!triggersError) {
            triggers.forEach(trigger => {
                result += `  ${trigger.trigger_name} (${trigger.event_manipulation}) ON ${trigger.event_object_table}\n`;
            });
        }
        
        result += '\n查询完成\n';
        
        if (output) {
            output.innerHTML = result;
        }
        
        console.log(result);
        return result;
    } catch (error) {
        const errorMsg = `查询过程中发生错误: ${error.message}\n`;
        console.error(errorMsg);
        const output = document.getElementById('output');
        if (output) {
            output.innerHTML += errorMsg;
        }
    }
}

// 如果在浏览器环境中运行，自动执行查询
if (typeof window !== 'undefined') {
    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 绑定按钮事件
        const queryBtn = document.getElementById('queryBtn');
        if (queryBtn) {
            queryBtn.addEventListener('click', queryDatabaseSchema);
        }
    });
}

// 导出函数
export default queryDatabaseSchema;