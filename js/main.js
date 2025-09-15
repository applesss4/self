// 主页面逻辑
// 版本: 1.0.32
import SupabaseAuth from './supabaseAuth.js';

let supabaseAuth = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 Supabase 认证
    supabaseAuth = new SupabaseAuth();
    
    // 检查用户是否已登录
    checkUserStatus();
    
    // 绑定事件监听器
    bindAuthEvents();
    bindEventListeners();
    
    // 显示欢迎消息
    showWelcomeMessage();
});

// 检查用户登录状态
async function checkUserStatus() {
    try {
        const user = await supabaseAuth.getCurrentUser();
        const featuresBtn = document.getElementById('featuresBtn');
        
        if (user) {
            // 用户已登录，显示功能区域，隐藏登录框
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('featuresSection').style.display = 'grid';
            if (featuresBtn) {
                featuresBtn.style.display = 'block';
                // 添加登录样式类
                featuresBtn.classList.add('loggedIn');
            }
        } else {
            // 用户未登录，显示登录框，隐藏功能区域
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('featuresSection').style.display = 'none';
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

// 绑定认证相关事件
function bindAuthEvents() {
    // 获取必要的DOM元素
    const authForm = document.getElementById('authForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToRegisterLink = document.getElementById('switchToRegisterLink');
    
    // 表单提交事件
    if (authForm) {
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAuth();
        });
    }
    
    // 切换到注册
    if (switchToRegister) {
        switchToRegister.addEventListener('click', switchToRegisterForm);
    }
    
    // 通过链接切换到注册
    if (switchToRegisterLink) {
        switchToRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToRegisterForm();
        });
    }
    
    // 监听认证状态变化
    supabaseAuth.onAuthStateChange((event, session) => {
        console.log('认证状态变化:', event);
        
        if (event === 'SIGNED_IN') {
            // 登录成功，隐藏登录框
            document.getElementById('authSection').style.display = 'none';
            
            // 设置登录状态标记
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // 显示自定义提示消息
            showCustomToast('成功进入发财人生管理系统', 'success');
            
            // 3秒后自动跳转到任务计划页面
            setTimeout(() => {
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

// 切换到注册表单
function switchToRegisterForm() {
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
            const result = await supabaseAuth.signUp(email, password);
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
            const result = await supabaseAuth.signIn(email, password);
            if (result.success) {
                // 登录成功，将在认证状态变化监听器中处理页面跳转
                sessionStorage.setItem('isLoggedIn', 'true');
            } else {
                showCustomToast(`登录失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showCustomToast(`登录异常: ${error.message}`, 'error');
        }
    }
}

// 显示自定义提示消息
function showCustomToast(message, type = 'info') {
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
        border-radius: var(--border-radius);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        text-align: center;
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