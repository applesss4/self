// 数据统计模块
// 版本: 1.0.33
import SupabaseAuth from './supabaseAuth.js';
import supabase from './supabase.js';

// 菜品数据存储
class FoodStorage {
    constructor() {
        this.foods = [];
        this.cart = [];
        this.orders = [];
        this.isOnline = true; // 始终使用在线模式
    }

    // 从数据库加载数据
    async loadFromDatabase() {
        try {
            // 检查是否从首页登录
            const loginStatus = sessionStorage.getItem('isLoggedIn');
            if (loginStatus !== 'true') {
                // 用户未在首页登录，重定向到首页
                window.location.href = '/';
                return;
            }
            
            // 检查用户是否已登录
            const { data: { user } } = await supabase.auth.getUser();
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

    // 获取所有订单
    async getOrders() {
        await this.loadFromDatabase();
        return this.orders;
    }
}

// 页面UI管理
class StatsUI {
    constructor() {
        this.foodStorage = new FoodStorage();
        this.init();
    }

    async init() {
        // 检查是否从首页登录
        const loginStatus = sessionStorage.getItem('isLoggedIn');
        if (loginStatus !== 'true') {
            // 用户未在首页登录，重定向到首页
            window.location.href = '/';
            return;
        }
        
        // 确保认证模块已初始化
        await this.initAuth();
        await this.renderStats();
        this.bindEvents();
        
        // 绑定功能按钮事件
        this.bindFeaturesButtonEvents();
        
        // 检查用户登录状态并更新功能按钮
        this.checkUserStatusAndShowFeaturesButton();
        
        // 为导航链接添加登录检查
        this.addLoginCheckToNavLinks();
    }

    // 初始化认证模块
    async initAuth() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        
        // 确保认证按钮事件已绑定
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            console.log('数据统计页面找到登录按钮');
            // 确保simpleAuth.js已加载并初始化
            if (typeof window.supabaseAuth !== 'undefined') {
                console.log('认证模块已加载');
            } else {
                console.log('等待认证模块加载');
            }
        } else {
            console.log('数据统计页面未找到登录按钮');
        }
    }

