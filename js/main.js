// 主页面逻辑
// 版本: 1.0.36
import SupabaseAuth from './supabaseAuth.js';

let supabaseAuth = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 Supabase 认证
    supabaseAuth = new SupabaseAuth();
    
    // 等待一小段时间让认证初始化完成
    setTimeout(async () => {
        // 检查用户是否已登录
        await checkUserStatus();
        
        // 绑定事件监听器
        bindAuthEvents();
        bindEventListeners();
        
        // 显示欢迎消息
        showWelcomeMessage();
    }, 100);
});

// 检查用户登录状态
async function checkUserStatus() {
    try {
        console.log('开始检查用户状态');
        
        // 先尝试获取当前会话
        let session = await supabaseAuth.getCurrentSession();
        let user = null;
        
        console.log('当前会话:', session);
        
        if (session?.user) {
            user = session.user;
        } else {
            // 如果会话中没有用户，尝试获取当前用户
            user = await supabaseAuth.getCurrentUser();
            console.log('通过getUser获取用户:', user);
        }
        
        const featuresBtn = document.getElementById('featuresBtn');
        console.log('用户状态:', user);
        
        if (user) {
            // 用户已登录，显示功能区域，隐藏登录框
            document.getElementById('authSection').style.display = 'none';
            if (document.getElementById('featuresSection')) {
                document.getElementById('featuresSection').style.display = 'grid';
            }
            if (featuresBtn) {
                featuresBtn.style.display = 'block';
                // 添加登录样式类
                featuresBtn.classList.add('loggedIn');
            }
            // 设置登录状态标记
            sessionStorage.setItem('isLoggedIn', 'true');
        } else {
            // 用户未登录，显示登录框，隐藏功能区域
            document.getElementById('authSection').style.display = 'block';
            if (document.getElementById('featuresSection')) {
                document.getElementById('featuresSection').style.display = 'none';
            }
            if (featuresBtn) {
                featuresBtn.style.display = 'none';
                // 移除登录样式类
                featuresBtn.classList.remove('loggedIn');
            }
            // 清除登录状态标记
            sessionStorage.removeItem('isLoggedIn');
        }
    } catch (error) {
        console.error('检查用户状态时出错:', error);
    }
}

