// 执行数据迁移的脚本
import FoodMigration from './foodMigration.js';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async function() {
    console.log('开始执行数据迁移...');
    
    // 创建迁移实例
    const migration = new FoodMigration();
    
    // 执行完整迁移
    const result = await migration.migrateAll();
    
    console.log('数据迁移结果:', result);
    
    // 在页面上显示结果
    const migrationResult = document.createElement('div');
    migrationResult.id = 'migration-result';
    migrationResult.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 0.5rem;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: Arial, sans-serif;
    `;
    
    if (result.success) {
        migrationResult.style.background = '#d4edda';
        migrationResult.style.color = '#155724';
        migrationResult.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0;">数据迁移成功</h3>
            <p style="margin: 0;">${result.message}</p>
        `;
    } else {
        migrationResult.style.background = '#f8d7da';
        migrationResult.style.color = '#721c24';
        migrationResult.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0;">数据迁移失败</h3>
            <p style="margin: 0;">${result.message}</p>
        `;
    }
    
    document.body.appendChild(migrationResult);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        migrationResult.style.transition = 'opacity 0.3s ease';
        migrationResult.style.opacity = '0';
        setTimeout(() => {
            if (migrationResult.parentNode) {
                migrationResult.parentNode.removeChild(migrationResult);
            }
        }, 300);
    }, 3000);
});