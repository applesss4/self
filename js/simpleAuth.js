// 简化版认证功能（已升级为Supabase认证）
// 版本: 1.0.34
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';
import authGuard from './authGuard.js';

let supabaseAuth = null;

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

function initAuth() {
    // 初始化 Supabase 认证
    supabaseAuth = new SupabaseAuth();
    
    // 检查用户是否已经登录，如果已登录则重定向到任务页面
    checkAlreadyLoggedIn();
    
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        bindAuthEvents();
    }, 100);
}

// 检查用户是否已经登录
async function checkAlreadyLoggedIn() {
    try {
        const isAuthenticated = await authGuard.checkAuth();
        if (isAuthenticated) {
            // 检查是否有重定向URL
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                // 清除重定向URL
                sessionStorage.removeItem('redirectAfterLogin');
                // 重定向到用户原本想访问的页面
                window.location.href = redirectUrl;
            } else {
                // 默认重定向到任务计划页面
                window.location.href = '/pages/tasks.html';
            }
        }
    } catch (error) {
        console.error('检查登录状态时出错:', error);
    }
}

function bindAuthEvents() {
    // 获取必要的DOM元素
    const authForm = document.getElementById('authForm');
    
    // 如果找到了必要的元素，绑定事件
    if (authForm) {
        // 表单提交事件
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAuth();
        });
        
        // 动态链接事件委托
        document.addEventListener('click', function(e) {
            if (e.target.id === 'switchToRegisterLink') {
                e.preventDefault();
                // 跳转到注册页面（如果有的话）或者显示注册表单
                switchToRegister();
            }
        });
    } else {
        // 如果元素还没加载完成，稍后再试
        setTimeout(bindAuthEvents, 500);
    }
}

function switchToRegister() {
    // 简单提示用户需要注册账户
    alert('请使用测试账户登录：123@123.com / 123');
}

// 处理认证（登录）
async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    // 简单验证
    if (!email || !password) {
        showToast('请输入邮箱和密码', 'error');
        return;
    }
    
    // 登录模式
    try {
        const result = await supabaseAuth.signIn(email, password);
        if (result.success) {
            // 登录成功，显示成功消息并跳转到任务计划页面
            showToast('登录成功！正在跳转...', 'success');
            
            // 保存登录状态标记
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // 检查是否有重定向URL
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                // 清除重定向URL
                sessionStorage.removeItem('redirectAfterLogin');
                // 2秒后跳转到用户原本想访问的页面
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 2000);
            } else {
                // 2秒后跳转到任务计划页面
                setTimeout(() => {
                    window.location.href = '/pages/tasks.html';
                }, 2000);
            }
        } else {
            showToast(`登录失败: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`登录异常: ${error.message}`, 'error');
    }
}

function showToast(message, type) {
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