// 绑定认证相关事件
function bindAuthEvents() {
    // 获取必要的DOM元素
    const authForm = document.getElementById('authForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToRegisterLink = document.getElementById('switchToRegisterLink');
    
    // 表单提交事件
    if (authForm) {
        // 先移除可能已存在的事件监听器，防止重复绑定
        const newAuthForm = authForm.cloneNode(true);
        authForm.parentNode.replaceChild(newAuthForm, authForm);
        const updatedAuthForm = document.getElementById('authForm');
        
        updatedAuthForm.addEventListener('submit', function(e) {
            console.log('表单提交事件触发');
            e.preventDefault();
            handleAuth();
        });
    }
    
    // 切换到注册
    if (switchToRegister) {
        // 先移除可能已存在的事件监听器，防止重复绑定
        const newSwitchToRegister = switchToRegister.cloneNode(true);
        switchToRegister.parentNode.replaceChild(newSwitchToRegister, switchToRegister);
        const updatedSwitchToRegister = document.getElementById('switchToRegister');
        
        updatedSwitchToRegister.addEventListener('click', function(e) {
            console.log('切换到注册按钮点击');
            e.preventDefault();
            switchToRegisterForm();
        });
    }
    
    // 通过链接切换到注册
    if (switchToRegisterLink) {
        // 先移除可能已存在的事件监听器，防止重复绑定
        const newSwitchToRegisterLink = switchToRegisterLink.cloneNode(true);
        switchToRegisterLink.parentNode.replaceChild(newSwitchToRegisterLink, switchToRegisterLink);
        const updatedSwitchToRegisterLink = document.getElementById('switchToRegisterLink');
        
        updatedSwitchToRegisterLink.addEventListener('click', function(e) {
            console.log('注册链接点击');
            e.preventDefault();
            switchToRegisterForm();
        });
    }
    
    // 监听认证状态变化
    if (supabaseAuth) {
        supabaseAuth.onAuthStateChange((event, session) => {
            console.log('认证状态变化:', event, session);
            
            if (event === 'SIGNED_IN') {
                // 登录成功，隐藏登录框
                document.getElementById('authSection').style.display = 'none';
                
                // 设置登录状态标记
                sessionStorage.setItem('isLoggedIn', 'true');
                
                // 显示登录成功的提示消息
                showCustomToast('成功进入发财人生管理系统', 'success');
                
                // 3秒后跳转到任务计划页面
                setTimeout(() => {
                    console.log('正在跳转到任务计划页面...');
                    window.location.href = '/pages/tasks.html';
                }, 3000);
            } else if (event === 'SIGNED_OUT') {
                // 登出，显示登录框
                document.getElementById('authSection').style.display = 'block';
                
                // 清除登录状态标记
                sessionStorage.removeItem('isLoggedIn');
            }
        });
    }
}

// 切换到注册表单
function switchToRegisterForm() {
    console.log('切换到注册表单');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const submitAuth = document.getElementById('submitAuth');
    const authTitle = document.querySelector('.auth-title');
    const switchToRegister = document.getElementById('switchToRegister');
    
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'flex';
    if (submitAuth) submitAuth.textContent = '注册';
    if (authTitle) authTitle.textContent = '用户注册';
    if (switchToRegister) switchToRegister.textContent = '返回登录';
    
    // 更新返回登录的事件
    switchToRegister.onclick = switchToLoginForm;
}

// 切换到登录表单
function switchToLoginForm() {
    console.log('切换到登录表单');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const submitAuth = document.getElementById('submitAuth');
    const authTitle = document.querySelector('.auth-title');
    const switchToRegister = document.getElementById('switchToRegister');
    
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
    if (submitAuth) submitAuth.textContent = '登录';
    if (authTitle) authTitle.textContent = '用户登录';
    if (switchToRegister) switchToRegister.textContent = '注册账户';
    
    // 更新注册事件
    switchToRegister.onclick = switchToRegisterForm;
}

// 处理认证（登录/注册）
async function handleAuth() {
    console.log('处理认证');
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const confirmPassword = document.getElementById('authConfirmPassword').value;
    
    // 简单验证
    if (!email || !password) {
        showCustomToast('请输入邮箱和密码', 'error');
        return;
    }
    
    // 检查是否为注册模式
    const isRegisterMode = document.getElementById('submitAuth').textContent === '注册';
    
    if (isRegisterMode) {
        // 注册模式验证
        if (password !== confirmPassword) {
            showCustomToast('两次输入的密码不一致', 'error');
            return;
        }
        if (password.length < 6) {
            showCustomToast('密码至少需要6个字符', 'error');
            return;
        }
        // 简单邮箱验证
        if (!email.includes('@')) {
            showCustomToast('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // 调用Supabase注册功能
        try {
            console.log('开始注册');
            const result = await supabaseAuth.signUp(email, password);
            console.log('注册结果:', result);
            if (result.success) {
                showCustomToast('注册成功！请登录。', 'success');
                switchToLoginForm();
                document.getElementById('authForm').reset();
            } else {
                showCustomToast(`注册失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showCustomToast(`注册异常: ${error.message}`, 'error');
        }
    } else {
        // 登录模式
        try {
            console.log('开始登录');
            const result = await supabaseAuth.signIn(email, password);
            console.log('登录结果:', result);
            if (result.success) {
                console.log('登录成功，准备跳转');
            } else {
                console.error('登录失败详情:', result.error);
            }
            if (result.success) {
                console.log('登录成功，准备跳转');
            } else {
                console.error('登录失败详情:', result.error);
            }
        } catch (error) {
            showCustomToast(`登录异常: ${error.message}`, 'error');
        }
    }
}

// 显示自定义提示消息
function showCustomToast(message, type = 'info') {
    console.log('显示提示消息:', message, type);
    // 创建或获取提示元素
    let toast = document.getElementById('customToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'customToast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            max-width: 300px;
        `;
        document.body.appendChild(toast);
    }
    
    // 设置消息内容和样式
    toast.textContent = message;
    
    // 根据类型设置背景色
    switch(type) {
        case 'success':
            toast.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            toast.style.backgroundColor = '#F44336';
            break;
        case 'warning':
            toast.style.backgroundColor = '#FF9800';
            break;
        default:
            toast.style.backgroundColor = '#2196F3';
    }
    
    // 显示提示
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
    }, 3000);
}

function init() {
    // 设置今天的日期
    updateCurrentDate();
    
    // 显示欢迎消息
    showWelcomeMessage();
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    const dateString = now.toLocaleDateString('zh-CN', options);
    
    // 如果页面有日期显示元素，更新它
    const dateElements = document.querySelectorAll('.current-date');
    dateElements.forEach(el => {
        el.textContent = dateString;
    });
}

function bindEventListeners() {
    // 功能卡片按钮点击事件
    const featureButtons = document.querySelectorAll('.feature-button');
    featureButtons.forEach(button => {
        button.addEventListener('click', handleFeatureNavigation);
    });
    
    // 导航链接点击事件
    const navLinks = document.querySelectorAll('.nav-link:not(#featuresBtn)');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // 功能按钮点击事件
    const featuresBtn = document.getElementById('featuresBtn');
    if (featuresBtn) {
        featuresBtn.addEventListener('click', function() {
            openFeaturesModal();
        });
    }
    
    // 关闭功能菜单模态框
    const closeFeaturesModal = document.getElementById('closeFeaturesModal');
    if (closeFeaturesModal) {
        closeFeaturesModal.addEventListener('click', function() {
            closeFeaturesModalFunc();
        });
    }
    
    // 点击模态框外部关闭
    const featuresModal = document.getElementById('featuresModal');
    if (featuresModal) {
        featuresModal.addEventListener('click', (e) => {
            if (e.target.id === 'featuresModal') {
                closeFeaturesModalFunc();
            }
        });
    }
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFeaturesModalFunc();
        }
    });
}

// 处理功能卡片导航
function handleFeatureNavigation(event) {
    const button = event.target;
    const page = button.getAttribute('data-page');
    
    // 根据页面跳转
    let pageUrl = '';
    switch(page) {
        case 'tasks':
            pageUrl = '/pages/tasks.html';
            break;
        case 'schedule':
            pageUrl = '/pages/schedule.html';
            break;
        case 'food':
            pageUrl = '/pages/food.html';
            break;
        case 'stats':
            pageUrl = '/pages/stats.html';
            break;
        default:
            return;
    }
    
    // 添加页面切换动画
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        window.location.href = pageUrl;
    }, 150);
}