    bindEvents() {
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeOrderDetail();
            }
        });
        
        // 订单详情模态框关闭按钮
        document.getElementById('closeOrderDetail')?.addEventListener('click', () => {
            this.closeOrderDetail();
        });
        
        // 点击订单详情模态框外部关闭
        document.getElementById('orderDetailModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'orderDetailModal') {
                this.closeOrderDetail();
            }
        });
        
        // 绑定登录按钮事件（作为后备方案）
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                console.log('数据统计页面登录按钮被点击');
                // 尝试触发simpleAuth.js中的登录逻辑
                if (window.supabaseAuth) {
                    window.supabaseAuth.getCurrentUser().then(user => {
                        if (user) {
                            // 用户已登录，执行登出操作
                            window.supabaseAuth.signOut().then(result => {
                                if (result.success) {
                                    // 清除登录状态标记
                                    sessionStorage.removeItem('isLoggedIn');
                                    
                                    // 跳转到首页
                                    window.location.href = '/';
                                }
                            });
                        } else {
                            // 用户未登录，打开登录模态框
                            const authModal = document.getElementById('authModal');
                            if (authModal) {
                                authModal.classList.add('active');
                            }
                        }
                    });
                } else {
                    console.log('认证模块未初始化');
                    // 作为后备方案，直接显示登录模态框
                    const authModal = document.getElementById('authModal');
                    if (authModal) {
                        authModal.classList.add('active');
                    }
                }
            });
        }
    }

    // 绑定功能按钮事件
    bindFeaturesButtonEvents() {
        // 功能按钮点击事件
        const featuresBtn = document.getElementById('featuresBtn');
        if (featuresBtn) {
            featuresBtn.addEventListener('click', () => {
                this.openFeaturesModal();
            });
        }
        
        // 关闭功能菜单模态框
        const closeFeaturesModal = document.getElementById('closeFeaturesModal');
        if (closeFeaturesModal) {
            closeFeaturesModal.addEventListener('click', () => {
                this.closeFeaturesModalFunc();
            });
        }
        
        // 点击模态框外部关闭
        const featuresModal = document.getElementById('featuresModal');
        if (featuresModal) {
            featuresModal.addEventListener('click', (e) => {
                if (e.target.id === 'featuresModal') {
                    this.closeFeaturesModalFunc();
                }
            });
        }
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFeaturesModalFunc();
            }
        });
    }

    // 打开功能菜单模态框
    openFeaturesModal() {
        const featuresModal = document.getElementById('featuresModal');
        if (featuresModal) {
            featuresModal.classList.add('active');
        }
    }

    // 关闭功能菜单模态框
    closeFeaturesModalFunc() {
        const featuresModal = document.getElementById('featuresModal');
        if (featuresModal) {
            featuresModal.classList.remove('active');
        }
    }

    // 检查用户登录状态并更新功能按钮和菜单项
    checkUserStatusAndShowFeaturesButton() {
        try {
            // 从sessionStorage获取登录状态
            const loginStatus = sessionStorage.getItem('isLoggedIn');
            const featuresBtn = document.getElementById('featuresBtn');
            
            // 获取所有功能菜单项
            const menuItems = document.querySelectorAll('.feature-menu-item');
            
            if (loginStatus === 'true') {
                // 用户已登录，显示功能按钮并更新菜单项样式
                if (featuresBtn) {
                    featuresBtn.style.display = 'block';
                }
                
                // 为所有菜单项添加登录样式类
                menuItems.forEach(item => {
                    item.classList.add('logged-in');
                    item.classList.remove('not-logged-in');
                });
            } else {
                // 用户未登录，仍然显示功能按钮但更新菜单项样式
                if (featuresBtn) {
                    featuresBtn.style.display = 'block';
                }
                
                // 为所有菜单项添加未登录样式类
                menuItems.forEach(item => {
                    item.classList.add('not-logged-in');
                    item.classList.remove('logged-in');
                });
            }
        } catch (error) {
            console.error('检查用户状态时出错:', error);
        }
    }

    // 为导航链接添加登录检查
    addLoginCheckToNavLinks() {
        // 获取所有导航链接（除了首页）
        const navLinks = document.querySelectorAll('.nav-link:not([href="/"])');
        
        // 为每个链接添加点击事件监听器
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // 检查用户是否已登录
                const loginStatus = sessionStorage.getItem('isLoggedIn');
                if (loginStatus !== 'true') {
                    // 阻止默认跳转行为
                    e.preventDefault();
                    
                    // 显示提示消息
                    this.showToast('请先登录后再访问此功能', 'error');
                    
                    // 显示登录模态框
                    const authModal = document.getElementById('authModal');
                    if (authModal) {
                        authModal.classList.add('active');
                    }
                }
            }.bind(this));
        });
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        // 移除现有的提示
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新提示
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // 渲染统计数据
    async renderStats() {
        // 获取订单数据
        const orders = await this.foodStorage.getOrders();
        
        if (orders.length === 0) {
            document.getElementById('monthlySummary').innerHTML = '<div class="empty-stats">暂无订单数据</div>';
            document.getElementById('weeklySummary').innerHTML = '<div class="empty-stats">暂无订单数据</div>';
            document.getElementById('orderList').innerHTML = '<div class="empty-stats">暂无订单数据</div>';
            document.getElementById('priceChanges').innerHTML = '<div class="empty-stats">暂无价格变化数据</div>';
            return;
        }

        // 按月份分组订单
        const monthlyData = this.groupOrdersByMonth(orders);
        
        // 按周分组订单
        const weeklyData = this.groupOrdersByWeek(orders);
        
        // 计算每月总金额及变化趋势
        const monthlySummary = this.calculateMonthlySummary(monthlyData);
        
        // 计算每周总金额及变化趋势
        const weeklySummary = this.calculateWeeklySummary(weeklyData);
        
        // 计算菜品价格变化
        const priceChanges = this.calculatePriceChanges(orders);
        
        // 渲染月度统计
        this.renderMonthlySummary(monthlySummary);
        
        // 渲染周度统计
        this.renderWeeklySummary(weeklySummary);
        
        // 渲染订单列表
        this.renderOrderList(orders);
        
        // 渲染价格变化
        this.renderPriceChanges(priceChanges);
    }

    // 渲染月度统计
    renderMonthlySummary(monthlySummary) {
        const container = document.getElementById('monthlySummary');
        
        if (monthlySummary.length === 0) {
            container.innerHTML = '<div class="empty-stats">暂无月度数据</div>';
            return;
        }
        
        container.innerHTML = monthlySummary.map((month, index) => `
            <div class="monthly-summary">
                <div class="monthly-amount">${month.month}: ${month.total.toFixed(2)} 日元</div>
                ${index > 0 ? `
                    <div class="monthly-change ${month.change >= 0 ? 'change-positive' : 'change-negative'}">
                        ${month.change >= 0 ? '↑' : '↓'} ${Math.abs(month.change).toFixed(2)}% 
                        ${month.change >= 0 ? '增加' : '减少'}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // 渲染周度统计
    renderWeeklySummary(weeklySummary) {
        const container = document.getElementById('weeklySummary');
        
        if (weeklySummary.length === 0) {
            container.innerHTML = '<div class="empty-stats">暂无周度数据</div>';
            return;
        }
        
        container.innerHTML = weeklySummary.map((week, index) => `
            <div class="weekly-summary">
                <div class="weekly-amount">${week.week}: ${week.total.toFixed(2)} 日元</div>
                ${index > 0 ? `
                    <div class="weekly-change ${week.change >= 0 ? 'change-positive' : 'change-negative'}">
                        ${week.change >= 0 ? '↑' : '↓'} ${Math.abs(week.change).toFixed(2)}% 
                        ${week.change >= 0 ? '增加' : '减少'}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // 渲染订单列表
    renderOrderList(orders) {
        const container = document.getElementById('orderList');
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-stats">暂无订单数据</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="order-list">
                ${orders.map(order => {
                    // 简化订单号显示，只显示前8位
                    const shortOrderId = order.id ? order.id.substring(0, 8) : '未知';
                    return `
                    <div class="order-item-summary" data-order-id="${order.id}">
                        <div class="order-id">订单号: ${shortOrderId}</div>
                        <div class="order-price">${order.total.toFixed(2)} 日元</div>
                    </div>
                `;}).join('')}
            </div>
        `;
        
        // 绑定订单点击事件
        document.querySelectorAll('.order-item-summary').forEach(item => {
            item.addEventListener('click', (e) => {
                const orderId = e.currentTarget.dataset.orderId;
                this.showOrderDetail(orderId);
            });
        });
    }

    // 渲染价格变化
    renderPriceChanges(priceChanges) {
        const container = document.getElementById('priceChanges');
        
        if (priceChanges.length === 0) {
            container.innerHTML = '<div class="empty-stats">暂无价格变化数据</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="price-change-list">
                ${priceChanges.map(change => `
                    <div class="price-change-item">
                        <div class="food-name">${change.name}</div>
                        <div class="price-diff ${change.diff >= 0 ? 'diff-positive' : 'diff-negative'}">
                            ${change.diff > 0 ? `涨了 ${change.diff.toFixed(2)} 日元` : `降了 ${Math.abs(change.diff).toFixed(2)} 日元`}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 按月份分组订单
    groupOrdersByMonth(orders) {
        const monthlyData = {};
        
        orders.forEach(order => {
            // 从订单日期提取年月
            // 使用更可靠的日期解析方法
            // 支持两种日期格式：ISO格式和本地格式
            let year, month;
            
            if (order.date.includes('T')) {
                // ISO格式 (2025-09-15T10:30:45.123Z)
                const dateObj = new Date(order.date);
                year = dateObj.getFullYear();
                month = dateObj.getMonth(); // JavaScript月份从0开始
            } else {
                // 本地格式 (2025年09月15日 10:30:45)
                const dateParts = order.date.split(/[\s年月日:/]+/);
                year = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1; // JavaScript月份从0开始
            }
            
            // 确保月份格式正确（两位数）
            const monthStr = String(month + 1).padStart(2, '0');
            const monthKey = `${year}-${monthStr}`;
            const monthLabel = `${year}年${month + 1}月`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    label: monthLabel,
                    orders: [],
                    total: 0
                };
            }
            
            monthlyData[monthKey].orders.push(order);
            monthlyData[monthKey].total += order.total;
        });
        
        return monthlyData;
    }

    // 按周分组订单
    groupOrdersByWeek(orders) {
        const weeklyData = {};
        
        orders.forEach(order => {
            // 从订单日期提取年月日
            // 使用更可靠的日期解析方法
            // 支持两种日期格式：ISO格式和本地格式
            let dateObj;
            
            if (order.date.includes('T')) {
                // ISO格式 (2025-09-15T10:30:45.123Z)
                dateObj = new Date(order.date);
            } else {
                // 本地格式 (2025年09月15日 10:30:45)
                const dateParts = order.date.split(/[\s年月日:/]+/);
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]) - 1; // JavaScript月份从0开始
                const day = parseInt(dateParts[2]);
                const hour = parseInt(dateParts[3]) || 0;
                const minute = parseInt(dateParts[4]) || 0;
                const second = parseInt(dateParts[5]) || 0;
                dateObj = new Date(year, month, day, hour, minute, second);
            }
            
            // 获取该日期在当月是第几周
            const weekOfMonth = this.getWeekOfMonth(dateObj);
            
            // 格式化周标识（只显示当月第几周，不显示年月）
            const weekKey = `W${weekOfMonth}`;
            const weekLabel = `第${weekOfMonth}周`;
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    label: weekLabel,
                    orders: [],
                    total: 0
                };
            }
            
            weeklyData[weekKey].orders.push(order);
            weeklyData[weekKey].total += order.total;
        });
        
        return weeklyData;
    }

    // 获取日期在当月是第几周（以周一为一周的开始）
    getWeekOfMonth(date) {
        // 获取当月第一天
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        
        // 获取当月第一天是星期几 (0=周日, 1=周一, ..., 6=周六)
        const firstDayOfWeek = firstDayOfMonth.getDay();
        
        // 调整为以周一为一周的开始
        // 如果第一天是周日(0)，则视为第7天
        const adjustedFirstDay = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
        
        // 计算日期在当月是第几天
        const dayOfMonth = date.getDate();
        
        // 计算该日期在当月是第几周
        // 需要考虑当月第一周的偏移
        const weekNumber = Math.ceil((dayOfMonth + adjustedFirstDay - 1) / 7);
        
        return weekNumber;
    }

    // 获取日期所在的年份和周数信息（使用ISO 8601标准）
    getWeekInfo(date) {
        // 创建日期副本以避免修改原日期
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        // 设置为周四（确保在同一周内）
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        // 获取年份
        const year = d.getUTCFullYear();
        // 获取1月4日的日期
        const yearStart = new Date(Date.UTC(year, 0, 4));
        // 计算周数
        const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return { year, week: weekNumber };
    }

    // 计算每月总金额及变化趋势
    calculateMonthlySummary(monthlyData) {
        // 按月份键排序（时间顺序）
        const sortedKeys = Object.keys(monthlyData).sort();
        
        const months = sortedKeys.map(key => ({
            month: monthlyData[key].label,
            total: monthlyData[key].total
        }));
        
        // 计算变化率
        for (let i = 1; i < months.length; i++) {
            const previous = months[i - 1].total;
            const current = months[i].total;
            months[i].change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
        }
        
        // 第一个月没有变化率
        if (months.length > 0) {
            months[0].change = 0;
        }
        
        // 按时间倒序排列（最新的月份在前）
        return months.reverse();
    }

    // 计算每周总金额及变化趋势
    calculateWeeklySummary(weeklyData) {
        // 对于只显示当月第几周的情况，我们需要特殊处理排序
        // 提取周数并按数值排序
        const weekKeys = Object.keys(weeklyData)
            .sort((a, b) => {
                const weekA = parseInt(a.replace('W', ''));
                const weekB = parseInt(b.replace('W', ''));
                return weekA - weekB;
            })
            .map(key => ({
                week: weeklyData[key].label,
                total: weeklyData[key].total
            }));
        
        // 计算变化率
        for (let i = 1; i < weekKeys.length; i++) {
            const previous = weekKeys[i - 1].total;
            const current = weekKeys[i].total;
            weekKeys[i].change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
        }
        
        // 第一周没有变化率
        if (weekKeys.length > 0) {
            weekKeys[0].change = 0;
        }
        
        // 按周数倒序排列（最近的周在前）
        return weekKeys.reverse();
    }

    // 计算菜品价格变化
    calculatePriceChanges(orders) {
        // 获取所有菜品的最新价格和历史价格
        const foodPrices = {};
        
        // 遍历所有订单，记录每个菜品的价格历史
        orders.forEach(order => {
            // 使用更可靠的日期解析方法
            // 支持两种日期格式：ISO格式和本地格式
            let dateObj;
            
            if (order.date.includes('T')) {
                // ISO格式 (2025-09-15T10:30:45.123Z)
                dateObj = new Date(order.date);
            } else {
                // 本地格式 (2025年09月15日 10:30:45)
                const dateParts = order.date.split(/[\s年月日:/]+/);
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]) - 1; // JavaScript月份从0开始
                const day = parseInt(dateParts[2]);
                const hour = parseInt(dateParts[3]) || 0;
                const minute = parseInt(dateParts[4]) || 0;
                const second = parseInt(dateParts[5]) || 0;
                dateObj = new Date(year, month, day, hour, minute, second);
            }
            
            order.items.forEach(item => {
                if (!foodPrices[item.name]) {
                    foodPrices[item.name] = [];
                }
                foodPrices[item.name].push({
                    price: item.price,
                    date: dateObj
                });
            });
        });
        
        // 计算每个菜品的价格变化
        const priceChanges = [];
        
        Object.keys(foodPrices).forEach(foodName => {
            const prices = foodPrices[foodName];
            if (prices.length > 1) {
                // 按日期排序
                prices.sort((a, b) => a.date - b.date);
                
                // 获取最早和最晚的价格
                const firstPrice = prices[0].price;
                const lastPrice = prices[prices.length - 1].price;
                const diff = lastPrice - firstPrice;
                
                // 只显示有变化的菜品
                if (diff !== 0) {
                    priceChanges.push({
                        name: foodName,
                        firstPrice: firstPrice,
                        lastPrice: lastPrice,
                        diff: diff
                    });
                }
            }
        });
        
        // 按价格变化绝对值排序
        return priceChanges.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    }

    // 显示订单详情
    showOrderDetail(orderId) {
        const orders = this.foodStorage.getOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            this.showToast('未找到订单信息', 'error');
            return;
        }
        
        const orderDetailModal = document.getElementById('orderDetailModal');
        const orderDetailContent = document.getElementById('orderDetailContent');
        
        if (orderDetailContent) {
            // 计算订单总价
            const orderTotal = order.items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
            
            // 简化订单号显示，只显示前8位
            const shortOrderId = order.id ? order.id.substring(0, 8) : '未知';
            
            let html = `
                <div class="order-detail-header">
                    <div class="order-detail-info">
                        <div class="order-detail-id">订单号: ${shortOrderId}</div>
                        <div class="order-detail-total">总价: ${orderTotal.toFixed(2)} 日元</div>
                    </div>
                </div>
                <div class="order-detail-items">
                    <h4>商品列表</h4>
            `;
            
            // 按超市分组商品
            const supermarketGroups = {};
            
            order.items.forEach(item => {
                // 查找最便宜的超市
                let cheapestSupermarket = '其他';
                if (item.supermarkets && item.supermarkets.length > 0) {
                    const cheapest = item.supermarkets.reduce((min, supermarket) => {
                        return supermarket.price < min.price ? supermarket : min;
                    }, item.supermarkets[0]);
                    cheapestSupermarket = cheapest.name;
                }
                
                // 如果该超市还没有分组，则创建
                if (!supermarketGroups[cheapestSupermarket]) {
                    supermarketGroups[cheapestSupermarket] = [];
                }
                
                // 将商品添加到对应超市分组
                supermarketGroups[cheapestSupermarket].push(item);
            });
            
            // 为每个超市分组创建HTML
            Object.keys(supermarketGroups).forEach(supermarket => {
                // 创建超市标题
                html += `<div class="supermarket-header"><h4>${supermarket}</h4></div>`;
                
                // 为该超市的商品创建列表项
                supermarketGroups[supermarket].forEach(item => {
                    html += `
                        <div class="order-item">
                            <div class="order-item-info">
                                <div class="order-item-name">${item.name}</div>
                                <div class="order-item-price">${item.price.toFixed(2)} 日元 × ${item.quantity}</div>
                            </div>
                            <div class="order-item-quantity">
                                ${(item.price * item.quantity).toFixed(2)} 日元
                            </div>
                        </div>
                    `;
                });
            });
            
            html += `
                </div>
            `;
            
            orderDetailContent.innerHTML = html;
        }
        
        // 显示模态框
        orderDetailModal.classList.add('active');
    }

    // 关闭订单详情
    closeOrderDetail() {
        const orderDetailModal = document.getElementById('orderDetailModal');
        if (orderDetailModal) {
            orderDetailModal.classList.remove('active');
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    const statsUI = new StatsUI();
    await statsUI.init();
});