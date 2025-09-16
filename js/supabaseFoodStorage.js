// Supabase菜品数据存储
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';

class SupabaseFoodStorage {
    constructor() {
        this.supabaseAuth = new SupabaseAuth();
        this.foods = [];
        this.cart = [];
        this.orders = [];
        // 检查用户是否已认证来决定默认模式
        this.isOnline = this.checkDefaultOnlineMode();
        // 添加缓存时间戳
        this.cacheTimestamp = 0;
        this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间
        // 添加实时订阅引用
        this.ordersSubscription = null;
        this.foodsSubscription = null;
        this.initialize();
    }
    
    // 检查默认在线模式
    checkDefaultOnlineMode() {
        try {
            // 检查本地存储中是否有认证令牌
            const sessionToken = localStorage.getItem('supabase.auth.token');
            const loginStatus = sessionStorage.getItem('isLoggedIn');
            
            if (sessionToken || loginStatus === 'true') {
                // 如果有认证令牌或登录状态标记，默认使用在线模式
                console.log('SupabaseFoodStorage: 检测到认证状态，使用在线模式');
                return true;
            }
            
            // 默认使用离线模式
            console.log('SupabaseFoodStorage: 未检测到认证状态，使用离线模式');
            return false;
        } catch (error) {
            console.error('检查默认在线模式时出错:', error);
            // 出错时默认使用离线模式
            console.log('SupabaseFoodStorage: 检查在线模式出错，使用离线模式');
            return false;
        }
    }

    // 初始化
    async initialize() {
        try {
            // 检查用户是否已登录
            const user = await this.supabaseAuth.getCurrentUser();
            if (user) {
                this.isOnline = true;
                // 从数据库加载数据
                await this.loadFromDatabase();
                // 订阅实时更新
                await this.subscribeToRealtimeUpdates();
            } else {
                // 检查登录状态标记
                const loginStatus = sessionStorage.getItem('isLoggedIn');
                if (loginStatus === 'true') {
                    this.isOnline = true;
                    console.log('检测到登录状态标记，使用在线模式');
                    // 从数据库加载数据
                    await this.loadFromDatabase();
                    // 订阅实时更新
                    await this.subscribeToRealtimeUpdates();
                } else {
                    this.isOnline = false;
                    console.log('用户未登录，使用离线模式');
                    // 从本地存储加载数据
                    this.loadFromLocalStorage();
                }
            }
        } catch (error) {
            console.error('初始化存储失败:', error);
            // 出错时检查登录状态标记
            const loginStatus = sessionStorage.getItem('isLoggedIn');
            this.isOnline = (loginStatus === 'true');
        }
    }

    // 订阅实时更新
    async subscribeToRealtimeUpdates() {
        try {
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) {
                console.log('用户未登录，无法订阅实时更新');
                return;
            }

            // 取消现有的订阅（如果有的话）
            this.unsubscribeFromRealtimeUpdates();

            // 订阅订单表的实时更新
            this.ordersSubscription = supabase
                .channel('orders_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('订单数据变更:', payload);
                        // 处理实时更新
                        this.handleOrderChange(payload);
                    }
                )
                .subscribe();

