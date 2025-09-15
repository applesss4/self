// 菜品管理模块
import SupabaseAuth from './supabaseAuth.js';
import SupabaseFoodStorage from './supabaseFoodStorage.js';

// 页面UI管理
class FoodUI {
    constructor() {
        this.foodStorage = new FoodStorage();
        this.currentCategory = 'all';
        this.currentImage = ''; // 存储当前选择的图片
        // 注意：不要在这里调用init()，因为它可能是异步的
    }

    async init() {
        // 检查是否从首页登录
        const loginStatus = sessionStorage.getItem('isLoggedIn');
        if (loginStatus !== 'true') {
            // 用户未在首页登录，重定向到首页
            window.location.href = '/';
            return;
        }
        
        // 显示加载状态
        this.showLoadingState();
        
        // 等待存储初始化完成
        await this.foodStorage.initialize();
        
        // 隐藏加载状态
        this.hideLoadingState();
        
        this.bindEvents();
        this.renderFoods();
        this.updateCartUI();
        
        // 绑定功能按钮事件
        this.bindFeaturesButtonEvents();
        
        // 检查用户登录状态并更新功能按钮
        this.checkUserStatusAndShowFeaturesButton();
        
        // 为导航链接添加登录检查
        this.addLoginCheckToNavLinks();
        
        // 监听订单实时更新事件
        window.addEventListener('ordersUpdated', () => {
            console.log('收到订单更新事件');
            // 如果订单侧边栏是打开的，则重新渲染订单
            const orderSidebar = document.getElementById('orderSidebar');
            if (orderSidebar && orderSidebar.classList.contains('active')) {
                this.renderOrders();
            }
        });
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

    bindEvents() {
        // 添加菜品按钮
        document.getElementById('addFoodBtn')?.addEventListener('click', () => {
            this.openFoodModal();
        });

        // 订单按钮
        document.getElementById('orderBtn')?.addEventListener('click', () => {
            this.openOrder();
        });

        // 菜品表单提交
        document.getElementById('foodForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveFood();
        });

        // 图片上传预览
        document.getElementById('foodImage')?.addEventListener('change', (e) => {
            this.previewImage(e.target);
        });

        // 模态框关闭按钮
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closeFoodModal();
        });

        // 菜品详情模态框关闭按钮
        document.getElementById('closeDetailModal')?.addEventListener('click', () => {
            this.closeFoodDetailModal();
        });

        // 取消按钮
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeFoodModal();
        });

        // 点击模态框外部关闭
        document.getElementById('foodModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'foodModal') {
                this.closeFoodModal();
            }
        });

        // 点击菜品详情模态框外部关闭
        document.getElementById('foodDetailModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'foodDetailModal') {
                this.closeFoodDetailModal();
            }
        });

        // 分类筛选
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.dataset.category);
            });
        });

        // 购物车按钮
        document.getElementById('cartFloat')?.addEventListener('click', () => {
            this.openCart();
        });

        // 关闭购物车
        document.getElementById('closeCart')?.addEventListener('click', () => {
            this.closeCart();
        });

        // 关闭订单
        document.getElementById('closeOrder')?.addEventListener('click', () => {
            this.closeOrder();
        });

        // 结算按钮
        document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
            await this.checkout();
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFoodModal();
                this.closeFoodDetailModal();
                this.closeCart();
                this.closeOrder();
            }
        });
    }

    // 绑定功能按钮事件
    bindFeaturesButtonEvents() {
        // 功能按钮点击事件
        const featuresBtn = document.getElementById('featuresBtn');
        if (featuresBtn) {
            featuresBtn.addEventListener('click', this.openFeaturesModal);
        }
        
        // 关闭功能菜单模态框
        const closeFeaturesModal = document.getElementById('closeFeaturesModal');
        if (closeFeaturesModal) {
            closeFeaturesModal.addEventListener('click', this.closeFeaturesModalFunc);
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

    // 检查用户登录状态并更新功能按钮
    checkUserStatusAndShowFeaturesButton() {
        try {
            // 从sessionStorage获取登录状态
            const loginStatus = sessionStorage.getItem('isLoggedIn');
            const featuresBtn = document.getElementById('featuresBtn');
            
            if (loginStatus === 'true') {
                // 用户已登录，显示功能按钮
                if (featuresBtn) {
                    featuresBtn.style.display = 'block';
                    // 添加登录样式类
                    featuresBtn.classList.add('loggedIn');
                }
            } else {
                // 用户未登录，隐藏功能按钮
                if (featuresBtn) {
                    featuresBtn.style.display = 'none';
                    // 移除登录样式类
                    featuresBtn.classList.remove('loggedIn');
                }
            }
        } catch (error) {
            console.error('检查用户状态时出错:', error);
        }
    }

    // 图片预览功能
    previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" style="display: block; margin: 0 auto;">`;
            }
            
            reader.readAsDataURL(input.files[0]);
            this.currentImage = input.files[0]; // 保存图片文件
        }
    }

    // 显示加载状态
    showLoadingState() {
        const foodGrid = document.getElementById('foodGrid');
        if (foodGrid) {
            foodGrid.innerHTML = '<div class="loading-message">正在加载数据...</div>';
        }
    }

    // 隐藏加载状态
    hideLoadingState() {
        const foodGrid = document.getElementById('foodGrid');
        if (foodGrid && foodGrid.querySelector('.loading-message')) {
            foodGrid.innerHTML = '';
        }
    }

    // 渲染菜品
    renderFoods() {
        const foods = this.foodStorage.getFoodsByCategory(this.currentCategory);
        const foodGrid = document.getElementById('foodGrid');
        
        if (!foodGrid) return;

        foodGrid.innerHTML = '';
        
        console.log('渲染菜品，当前分类:', this.currentCategory, '菜品数量:', foods.length);
        
        if (foods.length === 0) {
            foodGrid.innerHTML = '<div class="empty-message">暂无菜品</div>';
            return;
        }

        foods.forEach(food => {
            const foodElement = this.createFoodElement(food);
            foodGrid.appendChild(foodElement);
        });
    }

    // 创建菜品元素
    createFoodElement(food) {
        const foodElement = document.createElement('div');
        foodElement.className = 'food-item';
        
        // 查找最便宜的价格和对应的超市
        let cheapestPrice = food.price;
        let cheapestSupermarket = '';
        
        if (food.supermarkets && food.supermarkets.length > 0) {
            const cheapest = food.supermarkets.reduce((min, supermarket) => {
                return supermarket.price < min.price ? supermarket : min;
            }, food.supermarkets[0]);
            
            // 只使用超市的最低价信息
            cheapestPrice = cheapest.price;
            cheapestSupermarket = cheapest.name;
        }
        
        // 使用图片或默认图标
        const imageHtml = food.image ? 
            `<img src="${food.image}" alt="${food.name}" class="food-image" loading="lazy">` : 
            `<div class="food-image">${this.getCategoryIcon(food.category)}</div>`;
        
        // 只有当有超市信息时才显示超市名称
        const supermarketHtml = cheapestSupermarket ? 
            `<div class="food-supermarket">${cheapestSupermarket}</div>` : '';
        
        // 使用文档片段来减少DOM操作
        const fragment = document.createDocumentFragment();
        
        // 创建包装容器
        const container = document.createElement('div');
        
        container.innerHTML = `
            ${imageHtml}
            <div class="food-name">${food.name}</div>
            <div class="food-price">${cheapestPrice.toFixed(2)} 日元</div>
            ${supermarketHtml}
            <div class="food-actions">
                <button class="add-to-cart" data-id="${food.id}">加入购物车</button>
            </div>
        `;
        
        // 将内容添加到片段中
        while (container.firstChild) {
            fragment.appendChild(container.firstChild);
        }
        
        foodElement.appendChild(fragment);

        // 绑定菜品点击事件，显示详情
        foodElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart')) {
                this.showFoodDetail(food.id);
            }
        });

        // 绑定添加到购物车事件
        foodElement.querySelector('.add-to-cart').addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToCart(food.id);
        });

        return foodElement;
    }

    // 获取分类图标
    getCategoryIcon(category) {
        const icons = {
            vegetable: '🥬',
            fruit: '🍎',
            meat: '🥩',
            seafood: '🐟'
        };
        return icons[category] || '🍽️';
    }

    // 获取分类名称
    getCategoryName(category) {
        const names = {
            vegetable: '蔬菜',
            fruit: '水果',
            meat: '肉类',
            seafood: '海鲜'
        };
        return names[category] || '其他';
    }

    // 筛选分类
    filterByCategory(category) {
        this.currentCategory = category;
        
        // 更新分类按钮状态
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // 重新渲染菜品
        this.renderFoods();
    }

    // 显示菜品详情
    showFoodDetail(foodId) {
        const food = this.foodStorage.getFoodById(foodId);
        if (!food) return;

        const modal = document.getElementById('foodDetailModal');
        const content = document.getElementById('foodDetailContent');
        const title = document.getElementById('detailModalTitle');

        title.textContent = `${food.name} - 详情`;
        
        // 使用图片或默认图标
        const imageHtml = food.image ? 
            `<img src="${food.image}" alt="${food.name}" class="food-detail-image">` : 
            `<div class="food-detail-image">${this.getCategoryIcon(food.category)}</div>`;
        
        // 对超市价格进行排序（从低到高）
        const sortedSupermarkets = [...food.supermarkets].sort((a, b) => a.price - b.price);
        
        // 找到最低价格
        const lowestPrice = sortedSupermarkets.length > 0 ? sortedSupermarkets[0].price : food.price;
        
        content.innerHTML = `
            <div class="food-detail-header">
                ${imageHtml}
                <div class="food-detail-info">
                    <h3>${food.name}</h3>
                    <div class="food-detail-price">${food.price.toFixed(2)} 日元</div>
                    <div class="food-detail-unit">${food.unit}</div>
                </div>
            </div>
            
            <div class="food-detail-section">
                <h4>超市价格对比</h4>
                <div class="supermarket-list" id="supermarketList">
                    ${sortedSupermarkets.map((supermarket, index) => {
                        const isLowest = supermarket.price === lowestPrice;
                        // 使用超市名称和价格作为唯一标识，而不是索引
                        const uniqueId = `${supermarket.name}-${supermarket.price}`;
                        return `
                        <div class="supermarket-item" data-supermarket="${supermarket.name}">
                            <div class="supermarket-name">
                                ${supermarket.name}
                                ${isLowest ? '<span class="lowest-price-tag">最低价</span>' : ''}
                            </div>
                            <div class="supermarket-price-container">
                                <div class="supermarket-price">${parseFloat(supermarket.price).toFixed(2)} 日元</div>
                                <button class="edit-price-btn" data-supermarket="${supermarket.name}" data-food-id="${foodId}">修改</button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
                
                <!-- 添加新超市的表单 -->
                <div class="add-supermarket-section">
                    <h4>添加新超市</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="newSupermarketName">超市名称</label>
                            <input type="text" id="newSupermarketName" placeholder="超市名称" class="supermarket-input">
                        </div>
                        <div class="form-group">
                            <label for="newSupermarketPrice">价格 (日元)</label>
                            <input type="number" id="newSupermarketPrice" step="0.01" min="0" placeholder="价格" class="supermarket-input">
                        </div>
                    </div>
                    <button class="btn-submit" id="addSupermarketBtn" data-food-id="${foodId}">添加超市</button>
                </div>
            </div>
        `;

        // 绑定修改价格按钮事件
        content.querySelectorAll('.edit-price-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const supermarketName = e.target.dataset.supermarket;
                const foodId = e.target.dataset.foodId;
                this.showPriceEditInput(foodId, supermarketName);
            });
        });

        // 绑定添加超市按钮事件
        const addSupermarketBtn = content.querySelector('#addSupermarketBtn');
        if (addSupermarketBtn) {
            addSupermarketBtn.addEventListener('click', (e) => {
                const foodId = e.target.dataset.foodId;
                this.addNewSupermarket(foodId);
            });
        }

        modal.classList.add('active');
    }

    // 添加新超市
    addNewSupermarket(foodId) {
        const supermarketName = document.getElementById('newSupermarketName').value.trim();
        const supermarketPrice = parseFloat(document.getElementById('newSupermarketPrice').value);

        // 验证输入
        if (!supermarketName) {
            this.showToast('请输入超市名称', 'error');
            return;
        }

        if (isNaN(supermarketPrice) || supermarketPrice < 0) {
            this.showToast('请输入有效的价格', 'error');
            return;
        }

        const food = this.foodStorage.getFoodById(foodId);
        if (!food) {
            this.showToast('未找到该商品', 'error');
            return;
        }

        // 检查超市是否已存在
        if (food.supermarkets.some(s => s.name === supermarketName)) {
            this.showToast('该超市已存在', 'error');
            return;
        }

        // 添加新超市
        food.supermarkets.push({
            name: supermarketName,
            price: supermarketPrice
        });

        // 重新计算商品默认价格（最低价）
        if (food.supermarkets.length > 0) {
            const lowestPrice = Math.min(...food.supermarkets.map(s => s.price));
            food.price = lowestPrice;
        }

        // 保存更新后的商品信息
        this.foodStorage.updateFood(food)
            .then(() => {
                // 重新显示详情页面
                this.showFoodDetail(foodId);
                
                // 重新渲染商品列表
                this.renderFoods();
                
                // 更新购物车（如果该商品在购物车中）
                this.updateCartUI();
                
                this.showToast('超市添加成功', 'success');
                
                // 清空输入框
                document.getElementById('newSupermarketName').value = '';
                document.getElementById('newSupermarketPrice').value = '';
            })
            .catch(error => {
                this.showToast('添加超市失败: ' + error.message, 'error');
            });
    }

    // 显示价格编辑输入框
    showPriceEditInput(foodId, supermarketName) {
        const food = this.foodStorage.getFoodById(foodId);
        if (!food || !food.supermarkets) return;

        const supermarketItem = document.querySelector(`.supermarket-item[data-supermarket="${supermarketName}"]`);
        const priceContainer = supermarketItem.querySelector('.supermarket-price-container');
        
        // 找到对应的超市
        const supermarket = food.supermarkets.find(s => s.name === supermarketName);
        if (!supermarket) return;
        
        const currentPrice = supermarket.price;

        // 替换价格显示为输入框
        priceContainer.innerHTML = `
            <input type="number" step="0.01" min="0" value="${currentPrice}" class="price-input" id="priceInput${supermarketName}">
            <button class="save-price-btn" data-supermarket="${supermarketName}" data-food-id="${foodId}">保存</button>
            <button class="cancel-price-btn" data-supermarket="${supermarketName}" data-food-id="${foodId}">取消</button>
        `;

        // 聚焦到输入框
        const priceInput = document.getElementById(`priceInput${supermarketName}`);
        priceInput.focus();

        // 绑定保存按钮事件
        priceContainer.querySelector('.save-price-btn').addEventListener('click', (e) => {
            const newSupermarketName = e.target.dataset.supermarket;
            const newFoodId = e.target.dataset.foodId;
            const newPrice = parseFloat(document.getElementById(`priceInput${newSupermarketName}`).value);
            this.saveSupermarketPrice(newFoodId, newSupermarketName, newPrice);
        });

        // 绑定取消按钮事件
        priceContainer.querySelector('.cancel-price-btn').addEventListener('click', (e) => {
            const newSupermarketName = e.target.dataset.supermarket;
            const newFoodId = e.target.dataset.foodId;
            this.showFoodDetail(newFoodId); // 重新加载详情页面
        });
    }

    // 保存超市价格
    saveSupermarketPrice(foodId, supermarketName, newPrice) {
        if (isNaN(newPrice) || newPrice < 0) {
            this.showToast('请输入有效的价格', 'error');
            return;
        }

        const food = this.foodStorage.getFoodById(foodId);
        if (!food) return;

        // 更新超市价格
        const supermarket = food.supermarkets.find(s => s.name === supermarketName);
        if (supermarket) {
            supermarket.price = newPrice;
            
            // 重新计算商品默认价格（最低价）
            if (food.supermarkets.length > 0) {
                const lowestPrice = Math.min(...food.supermarkets.map(s => s.price));
                food.price = lowestPrice;
            }
            
            // 保存更新后的商品信息
            this.foodStorage.updateFood(food);
            
            // 重新显示详情页面（会重新排序）
            this.showFoodDetail(foodId);
            
            // 重新渲染商品列表
            this.renderFoods();
            
            // 更新购物车（如果该商品在购物车中）
            this.updateCartUI();
            
            this.showToast('价格更新成功', 'success');
        }
    }

    // 关闭菜品详情模态框
    closeFoodDetailModal() {
        const modal = document.getElementById('foodDetailModal');
        modal.classList.remove('active');
    }

    // 打开菜品模态框
    openFoodModal(food = null) {
        const modal = document.getElementById('foodModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('foodForm');
        const preview = document.getElementById('imagePreview');
        
        // 重置图片预览
        preview.innerHTML = '';
        this.currentImage = '';
        
        if (food) {
            // 编辑模式
            title.textContent = '编辑菜品';
            document.getElementById('foodId').value = food.id;
            document.getElementById('foodName').value = food.name;
            document.getElementById('foodCategory').value = food.category;
            document.getElementById('foodPrice').value = food.price;
            document.getElementById('foodUnit').value = food.unit;
            
            // 显示已有的图片
            if (food.image) {
                preview.innerHTML = `<img src="${food.image}" style="display: block; margin: 0 auto;">`;
            }
            
            // 填充超市信息（只填充第一个超市）
            if (food.supermarkets && food.supermarkets.length > 0) {
                document.getElementById('supermarketName').value = food.supermarkets[0].name || '';
                document.getElementById('supermarketPrice').value = food.supermarkets[0].price || '';
            } else {
                // 清空超市信息
                document.getElementById('supermarketName').value = '';
                document.getElementById('supermarketPrice').value = '';
            }
        } else {
            // 添加模式
            title.textContent = '添加菜品';
            form.reset();
            document.getElementById('foodId').value = '';
            
            // 设置默认超市信息
            document.getElementById('supermarketName').value = '沃尔玛';
            document.getElementById('supermarketPrice').value = '';
        }
        
        modal.classList.add('active');
    }

    // 关闭菜品模态框
    closeFoodModal() {
        const modal = document.getElementById('foodModal');
        modal.classList.remove('active');
    }

    // 保存菜品
    async saveFood() {
        const id = document.getElementById('foodId').value;
        const name = document.getElementById('foodName').value;
        const category = document.getElementById('foodCategory').value;
        const unit = document.getElementById('foodUnit').value;
        const imageInput = document.getElementById('foodImage');
        
        // 获取超市信息（只有一个超市）
        const supermarketName = document.getElementById('supermarketName').value;
        const supermarketPrice = parseFloat(document.getElementById('supermarketPrice').value);
        
        if (!name || !category || !unit) {
            alert('请填写所有必填字段');
            return;
        }
        
        // 检查超市信息
        if (!supermarketName || isNaN(supermarketPrice)) {
            alert('请填写有效的超市名称和价格');
            return;
        }
        
        // 构建超市信息数组
        const supermarkets = [{ name: supermarketName, price: supermarketPrice }];
        const price = supermarketPrice; // 使用该超市的价格作为默认价格
        
        // 处理图片
        let image = '';
        if (imageInput.files && imageInput.files[0]) {
            // 如果有新上传的图片，使用新图片
            const reader = new FileReader();
            reader.onload = async (e) => {
                image = e.target.result;
                const food = { name, category, price, unit, supermarkets, image };
                
                let result;
                if (id) {
                    // 更新菜品
                    food.id = id;
                    result = await this.foodStorage.updateFood(food);
                } else {
                    // 添加菜品
                    result = await this.foodStorage.addFood(food);
                }
                
                if (result) {
                    this.closeFoodModal();
                    this.renderFoods();
                    this.showToast('菜品保存成功', 'success');
                } else {
                    this.showToast('菜品保存失败', 'error');
                }
            };
            reader.readAsDataURL(imageInput.files[0]);
            return;
        } else {
            // 如果没有新图片，检查是否是编辑模式且原有图片
            if (id) {
                const existingFood = this.foodStorage.getFoodById(id);
                if (existingFood) {
                    image = existingFood.image || '';
                }
            }
            
            const food = { name, category, price, unit, supermarkets, image };
            
            let result;
            if (id) {
                // 更新菜品
                food.id = id;
                result = await this.foodStorage.updateFood(food);
            } else {
                // 添加菜品
                result = await this.foodStorage.addFood(food);
            }
            
            if (result) {
                this.closeFoodModal();
                this.renderFoods();
                this.showToast('菜品保存成功', 'success');
            } else {
                this.showToast('菜品保存失败', 'error');
            }
        }
    }

    // 添加到购物车
    addToCart(foodId) {
        this.foodStorage.addToCart(foodId);
        this.updateCartUI();
        this.showToast('已添加到购物车', 'success');
    }

    // 更新购物车UI
    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartCount || !cartItems || !cartTotal) return;
        
        const items = this.foodStorage.getCartItems();
        const total = this.foodStorage.getCartTotal();
        
        // 更新购物车数量
        const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalCount;
        cartCount.style.display = totalCount > 0 ? 'flex' : 'none';
        
        // 更新购物车项目
        cartItems.innerHTML = '';
        if (items.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">购物车为空</div>';
            return;
        }
        
        // 使用文档片段来减少DOM操作
        const fragment = document.createDocumentFragment();
        
        // 按超市分组商品
        const supermarketGroups = {};
        
        items.forEach(item => {
            // 查找最便宜的超市作为默认超市
            let cheapestSupermarket = '';
            if (item.food.supermarkets && item.food.supermarkets.length > 0) {
                const cheapest = item.food.supermarkets.reduce((min, supermarket) => {
                    return supermarket.price < min.price ? supermarket : min;
                }, item.food.supermarkets[0]);
                cheapestSupermarket = cheapest.name;
            }
            
            // 如果没有超市信息，则使用"其他"作为默认分组
            if (!cheapestSupermarket) {
                cheapestSupermarket = '其他';
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
            const supermarketHeader = document.createElement('div');
            supermarketHeader.className = 'supermarket-header';
            supermarketHeader.innerHTML = `<h4>${supermarket}</h4>`;
            fragment.appendChild(supermarketHeader);
            
            // 为该超市的商品创建列表
            supermarketGroups[supermarket].forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.food.name}</div>
                        <div class="cart-item-price">${item.food.price.toFixed(2)} 日元 × ${item.quantity}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn decrease" data-id="${item.food.id}">-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.food.id}">+</button>
                        <button class="remove-item" data-id="${item.food.id}">×</button>
                    </div>
                `;
                fragment.appendChild(cartItemElement);
            });
        });
        
        // 一次性添加所有元素到DOM
        cartItems.appendChild(fragment);
        
        // 绑定事件
        cartItems.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const foodId = e.target.dataset.id;
                const item = items.find(i => i.food.id === foodId);
                if (item && item.quantity > 1) {
                    this.foodStorage.updateCartItemQuantity(foodId, item.quantity - 1);
                    this.updateCartUI();
                } else {
                    this.foodStorage.removeFromCart(foodId);
                    this.updateCartUI();
                }
            });
        });
        
        cartItems.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const foodId = e.target.dataset.id;
                const item = items.find(i => i.food.id === foodId);
                if (item) {
                    this.foodStorage.updateCartItemQuantity(foodId, item.quantity + 1);
                    this.updateCartUI();
                }
            });
        });
        
        cartItems.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const foodId = e.target.dataset.id;
                this.foodStorage.removeFromCart(foodId);
                this.updateCartUI();
            });
        });
        
        // 更新总价
        cartTotal.textContent = `${total.toFixed(2)} 日元`;
    }

    // 打开购物车
    openCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
        }
    }

    // 关闭购物车
    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.remove('active');
        }
    }

    // 打开订单
    async openOrder() {
        const orderSidebar = document.getElementById('orderSidebar');
        if (orderSidebar) {
            orderSidebar.classList.add('active');
            // 重新加载订单数据并渲染
            await this.foodStorage.loadFromDatabase();
            this.renderOrders();
        }
    }

    // 关闭订单
    closeOrder() {
        const orderSidebar = document.getElementById('orderSidebar');
        if (orderSidebar) {
            orderSidebar.classList.remove('active');
        }
    }

    // 渲染订单
    renderOrders() {
        const orderItems = document.getElementById('orderItems');
        if (!orderItems) return;

        const orders = this.foodStorage.getOrders();
        
        // 显示所有订单，而不仅仅是当天的订单
        const allOrders = orders;

        orderItems.innerHTML = '';

        if (allOrders.length === 0) {
            orderItems.innerHTML = '<div class="order-empty">暂无订单记录</div>';
            return;
        }

        // 按日期倒序排列订单
        const sortedOrders = [...allOrders].sort((a, b) => {
            // 按创建时间排序
            return new Date(b.created_at) - new Date(a.created_at);
        });
        
        // 使用文档片段来减少DOM操作
        const fragment = document.createDocumentFragment();

        sortedOrders.forEach(order => {
            // 创建订单容器
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            // 计算订单总价
            const orderTotal = order.items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
            
            // 创建订单头部信息
            const orderHeader = document.createElement('div');
            orderHeader.className = 'order-item-info';
            // 简化订单号显示，只显示前8位
            const shortOrderId = order.id ? order.id.substring(0, 8) : '未知';
            // 格式化订单时间，不显示秒
            const orderDate = new Date(order.date);
            const formattedDate = `${orderDate.getFullYear()}年${(orderDate.getMonth() + 1).toString().padStart(2, '0')}月${orderDate.getDate().toString().padStart(2, '0')}日 ${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
            orderHeader.innerHTML = `
                <div class="order-item-name">订单号: ${shortOrderId}</div>
                <div class="order-item-date">${formattedDate}</div>
                <div class="order-item-total">总价: ${orderTotal.toFixed(2)} 日元</div>
            `;
            
            orderElement.appendChild(orderHeader);
            fragment.appendChild(orderElement);
            
            // 按超市分组商品
            const supermarketGroups = {};
            
            // 为订单中的每个商品创建列表项，并按超市分组
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
                const supermarketHeader = document.createElement('div');
                supermarketHeader.className = 'supermarket-header';
                supermarketHeader.innerHTML = `<h4>${supermarket}</h4>`;
                fragment.appendChild(supermarketHeader);
                
                // 为该超市的商品创建列表项
                supermarketGroups[supermarket].forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'order-item';
                    itemElement.innerHTML = `
                        <div class="order-item-info">
                            <div class="order-item-name">${item.name}</div>
                            <div class="order-item-price">${item.price.toFixed(2)} 日元 × ${item.quantity}</div>
                        </div>
                        <div class="order-item-quantity">
                            ${(item.price * item.quantity).toFixed(2)} 日元
                        </div>
                    `;
                    fragment.appendChild(itemElement);
                });
            });
            
            // 添加分隔线
            const divider = document.createElement('div');
            divider.style.borderBottom = '1px solid var(--border-color)';
            divider.style.margin = '0.5rem 0';
            fragment.appendChild(divider);
        });
        
        // 一次性添加所有元素到DOM
        orderItems.appendChild(fragment);
    }

    // 结算
    async checkout() {
        const items = this.foodStorage.getCartItems();
        if (items.length === 0) {
            this.showToast('购物车为空', 'error');
            return;
        }
        
        // 检查用户是否已登录
        const user = await this.foodStorage.supabaseAuth.getCurrentUser();
        if (!user) {
            this.showToast('请先登录再进行结算', 'error');
            return;
        }
        
        const total = this.foodStorage.getCartTotal();
        
        // 创建订单对象，包含更多商品信息
        const orderItems = items.map(item => ({
            id: item.food.id,
            name: item.food.name,
            price: item.food.price,
            quantity: item.quantity,
            supermarkets: item.food.supermarkets || [] // 保存超市信息
        }));
        
        const order = {
            items: orderItems,
            total: total
        };
        
        console.log('准备创建订单:', order);
        
        try {
            // 保存订单
            const result = await this.foodStorage.addOrder(order);
            console.log('订单保存结果:', result);
            
            // 检查结果是否成功
            if (result && !result.error && result.id) {
                // 显示成功消息
                const message = `结算成功！订单号: ${result.id} 总价: ${total.toFixed(2)} 日元`;
                this.showToast(message, 'success');
                
                // 清空购物车
                this.foodStorage.clearCart();
                this.updateCartUI();
                this.closeCart();
                
                // 如果订单页面打开，则更新订单显示
                const orderSidebar = document.getElementById('orderSidebar');
                if (orderSidebar && orderSidebar.classList.contains('active')) {
                    // 重新加载订单数据并渲染
                    await this.foodStorage.loadFromDatabase();
                    this.renderOrders();
                }
            } else {
                // 处理错误情况
                const errorMessage = result && result.error ? result.error : '结算失败，请重试';
                console.error('订单保存失败，返回结果:', result);
                this.showToast('结算失败: ' + errorMessage, 'error');
            }
        } catch (error) {
            console.error('结算过程中发生错误:', error);
            this.showToast('结算失败: ' + error.message, 'error');
        }
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
}

// 菜品数据存储
class FoodStorage extends SupabaseFoodStorage {
    constructor() {
        super();
    }

    // 从localStorage加载数据 - 重写父类方法
    loadFromLocalStorage() {
        super.loadFromLocalStorage();
    }

    // 从数据库加载数据 - 重写父类方法
    async loadFromDatabase() {
        await super.loadFromDatabase();
    }
    
    // 重写initialize方法以确保正确初始化
    async initialize() {
        await super.initialize();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    const foodUI = new FoodUI();
    // 等待存储初始化完成
    await foodUI.foodStorage.initialize();
    foodUI.bindEvents();
    foodUI.renderFoods();
    foodUI.updateCartUI();
    
    // 监听订单实时更新事件
    window.addEventListener('ordersUpdated', () => {
        console.log('收到订单更新事件');
        // 如果订单侧边栏是打开的，则重新渲染订单
        const orderSidebar = document.getElementById('orderSidebar');
        if (orderSidebar && orderSidebar.classList.contains('active')) {
            foodUI.renderOrders();
        }
    });
});