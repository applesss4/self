// 主页面逻辑
import SupabaseAuth from './supabaseAuth.js';

document.addEventListener('DOMContentLoaded', function() {
    // 页面加载完成后初始化
    init();
});

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
    // 任务计划按钮点击事件
    const tasksFeature = document.getElementById('tasks-feature');
    if (tasksFeature) {
        tasksFeature.addEventListener('click', navigateToTasks);
    }
    
    // 导航链接点击事件
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
}

// 检查用户登录状态并更新导航栏
async function checkUserStatus() {
    try {
        // 从sessionStorage获取登录状态
        const loginStatus = sessionStorage.getItem('isLoggedIn');
        const pagesDropdown = document.getElementById('pagesDropdown');
        
        if (loginStatus === 'true') {
            // 用户已登录，显示下拉菜单
            if (pagesDropdown) {
                pagesDropdown.style.display = 'block';
            }
        } else {
            // 用户未登录，隐藏下拉菜单
            if (pagesDropdown) {
                pagesDropdown.style.display = 'none';
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