// 增强版 Supabase 认证服务
import supabase from './supabase.js';

// 使用单例模式确保只有一个SupabaseAuth实例
let instance = null;

class SupabaseAuth {
    constructor() {
        // 确保单例模式
        if (instance) {
            console.log('SupabaseAuth: 返回已存在的实例');
            return instance;
        }
        
        console.log('SupabaseAuth: 创建新实例');
        instance = this;
        this.user = null;
        this.session = null;
        this.authStateCallbacks = [];
        this.initialized = false;
        this.initPromise = null; // 用于跟踪初始化Promise
        return this;
    }

    // 初始化，尝试恢复会话
    async init() {
        // 如果已经在初始化中，返回该Promise
        if (this.initPromise) {
            return this.initPromise;
        }
        
        // 创建初始化Promise
        this.initPromise = this._performInit();
        return this.initPromise;
    }
    
    // 实际的初始化逻辑
    async _performInit() {
        try {
            console.log('SupabaseAuth: 开始初始化会话');
            // 获取当前会话
            const { data, error } = await supabase.auth.getSession();
            console.log('SupabaseAuth: getSession结果:', data, error);
            if (!error && data?.session) {
                this.session = data.session;
                this.user = data.session.user;
                console.log('SupabaseAuth: 恢复会话成功，用户:', this.user);
                
                // 确保用户在users表中存在
                if (this.user) {
                    await this.ensureUserExists(this.user);
                }
            } else {
                console.log('SupabaseAuth: 未找到有效会话或获取会话出错');
            }
            this.initialized = true;
            console.log('SupabaseAuth: 初始化完成');
        } catch (error) {
            console.error('初始化会话失败:', error);
            this.initialized = true;
        }
    }

    // 确保用户在users表中存在
    async ensureUserExists(user) {
        if (!user) return false;
        
        try {
            // 检查用户是否已存在于users表中
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();
            
            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('检查用户存在性时出错:', fetchError);
                return false;
            }
            
            // 如果用户不存在，则创建用户记录
            if (!existingUser) {
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('创建用户记录时出错:', insertError);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('确保用户存在时出错:', error);
            return false;
        }
    }

    // 用户注册
    async signUp(email, password) {
        try {
            // 验证邮箱格式
            if (!this.isValidEmail(email)) {
                throw new Error('请输入有效的邮箱地址');
            }
            
            // 验证密码强度
            if (!this.isValidPassword(password)) {
                throw new Error('密码至少需要6个字符');
            }
            
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                throw new Error(error.message);
            }

            // 确保用户在users表中存在
            if (data.user) {
                await this.ensureUserExists(data.user);
            }

            this.user = data.user;
            this.session = data.session;
            this.notifyAuthStateChange('signed_in', data);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 用户登录
    async signIn(email, password) {
        try {
            // 验证输入
            if (!email || !password) {
                throw new Error('请输入邮箱和密码');
            }
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw new Error(error.message);
            }

            // 确保用户在users表中存在
            if (data.user) {
                await this.ensureUserExists(data.user);
            }

            this.user = data.user;
            this.session = data.session;
            
            // 保存会话到本地存储
            if (data.session) {
                localStorage.setItem('supabase.auth.token', data.session.access_token);
            }
            
            this.notifyAuthStateChange('signed_in', data);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 用户登出
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw new Error(error.message);
            }

            this.user = null;
            this.session = null;
            
            // 清除本地存储的会话
            localStorage.removeItem('supabase.auth.token');
            
            this.notifyAuthStateChange('signed_out', null);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 获取当前用户
    async getCurrentUser() {
        try {
            // 等待初始化完成
            if (!this.initialized) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                throw error;
            }
            
            this.user = user;
            
            // 确保用户在users表中存在
            if (user) {
                await this.ensureUserExists(user);
            }
            
            return user;
        } catch (error) {
            console.error('获取当前用户失败:', error);
            return null;
        }
    }

    // 获取当前会话
    async getCurrentSession() {
        try {
            // 等待初始化完成
            if (!this.initialized) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                throw error;
            }
            
            this.session = data.session;
            this.user = data.session?.user || null;
            
            // 确保用户在users表中存在
            if (this.user) {
                await this.ensureUserExists(this.user);
            }
            
            return data.session;
        } catch (error) {
            console.error('获取当前会话失败:', error);
            return null;
        }
    }

    // 监听认证状态变化
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
        
        // 立即通知当前状态
        if (this.user) {
            callback('signed_in', { user: this.user, session: this.session });
        }
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                this.user = session?.user || null;
                this.session = session || null;
                
                // 确保用户在users表中存在
                if (this.user) {
                    await this.ensureUserExists(this.user);
                }
                
                this.notifyAuthStateChange(event, session);
            }
        );

        return subscription;
    }

    // 通知认证状态变化
    notifyAuthStateChange(event, session) {
        this.authStateCallbacks.forEach(callback => {
            try {
                callback(event, session);
            } catch (error) {
                // 静默处理回调错误
            }
        });
    }

    // 检查用户是否已登录
    async isAuthenticated() {
        // 等待初始化完成
        if (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return !!this.user;
    }
    
    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 验证密码强度
    isValidPassword(password) {
        return password.length >= 6;
    }
    
    // 检查认证状态并返回详细信息
    async checkAuthStatus() {
        try {
            // 等待初始化完成
            if (!this.initialized) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                return { 
                    isAuthenticated: false, 
                    user: null, 
                    error: error?.message || '用户未登录' 
                };
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            return { 
                isAuthenticated: true, 
                user: user, 
                error: null 
            };
        } catch (error) {
            return { 
                isAuthenticated: false, 
                user: null, 
                error: error.message 
            };
        }
    }
}

export default SupabaseAuth;