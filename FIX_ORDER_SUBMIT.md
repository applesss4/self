# 订单提交问题修复

## 问题描述
当用户点击结算按钮时，虽然订单数据已经准备好了，但订单并没有真正提交到数据库中，导致订单记录为空。

## 问题分析
通过代码分析发现以下问题：

1. 在 `food.js` 的 `checkout` 方法中，虽然调用了 `this.foodStorage.addOrder(order)`，但没有正确处理异步操作的结果。
2. 在 `supabaseFoodStorage.js` 的 `addOrder` 方法中，错误处理不够完善，当插入订单失败时，没有返回明确的错误信息。

## 解决方案
### 1. 修改 `food.js` 中的 `checkout` 方法
增加了更详细的错误处理和日志记录：

```javascript
async checkout() {
    const items = this.foodStorage.getCartItems();
    if (items.length === 0) {
        this.showToast('购物车为空', 'error');
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
        
        if (result && result.id) {
            // 显示成功消息
            const message = `结算成功！订单号: ${result.id} 总价: ¥${total.toFixed(2)}`;
            this.showToast(message, 'success');
            
            // 清空购物车
            this.foodStorage.clearCart();
            this.updateCartUI();
            this.closeCart();
            
            // 如果订单页面打开，则更新订单显示
            const orderSidebar = document.getElementById('orderSidebar');
            if (orderSidebar && orderSidebar.classList.contains('active')) {
                this.renderOrders();
            }
        } else {
            console.error('订单保存失败，返回结果:', result);
            this.showToast('结算失败，请重试', 'error');
        }
    } catch (error) {
        console.error('结算过程中发生错误:', error);
        this.showToast('结算失败: ' + error.message, 'error');
    }
}
```

### 2. 修改 `supabaseFoodStorage.js` 中的 `addOrder` 方法
增加了更完善的错误处理和日志记录：

```javascript
async addOrder(order) {
    try {
        // 始终使用在线模式保存到数据库
        const user = await this.supabaseAuth.getCurrentUser();
        if (!user) {
            console.error('用户未登录，无法添加订单');
            return { error: '用户未登录' };
        }

        // 计算订单总价（如果未提供）
        const total = order.total || order.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // 准备要插入的数据
        const orderToInsert = {
            user_id: user.id,
            items: order.items || [],
            total: total,
            date: new Date().toISOString() // 确保使用标准格式
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
        }
        return data || { error: '无返回数据' };
    } catch (error) {
        console.error('添加订单时发生异常:', error);
        return { error: error.message };
    }
}
```

## 测试验证
创建了测试文件 `test_order_creation.html` 来验证修复效果，该文件包含以下功能：
1. 检查用户认证状态
2. 创建测试订单
3. 查看订单记录
4. 详细的日志输出

## 结论
通过以上修改，订单提交功能应该能够正常工作。当用户点击结算按钮时，订单数据会正确保存到数据库中，并且在出现错误时会显示明确的错误信息。