// 打开功能菜单模态框
function openFeaturesModal() {
    const featuresModal = document.getElementById('featuresModal');
    if (featuresModal) {
        featuresModal.classList.add('active');
    }
}

// 关闭功能菜单模态框
function closeFeaturesModalFunc() {
    const featuresModal = document.getElementById('featuresModal');
    if (featuresModal) {
        featuresModal.classList.remove('active');
    }
}

// 导航到任务页面
function navigateToTasks() {
    window.location.href = 'pages/tasks.html';
}

// 处理导航
function handleNavigation(event) {
    const link = event.target;
    const href = link.getAttribute('href');
    
    // 添加页面切换动画
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        window.location.href = href;
    }, 150);
}

// 显示欢迎消息
function showWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 6) {
        greeting = '夜深了，记得早点休息哦';
    } else if (hour < 12) {
        greeting = '早安！新的一天开始了';
    } else if (hour < 18) {
        greeting = '下午好！继续加油';
    } else {
        greeting = '晚上好！今天过得怎么样';
    }
    
    // 可以在控制台显示或者通过其他方式展示
    // console.log(`🏠 ${greeting}`);
}

// 添加平滑滚动效果
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 工具函数：格式化日期
function formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 工具函数：格式化时间
function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 导出到全局作用域（如果需要）
window.navigateToTasks = navigateToTasks;
window.smoothScrollTo = smoothScrollTo;