            // 订阅菜品表的实时更新
            this.foodsSubscription = supabase
                .channel('foods_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'foods',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('菜品数据变更:', payload);
                        // 处理实时更新
                        this.handleFoodChange(payload);
                    }
                )
                .subscribe();

            console.log('已订阅实时更新');
        } catch (error) {
            console.error('订阅实时更新失败:', error);
        }
    }

    // 处理订单变更
    handleOrderChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;

            switch (eventType) {
                case 'INSERT':
                    // 添加新订单
                    this.orders.unshift(newRecord);
                    console.log('新增订单:', newRecord);
                    break;
                case 'UPDATE':
                    // 更新订单
                    const updateIndex = this.orders.findIndex(order => order.id === newRecord.id);
                    if (updateIndex !== -1) {
                        this.orders[updateIndex] = newRecord;
                        console.log('更新订单:', newRecord);
                    }
                    break;
                case 'DELETE':
                    // 删除订单
                    const deleteIndex = this.orders.findIndex(order => order.id === oldRecord.id);
                    if (deleteIndex !== -1) {
                        this.orders.splice(deleteIndex, 1);
                        console.log('删除订单:', oldRecord);
                    }
                    break;
            }

            // 触发UI更新事件
            this.notifyOrderUpdate();
        } catch (error) {
            console.error('处理订单变更失败:', error);
        }
    }

    // 处理菜品变更
    handleFoodChange(payload) {
        try {
            const { eventType, new: newRecord, old: oldRecord } = payload;

            switch (eventType) {
                case 'INSERT':
                    // 添加新菜品
                    this.foods.unshift(newRecord);
                    console.log('新增菜品:', newRecord);
                    break;
                case 'UPDATE':
                    // 更新菜品
                    const updateIndex = this.foods.findIndex(food => food.id === newRecord.id);
                    if (updateIndex !== -1) {
                        this.foods[updateIndex] = newRecord;
                        console.log('更新菜品:', newRecord);
                    }
                    break;
                case 'DELETE':
                    // 删除菜品
                    const deleteIndex = this.foods.findIndex(food => food.id === oldRecord.id);
                    if (deleteIndex !== -1) {
                        this.foods.splice(deleteIndex, 1);
                        console.log('删除菜品:', oldRecord);
                    }
                    break;
            }
        } catch (error) {
            console.error('处理菜品变更失败:', error);
        }
    }

    // 通知订单更新
    notifyOrderUpdate() {
        // 创建自定义事件来通知UI更新
        const event = new CustomEvent('ordersUpdated', {
            detail: { orders: this.orders }
        });
        window.dispatchEvent(event);
    }

    // 取消订阅实时更新
    unsubscribeFromRealtimeUpdates() {
        if (this.ordersSubscription) {
            this.ordersSubscription.unsubscribe();
            this.ordersSubscription = null;
        }
        if (this.foodsSubscription) {
            this.foodsSubscription.unsubscribe();
            this.foodsSubscription = null;
        }
        console.log('已取消订阅实时更新');
    }

    // 检查缓存是否有效
    isCacheValid() {
        return (Date.now() - this.cacheTimestamp) < this.cacheExpiry;
    }

    // 从数据库加载数据
    async loadFromDatabase() {
        try {
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) {
                console.log('用户未登录，无法从数据库加载数据');
                this.foods = [];
                this.orders = [];
                return;
            }

            // 并行加载菜品和订单数据以提高性能
            const [foodsResult, ordersResult] = await Promise.allSettled([
                supabase
                    .from('foods')
                    .select('id,user_id,name,category,price,unit,image,supermarkets,created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('orders')
                    .select('id,user_id,items,total,date,created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
            ]);

            // 处理菜品数据
            if (foodsResult.status === 'fulfilled') {
                const { data: foodsData, error: foodsError } = foodsResult.value;
                if (foodsError) {
                    console.error('获取菜品数据失败:', foodsError);
                    this.foods = [];
                } else {
                    this.foods = foodsData || [];
                    console.log(`从数据库加载了 ${this.foods.length} 个菜品`);
                }
            } else {
                console.error('获取菜品数据失败:', foodsResult.reason);
                this.foods = [];
            }

            // 处理订单数据
            if (ordersResult.status === 'fulfilled') {
                const { data: ordersData, error: ordersError } = ordersResult.value;
                if (ordersError) {
                    console.error('获取订单数据失败:', ordersError);
                    this.orders = [];
                } else {
                    this.orders = ordersData || [];
                    console.log(`从数据库加载了 ${this.orders.length} 个订单`);
                }
            } else {
                console.error('获取订单数据失败:', ordersResult.reason);
                this.orders = [];
            }

            // 更新缓存时间戳
            this.cacheTimestamp = Date.now();

            // 购物车数据仍然使用localStorage（因为购物车通常是临时的）
            const cartData = localStorage.getItem('food_manager_cart');
            if (cartData) {
                this.cart = JSON.parse(cartData);
            }
        } catch (error) {
            console.error('从数据库加载数据失败:', error);
            this.foods = [];
            this.orders = [];
        }
    }

    // 从localStorage加载数据 - 重写为不加载任何数据
    loadFromLocalStorage() {
        // 不从localStorage加载数据
        this.foods = [];
        this.orders = [];
        
        // 购物车数据仍然使用localStorage（因为购物车通常是临时的）
        const cartData = localStorage.getItem('food_manager_cart');
        if (cartData) {
            this.cart = JSON.parse(cartData);
        }
    }

    // 保存菜品到数据库
    async saveFoods() {
        // 在线模式下不直接保存到数据库，而是通过增删改操作
        // 这里只需要更新本地缓存
        return true;
    }

    // 保存订单到数据库
    async saveOrders() {
        // 在线模式下不直接保存到数据库，而是通过addOrder方法
        // 这里只需要更新本地缓存
        return true;
    }

    // 添加菜品
    async addFood(food) {
        // 始终使用在线模式保存到数据库
        const user = await this.supabaseAuth.getCurrentUser();
        if (!user) {
            console.error('用户未登录，无法添加菜品');
            return null;
        }

        // 准备要插入的数据
        const foodToInsert = {
            user_id: user.id,
            name: food.name,
            category: food.category,
            price: food.price,
            unit: food.unit,
            image: food.image || null,
            supermarkets: food.supermarkets || []
        };

        const { data, error } = await supabase
            .from('foods')
            .insert(foodToInsert)
            .select()
            .single();

        if (error) {
            console.error('添加菜品失败:', error);
            return null;
        }

        // 更新本地缓存
        this.foods.unshift(data);
        return data;
    }

    // 更新菜品
    async updateFood(updatedFood) {
        // 始终使用在线模式更新数据库
        const user = await this.supabaseAuth.getCurrentUser();
        if (!user) {
            console.error('用户未登录，无法更新菜品');
            return false;
        }

        const { data, error } = await supabase
            .from('foods')
            .update({
                name: updatedFood.name,
                category: updatedFood.category,
                price: updatedFood.price,
                unit: updatedFood.unit,
                image: updatedFood.image || null,
                supermarkets: updatedFood.supermarkets || []
            })
            .eq('id', updatedFood.id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('更新菜品失败:', error);
            return false;
        }

        // 更新本地缓存
        const index = this.foods.findIndex(food => food.id === updatedFood.id);
        if (index !== -1) {
            this.foods[index] = data;
        }
        return true;
    }

    // 删除菜品
    async deleteFood(foodId) {
        // 始终使用在线模式从数据库删除
        const user = await this.supabaseAuth.getCurrentUser();
        if (!user) {
            console.error('用户未登录，无法删除菜品');
            return false;
        }

        const { error } = await supabase
            .from('foods')
            .delete()
            .eq('id', foodId)
            .eq('user_id', user.id);

        if (error) {
            console.error('删除菜品失败:', error);
            return false;
        }

        // 更新本地缓存
        this.foods = this.foods.filter(food => food.id !== foodId);
        // 从购物车中移除该菜品
        this.cart = this.cart.filter(item => item.foodId !== foodId);
        this.saveCartToLocalStorage();
        return true;
    }

    // 获取所有菜品
    getAllFoods() {
        return this.foods;
    }

    // 根据分类获取菜品
    getFoodsByCategory(category) {
        if (category === 'all') {
            return this.foods;
        }
        return this.foods.filter(food => food.category === category);
    }

    // 根据ID获取菜品
    getFoodById(foodId) {
        return this.foods.find(food => food.id === foodId);
    }

    // 添加到购物车
    addToCart(foodId, quantity = 1) {
        const existingItem = this.cart.find(item => item.foodId === foodId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ foodId, quantity });
        }
        this.saveCartToLocalStorage();
        return true;
    }

    // 更新购物车中商品数量
    updateCartItemQuantity(foodId, quantity) {
        const item = this.cart.find(item => item.foodId === foodId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(foodId);
            } else {
                item.quantity = quantity;
                this.saveCartToLocalStorage();
            }
            return true;
        }
        return false;
    }

    // 从购物车移除商品
    removeFromCart(foodId) {
        this.cart = this.cart.filter(item => item.foodId !== foodId);
        this.saveCartToLocalStorage();
        return true;
    }

    // 获取购物车内容
    getCartItems() {
        return this.cart.map(item => {
            const food = this.foods.find(f => f.id === item.foodId);
            return {
                ...item,
                food: food || null
            };
        }).filter(item => item.food !== null);
    }

    // 清空购物车
    clearCart() {
        this.cart = [];
        this.saveCartToLocalStorage();
        return true;
    }

    // 计算购物车总价
    getCartTotal() {
        return this.getCartItems().reduce((total, item) => {
            return total + (item.food.price * item.quantity);
        }, 0);
    }

    // 添加订单
    async addOrder(order) {
        try {
            // 始终使用在线模式保存到数据库
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) {
                console.error('用户未登录，无法添加订单');
                return { error: '用户未登录' };
            }

            // 检查订单项目是否为空
            if (!order.items || order.items.length === 0) {
                console.error('订单项目为空');
                return { error: '订单项目为空' };
            }

            // 计算订单总价（如果未提供）
            const total = order.total || order.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);

            // 准备要插入的数据
            // 使用本地日期格式而不是ISO格式，以便在数据统计页面正确解析
            const now = new Date();
            const dateStr = `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            const orderToInsert = {
                user_id: user.id,
                items: order.items || [],
                total: total,
                date: dateStr // 使用本地日期格式
            };

            console.log('准备插入订单数据:', orderToInsert);

            const { data, error } = await supabase
                .from('orders')
                .insert(orderToInsert)
                .select()
                .single();

            if (error) {
                console.error('添加订单失败:', error);
                return { error: error.message };
            }

            console.log('订单插入成功:', data);

            // 更新本地缓存
            if (data) {
                this.orders.unshift(data);
                // 通知UI更新
                this.notifyOrderUpdate();
            }
            return data || { error: '无返回数据' };
        } catch (error) {
            console.error('添加订单时发生异常:', error);
            return { error: error.message || '未知错误' };
        }
    }

    // 获取所有订单
    getOrders() {
        return this.orders;
    }

    // 切换在线/离线模式 - 重写为始终在线
    async toggleOnlineMode(online) {
        // 始终保持在线模式
        this.isOnline = true;
        // 从数据库加载数据
        await this.loadFromDatabase();
        // 重新订阅实时更新
        await this.subscribeToRealtimeUpdates();
    }

    // 保存购物车到localStorage
    saveCartToLocalStorage() {
        localStorage.setItem('food_manager_cart', JSON.stringify(this.cart));
    }
}

export default SupabaseFoodStorage;