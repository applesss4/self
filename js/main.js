// 主页面逻辑
import SupabaseAuth from './supabaseAuth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 为导航链接添加登录检查
    addLoginCheckToNavLinks();
    
    // 其他主页逻辑...
});

// 为导航链接添加登录检查
function addLoginCheckToNavLinks() {
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
                showToast('请先登录后再访问此功能', 'error');
                
                // 显示登录模态框
                const authModal = document.getElementById('authModal');
                if (authModal) {
                    authModal.classList.add('active');
                }
            }
        });
    });
}

// 显示提示消息
function showToast(message, type = 'info') {
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

function init() {
    // 设置今天的日期
    updateCurrentDate();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 显示欢迎消息
    showWelcomeMessage();
    
    // 检查用户登录状态并更新导航栏
    checkUserStatus();
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
        featuresBtn.addEventListener('click', openFeaturesModal);
    }
    
    // 关闭功能菜单模态框
    const closeFeaturesModal = document.getElementById('closeFeaturesModal');
    if (closeFeaturesModal) {
        closeFeaturesModal.addEventListener('click', closeFeaturesModalFunc);
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
    
    // 检查用户是否已登录
    const loginStatus = sessionStorage.getItem('isLoggedIn');
    if (loginStatus !== 'true') {
        alert('请先登录后再访问此页面');
        return;
    }
    
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

// 检查用户登录状态并更新导航栏
async function checkUserStatus() {
    try {
        // 从sessionStorage获取登录状态
        const loginStatus = sessionStorage.getItem('isLoggedIn');
        const featuresBtn = document.getElementById('featuresBtn');
        
        if (loginStatus === 'true') {
            // 用户已登录，显示功能按钮
            if (featuresBtn) {
                featuresBtn.style.display = 'block';
            }
        } else {
            // 用户未登录，隐藏功能按钮
            if (featuresBtn) {
                featuresBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('检查用户状态时出错:', error);
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
    
    // 检查是否是功能页面链接且用户未登录
    if (href && href.startsWith('/pages/') && sessionStorage.getItem('isLoggedIn') !== 'true') {
        event.preventDefault();
        alert('请先登录后再访问此页面');
        return;
    }
    
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