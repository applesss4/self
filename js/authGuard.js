// 认证保护中间件
import supabase from './supabase.js';
import SupabaseAuth from './supabaseAuth.js';

class AuthGuard {
    constructor() {
        this.supabaseAuth = new SupabaseAuth();
    }

    // 检查用户是否已认证
    async checkAuth() {
        try {
            // 首先检查本地会话存储
            const sessionToken = localStorage.getItem('supabase.auth.token');
            if (!sessionToken) {
                // 如果本地没有会话，检查Supabase会话
                const { data, error } = await supabase.auth.getSession();
                if (error || !data?.session) {
                    return false;
                }
                // 保存会话到本地存储
                if (data.session) {
                    localStorage.setItem('supabase.auth.token', data.session.access_token);
                }
                return true;
            }
            
            // 验证本地存储的令牌是否仍然有效
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                // 令牌无效，清除本地存储
                this.clearAuth();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('检查认证状态时出错:', error);
            // 出错时清除认证信息
            this.clearAuth();
            return false;
        }
    }

    // 要求用户必须认证才能访问
    async requireAuth(redirectUrl = '/') {
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            // 保存用户尝试访问的页面
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            // 重定向到登录页面
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // 获取当前用户
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                // 如果获取用户出错，清除认证信息
                this.clearAuth();
                throw error;
            }
            return user;
        } catch (error) {
            console.error('获取当前用户时出错:', error);
            return null;
        }
    }

    // 监听认证状态变化
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            // 更新本地存储
            if (session) {
                localStorage.setItem('supabase.auth.token', session.access_token);
            } else {
                localStorage.removeItem('supabase.auth.token');
            }
            
            // 调用回调函数
            if (callback && typeof callback === 'function') {
                callback(event, session);
            }
        });
    }

    // 清除认证信息
    clearAuth() {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('isLoggedIn');
    }
}

// 创建单例实例
const authGuard = new AuthGuard();

// 页面加载时自动检查认证状态
document.addEventListener('DOMContentLoaded', async () => {
    // 对于非登录页面，检查认证状态
    const isLoginPage = window.location.pathname.includes('/index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname.includes('/test-login.html') ||
                       window.location.pathname.includes('/debug');
    
    if (!isLoginPage) {
        // 延迟检查以确保DOM完全加载
        setTimeout(async () => {
            const isAuthenticated = await authGuard.checkAuth();
            if (!isAuthenticated) {
                // 保存当前页面以便登录后返回
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                // 重定向到登录页面
                window.location.href = '/';
            }
        }, 100);
    }
});

export default authGuard;