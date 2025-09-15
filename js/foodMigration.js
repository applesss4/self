// 菜品数据迁移脚本
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';

class FoodMigration {
    constructor() {
        this.supabaseAuth = new SupabaseAuth();
    }

    // 迁移菜品数据
    async migrateFoods() {
        try {
            // 检查用户是否已登录
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) {
                console.log('用户未登录，无法迁移数据');
                return { success: false, message: '用户未登录' };
            }

            // 从localStorage获取菜品数据
            const foodsData = localStorage.getItem('food_manager_foods');
            if (!foodsData) {
                console.log('没有找到菜品数据');
                return { success: true, message: '没有找到菜品数据' };
            }

            const foods = JSON.parse(foodsData);
            if (foods.length === 0) {
                console.log('菜品数据为空');
                return { success: true, message: '菜品数据为空' };
            }

            // 准备要插入的数据
            const foodsToInsert = foods.map(food => ({
                user_id: user.id,
                name: food.name,
                category: food.category,
                price: food.price,
                unit: food.unit,
                image: food.image || null,
                supermarkets: food.supermarkets || []
            }));

            // 插入数据到数据库
            const { data, error } = await supabase
                .from('foods')
                .insert(foodsToInsert);

            if (error) {
                console.error('迁移菜品数据失败:', error);
                return { success: false, message: `迁移菜品数据失败: ${error.message}` };
            }

            console.log(`成功迁移 ${foods.length} 个菜品`);
            return { success: true, message: `成功迁移 ${foods.length} 个菜品` };
        } catch (error) {
            console.error('迁移过程中发生错误:', error);
            return { success: false, message: `迁移过程中发生错误: ${error.message}` };
        }
    }

    // 迁移订单数据
    async migrateOrders() {
        try {
            // 检查用户是否已登录
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) {
                console.log('用户未登录，无法迁移订单数据');
                return { success: false, message: '用户未登录' };
            }

            // 从localStorage获取订单数据
            const ordersData = localStorage.getItem('food_manager_orders');
            if (!ordersData) {
                console.log('没有找到订单数据');
                return { success: true, message: '没有找到订单数据' };
            }

            const orders = JSON.parse(ordersData);
            if (orders.length === 0) {
                console.log('订单数据为空');
                return { success: true, message: '订单数据为空' };
            }

            // 准备要插入的数据
            const ordersToInsert = orders.map(order => ({
                user_id: user.id,
                items: order.items || [],
                total: order.total || 0,
                date: new Date(order.date) || new Date()
            }));

            // 插入数据到数据库
            const { data, error } = await supabase
                .from('orders')
                .insert(ordersToInsert);

            if (error) {
                console.error('迁移订单数据失败:', error);
                return { success: false, message: `迁移订单数据失败: ${error.message}` };
            }

            console.log(`成功迁移 ${orders.length} 个订单`);
            return { success: true, message: `成功迁移 ${orders.length} 个订单` };
        } catch (error) {
            console.error('迁移订单过程中发生错误:', error);
            return { success: false, message: `迁移订单过程中发生错误: ${error.message}` };
        }
    }

    // 执行完整迁移
    async migrateAll() {
        console.log('开始数据迁移...');
        
        // 迁移菜品数据
        const foodMigrationResult = await this.migrateFoods();
        console.log('菜品数据迁移结果:', foodMigrationResult);
        
        // 迁移订单数据
        const orderMigrationResult = await this.migrateOrders();
        console.log('订单数据迁移结果:', orderMigrationResult);
        
        if (foodMigrationResult.success && orderMigrationResult.success) {
            console.log('所有数据迁移完成');
            return { success: true, message: '所有数据迁移完成' };
        } else {
            console.log('数据迁移过程中出现错误');
            return { 
                success: false, 
                message: '数据迁移过程中出现错误',
                foodResult: foodMigrationResult,
                orderResult: orderMigrationResult
            };
        }
    }
}

// 导出迁移类
export default FoodMigration;

// 如果直接运行此脚本，则执行迁移
if (typeof window === 'undefined') {
    // Node.js环境
    const migration = new FoodMigration();
    migration.migrateAll().then(result => {
        console.log('迁移结果:', result);
    });
}