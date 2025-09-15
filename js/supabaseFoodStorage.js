// Supabase菜品数据存储
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';

class SupabaseFoodStorage {
    constructor() {
        this.supabaseAuth = new SupabaseAuth();
        this.foods = [];
        this.cart = [];
        this.orders = [];
        this.isOnline = true; // 始终使用在线模式
        this.initialize();
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
            } else {
                // 即使没有用户也保持在线模式
                this.isOnline = true;
                console.log('用户未登录，但保持在线模式');
            }
        } catch (error) {
            console.error('初始化存储失败:', error);
            // 出错时仍然保持在线模式
            this.isOnline = true;
        }
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

            // 获取菜品数据
            const { data: foodsData, error: foodsError } = await supabase
                .from('foods')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (foodsError) {
                console.error('获取菜品数据失败:', foodsError);
                this.foods = [];
            } else {
                this.foods = foodsData || [];
                console.log(`从数据库加载了 ${this.foods.length} 个菜品`);
            }

            // 获取订单数据
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersError) {
                console.error('获取订单数据失败:', ordersError);
                this.orders = [];
            } else {
                this.orders = ordersData || [];
                console.log(`从数据库加载了 ${this.orders.length} 个订单`);
            }

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
        this.saveCart();
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
        this.saveCart();
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
                this.saveCart();
            }
            return true;
        }
        return false;
    }

    // 从购物车移除商品
    removeFromCart(foodId) {
        this.cart = this.cart.filter(item => item.foodId !== foodId);
        this.saveCart();
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
        this.saveCart();
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
        // 始终使用在线模式保存到数据库
        const user = await this.supabaseAuth.getCurrentUser();
        if (!user) {
            console.error('用户未登录，无法添加订单');
            return null;
        }

        // 准备要插入的数据
        const orderToInsert = {
            user_id: user.id,
            items: order.items || [],
            total: order.total || 0,
            date: new Date()
        };

        const { data, error } = await supabase
            .from('orders')
            .insert(orderToInsert)
            .select()
            .single();

        if (error) {
            console.error('添加订单失败:', error);
            return null;
        }

        // 更新本地缓存
        this.orders.unshift(data);
        return data;
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
    }
}

export default SupabaseFoodStorage;