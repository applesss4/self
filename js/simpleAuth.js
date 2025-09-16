// 简化版认证功能（已升级为Supabase认证）
// 版本: 1.0.43
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';
import authGuard from './authGuard.js';

const supabaseAuth = new SupabaseAuth();

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

function initAuth() {
    // 检查用户是否已经登录，如果已登录则重定向到任务页面
    checkAlreadyLoggedIn();
    
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        bindAuthEvents();
    }, 100);
}

// 检查用户是否已经登录（修复版本）
async function checkAlreadyLoggedIn() {
    try {
        console.log('检查用户登录状态...');
        // 等待认证初始化完成
        await supabaseAuth.init();
        
        // 检查用户认证状态
        const authStatus = await supabaseAuth.checkAuthStatus();
        console.log('认证状态检查结果:', authStatus);
        
        if (authStatus.isAuthenticated) {
            console.log('用户已认证:', authStatus.user);
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
        } else {
            console.log('用户未认证');
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

// 处理认证（登录）（修复版本）
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
        console.log('尝试登录用户:', email);
        const result = await supabaseAuth.signIn(email, password);
        console.log('登录结果:', result);
        
        if (result.success) {
            // 登录成功，显示成功消息并跳转到任务计划页面
            showToast('登录成功！正在跳转...', 'success');
            
            // 保存登录状态标记
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // 确保认证状态已正确设置
            await supabaseAuth.init();
            
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
                // 显示成功提示
                showToast('成功进入发财人生管理系统', 'success');
                
                // 3秒后跳转到任务计划页面
                setTimeout(() => {
                    window.location.href = '/pages/tasks.html';
                }, 3000);
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