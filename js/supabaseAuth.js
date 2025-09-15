// Supabase 认证服务
import supabase from './supabase.js';

class SupabaseAuth {
    constructor() {
        this.user = null;
        this.session = null;
        this.authStateCallbacks = [];
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
                return false;
            }
            
            // 如果用户不存在，则创建用户记录
            if (!existingUser) {
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email
                    })
                    .select()
                    .single();
                
                if (insertError) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
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
            this.notifyAuthStateChange('signed_out', null);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 获取当前用户
    async getCurrentUser() {
        try {
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
            // 检查是否是会话丢失错误
            if (error.name === 'AuthSessionMissingError') {
                // 尝试从本地存储恢复会话
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionData?.session && !sessionError) {
                    this.session = sessionData.session;
                    this.user = sessionData.session.user;
                    return this.user;
                }
            }
            return null;
        }
    }

    // 获取当前会话
    async getCurrentSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                throw error;
            }
            
            this.session = data.session;
            this.user = data.session?.user || null;
            
            return data.session;
        } catch (error) {
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
    isAuthenticated() {
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
}

export default SupabaseAuth;