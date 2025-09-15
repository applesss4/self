// Supabase菜品数据存储
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';

class SupabaseFoodStorage {
    constructor() {
        this.supabaseAuth = new SupabaseAuth();
        this.foods = [];
        this.cart = [];
        this.orders = [];
        this.isOnline = false;
        this.initialize();
    }

    // 初始化
    async initialize() {
        // 检查用户是否已登录
        const user = await this.supabaseAuth.getCurrentUser();
        if (user) {
            this.isOnline = true;
            // 从数据库加载数据
            await this.loadFromDatabase();
        } else {
            // 从localStorage加载数据
            this.loadFromLocalStorage();
        }
    }

    // 从数据库加载数据
    async loadFromDatabase() {
        try {
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) return;

            // 获取菜品数据
            const { data: foodsData, error: foodsError } = await supabase
                .from('foods')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (foodsError) {
                console.error('获取菜品数据失败:', foodsError);
            } else {
                this.foods = foodsData || [];
            }

            // 获取订单数据
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersError) {
                console.error('获取订单数据失败:', ordersError);
            } else {
                this.orders = ordersData || [];
            }

            // 购物车数据仍然使用localStorage
            const cartData = localStorage.getItem('food_manager_cart');
            if (cartData) {
                this.cart = JSON.parse(cartData);
            }
        } catch (error) {
            console.error('从数据库加载数据失败:', error);
        }
    }

    // 从localStorage加载数据
    loadFromLocalStorage() {
        const foodsData = localStorage.getItem('food_manager_foods');
        const cartData = localStorage.getItem('food_manager_cart');
        const ordersData = localStorage.getItem('food_manager_orders');

        if (foodsData) {
            this.foods = JSON.parse(foodsData);
        } else {
            // 初始化一些默认菜品，包含超市信息和图片
            this.foods = [
                { 
                    id: '1', 
                    name: '西红柿', 
                    category: 'vegetable', 
                    price: 3.5, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 3.5 },
                        { name: '家乐福', price: 3.8 },
                        { name: '永辉超市', price: 3.2 }
                    ]
                },
                { 
                    id: '2', 
                    name: '黄瓜', 
                    category: 'vegetable', 
                    price: 2.8, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 2.8 },
                        { name: '家乐福', price: 3.0 },
                        { name: '永辉超市', price: 2.5 }
                    ]
                },
                { 
                    id: '3', 
                    name: '苹果', 
                    category: 'fruit', 
                    price: 5.0, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 5.0 },
                        { name: '家乐福', price: 5.5 },
                        { name: '永辉超市', price: 4.8 }
                    ]
                },
                { 
                    id: '4', 
                    name: '香蕉', 
                    category: 'fruit', 
                    price: 4.2, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 4.2 },
                        { name: '家乐福', price: 4.5 },
                        { name: '永辉超市', price: 4.0 }
                    ]
                },
                { 
                    id: '5', 
                    name: '猪肉', 
                    category: 'meat', 
                    price: 25.0, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 25.0 },
                        { name: '家乐福', price: 26.0 },
                        { name: '永辉超市', price: 24.5 }
                    ]
                },
                { 
                    id: '6', 
                    name: '牛肉', 
                    category: 'meat', 
                    price: 45.0, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 45.0 },
                        { name: '家乐福', price: 47.0 },
                        { name: '永辉超市', price: 44.0 }
                    ]
                },
                { 
                    id: '7', 
                    name: '带鱼', 
                    category: 'seafood', 
                    price: 18.0, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 18.0 },
                        { name: '家乐福', price: 19.0 },
                        { name: '永辉超市', price: 17.5 }
                    ]
                },
                { 
                    id: '8', 
                    name: '虾', 
                    category: 'seafood', 
                    price: 35.0, 
                    unit: '500g',
                    image: '',
                    supermarkets: [
                        { name: '沃尔玛', price: 35.0 },
                        { name: '家乐福', price: 36.0 },
                        { name: '永辉超市', price: 34.0 }
                    ]
                }
            ];
            this.saveFoods();
        }

        if (cartData) {
            this.cart = JSON.parse(cartData);
        }

        if (ordersData) {
            this.orders = JSON.parse(ordersData);
        }
    }

    // 保存菜品到数据库或localStorage
    async saveFoods() {
        if (this.isOnline) {
            // 在线模式下不直接保存到数据库，而是通过增删改操作
            // 这里只需要更新本地缓存
            return true;
        } else {
            // 离线模式下保存到localStorage
            localStorage.setItem('food_manager_foods', JSON.stringify(this.foods));
            return true;
        }
    }

    // 保存购物车到localStorage
    saveCart() {
        localStorage.setItem('food_manager_cart', JSON.stringify(this.cart));
    }

    // 保存订单到数据库或localStorage
    async saveOrders() {
        if (this.isOnline) {
            // 在线模式下不直接保存到数据库，而是通过addOrder方法
            // 这里只需要更新本地缓存
            return true;
        } else {
            // 离线模式下保存到localStorage
            localStorage.setItem('food_manager_orders', JSON.stringify(this.orders));
            return true;
        }
    }

    // 添加菜品
    async addFood(food) {
        if (this.isOnline) {
            // 在线模式下保存到数据库
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) return null;

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
        } else {
            // 离线模式下保存到localStorage
            food.id = Date.now().toString();
            if (!food.supermarkets || food.supermarkets.length === 0) {
                food.supermarkets = [
                    { name: '沃尔玛', price: food.price }
                ];
            }
            this.foods.push(food);
            this.saveFoods();
            return food;
        }
    }

    // 更新菜品
    async updateFood(updatedFood) {
        if (this.isOnline) {
            // 在线模式下更新数据库
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) return false;

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
        } else {
            // 离线模式下更新localStorage
            const index = this.foods.findIndex(food => food.id === updatedFood.id);
            if (index !== -1) {
                if (!updatedFood.supermarkets || updatedFood.supermarkets.length === 0) {
                    updatedFood.supermarkets = this.foods[index].supermarkets && this.foods[index].supermarkets.length > 0 
                        ? [this.foods[index].supermarkets[0]] 
                        : [{ name: '沃尔玛', price: updatedFood.price }];
                }
                this.foods[index] = updatedFood;
                this.saveFoods();
                return true;
            }
            return false;
        }
    }

    // 删除菜品
    async deleteFood(foodId) {
        if (this.isOnline) {
            // 在线模式下从数据库删除
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) return false;

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
        } else {
            // 离线模式下从localStorage删除
            this.foods = this.foods.filter(food => food.id !== foodId);
            // 从购物车中移除该菜品
            this.cart = this.cart.filter(item => item.foodId !== foodId);
            this.saveFoods();
            this.saveCart();
            return true;
        }
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
        if (this.isOnline) {
            // 在线模式下保存到数据库
            const user = await this.supabaseAuth.getCurrentUser();
            if (!user) return null;

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
        } else {
            // 离线模式下保存到localStorage
            order.id = Date.now().toString();
            order.date = new Date().toLocaleString('zh-CN');
            this.orders.push(order);
            this.saveOrders();
            return order;
        }
    }

    // 获取所有订单
    getOrders() {
        return this.orders;
    }

    // 切换在线/离线模式
    async toggleOnlineMode(online) {
        this.isOnline = online;
        if (online) {
            // 切换到在线模式时，从数据库加载数据
            await this.loadFromDatabase();
        } else {
            // 切换到离线模式时，从localStorage加载数据
            this.loadFromLocalStorage();
        }
    }
}

export default SupabaseFoodStorage;