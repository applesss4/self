// 简化版认证功能（已升级为Supabase认证）
// 版本: 1.0.33
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';

let supabaseAuth = null;
let authSubscription = null; // 用于存储认证状态订阅

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

function initAuth() {
    // 初始化 Supabase 认证
    supabaseAuth = new SupabaseAuth();
    
    // 检查是否为首页
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    
    // 如果不是首页，检查 sessionStorage 中的登录状态
    if (!isHomePage) {
        const loginStatus = sessionStorage.getItem('isLoggedIn');
        if (loginStatus !== 'true') {
            // 用户未在首页登录，重定向到首页
            window.location.href = '/';
            return;
        }
    }
    
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        bindAuthEvents();
    }, 100);
}

function bindAuthEvents() {
    // 获取必要的DOM元素
    const loginBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    
    // 如果找到了必要的元素，绑定事件
    if (loginBtn && authModal) {
        // 使用更安全的方式移除可能已存在的事件监听器，防止重复绑定
        const existingClone = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(existingClone, loginBtn);
        
        // 重新获取引用
        const updatedLoginBtn = document.getElementById('loginBtn');
        
        // 绑定登录按钮点击事件
        updatedLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 检查当前用户状态
            supabaseAuth.getCurrentUser().then(user => {
                if (user) {
                    // 用户已登录，执行登出操作
                    handleSignOut();
                } else {
                    // 用户未登录，打开登录模态框
                    openAuthModal();
                }
            }).catch(error => {
                // 出错时默认打开登录模态框
                openAuthModal();
            });
        });
        
        // 绑定模态框相关事件
        bindModalEvents();
        
        // 检查用户登录状态并监听变化
        checkUserStatus();
        
        // 在首页不需要监听认证状态变化，避免与main.js冲突
        // 认证状态变化由main.js统一处理
    } else {
        // 如果元素还没加载完成，稍后再试
        setTimeout(bindAuthEvents, 500);
    }
}

function bindModalEvents() {
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const cancelAuth = document.getElementById('cancelAuth');
    const authForm = document.getElementById('authForm');
    
    // 关闭按钮事件
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', function(e) {
            e.preventDefault();
            closeAuthModalFunc();
        });
    }
    
    // 取消按钮事件
    if (cancelAuth) {
        cancelAuth.addEventListener('click', function(e) {
            e.preventDefault();
            closeAuthModalFunc();
        });
    }
    
    // 点击模态框外部关闭
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                closeAuthModalFunc();
            }
        });
    }
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal && authModal.classList.contains('active')) {
            closeAuthModalFunc();
        }
    });
    
    // 表单提交事件
    if (authForm) {
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAuth();
        });
    }
    
    // 动态链接事件委托
    document.addEventListener('click', function(e) {
        if (e.target.id === 'switchToRegister') {
            e.preventDefault();
            switchToRegister();
        } else if (e.target.id === 'switchToLogin') {
            e.preventDefault();
            switchToLogin();
        }
    });
}

function openAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('active');
        switchToLogin(); // 默认显示登录界面
    }
}

function closeAuthModalFunc() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('active');
    }
}

function switchToLogin() {
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const submitAuth = document.getElementById('submitAuth');
    const authModalTitle = document.getElementById('authModalTitle');
    const authSwitchText = document.getElementById('authSwitchText');
    
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
    if (submitAuth) submitAuth.textContent = '登录';
    if (authModalTitle) authModalTitle.textContent = '用户登录';
    if (authSwitchText) authSwitchText.innerHTML = '还没有账户？<a href="#" id="switchToRegister">立即注册</a>';
}

function switchToRegister() {
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const submitAuth = document.getElementById('submitAuth');
    const authModalTitle = document.getElementById('authModalTitle');
    const authSwitchText = document.getElementById('authSwitchText');
    
    if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'flex';
    if (submitAuth) submitAuth.textContent = '注册';
    if (authModalTitle) authModalTitle.textContent = '用户注册';
    if (authSwitchText) authSwitchText.innerHTML = '已有账户？<a href="#" id="switchToLogin">立即登录</a>';
}

// 检查用户登录状态
async function checkUserStatus() {
    try {
        const user = await supabaseAuth.getCurrentUser();
        console.log('检查用户状态:', user?.id);
        updateLoginButton(user);
    } catch (error) {
        console.error('检查用户状态时出错:', error);
    }
}

// 更新登录按钮显示
function updateLoginButton(user) {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        console.log('更新登录按钮状态:', user?.id);
        if (user) {
            // 用户已登录，只显示"退出"，不显示用户名
            loginBtn.textContent = '退出';
        } else {
            // 用户未登录，显示"登录"
            loginBtn.textContent = '登录';
        }
    } else {
        console.log('未找到登录按钮元素');
    }
}

// 处理认证（登录/注册）
async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const confirmPassword = document.getElementById('authConfirmPassword').value;
    
    // 简单验证
    if (!email || !password) {
        showToast('请输入邮箱和密码', 'error');
        return;
    }
    
    // 检查是否为注册模式
    const isRegisterMode = document.getElementById('submitAuth').textContent === '注册';
    
    if (isRegisterMode) {
        // 注册模式验证
        if (password !== confirmPassword) {
            showToast('两次输入的密码不一致', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('密码至少需要6个字符', 'error');
            return;
        }
        // 简单邮箱验证
        if (!email.includes('@')) {
            showToast('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // 调用Supabase注册功能
        try {
            const result = await supabaseAuth.signUp(email, password);
            if (result.success) {
                showToast('注册成功！请登录。', 'success');
                switchToLogin();
                document.getElementById('authForm').reset();
            } else {
                showToast(`注册失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showToast(`注册异常: ${error.message}`, 'error');
        }
    } else {
        // 登录模式
        try {
            const result = await supabaseAuth.signIn(email, password);
            if (result.success) {
                // 修改提示信息，不再显示用户名
                showToast('登录成功！', 'success');
                closeAuthModalFunc();
                document.getElementById('authForm').reset();
                
                // 更新登录按钮文本
                updateLoginButton(result.data.user);
            } else {
                showToast(`登录失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showToast(`登录异常: ${error.message}`, 'error');
        }
    }
}

// 处理登出
async function handleSignOut() {
    try {
        const result = await supabaseAuth.signOut();
        if (result.success) {
            // 清除登录状态标记
            sessionStorage.removeItem('isLoggedIn');
            
            // 立即跳转到首页
            window.location.href = '/';
        } else {
            showToast(`退出失败: ${result.error}`, 'error');
        }
    } catch (error) {
        showToast(`退出异常: ${error.message}`, 'error');
    }
}

function showToast(message, type) {
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