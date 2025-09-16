// Supabase 数据存储服务
import supabase from './supabase.js';

class SupabaseStorage {
    constructor() {
        this.tableName = 'tasks';
        this.errorCallbacks = [];
    }

    // 添加错误回调
    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    // 通知错误
    notifyError(error, operation) {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(error, operation);
            } catch (e) {
                // 静默处理回调错误
            }
        });
    }

    // 创建任务
    async createTask(taskData) {
        try {
            // 添加用户ID
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                this.notifyError(authError.message, 'createTask');
                throw new Error(authError.message);
            }
            
            if (!user) {
                const error = '用户未登录，无法创建任务';
                this.notifyError(error, 'createTask');
                throw new Error(error);
            }
            
            taskData.user_id = user.id;
            
            // 转换字段名以匹配数据库结构
            const dbTaskData = {
                ...taskData,
                work_start_time: taskData.workStartTime,
                work_end_time: taskData.workEndTime,
                user_id: user.id
            };
            
            // 删除驼峰命名的字段
            delete dbTaskData.workStartTime;
            delete dbTaskData.workEndTime;
            
            // 过滤掉空的时间值，避免数据库错误
            if (!dbTaskData.work_start_time || dbTaskData.work_start_time.trim() === '') {
                delete dbTaskData.work_start_time;
            }
            
            if (!dbTaskData.work_end_time || dbTaskData.work_end_time.trim() === '') {
                delete dbTaskData.work_end_time;
            }
            
            if (!dbTaskData.time || dbTaskData.time.trim() === '') {
                delete dbTaskData.time;
            }

            // 先确保用户在users表中存在
            const userExists = await this.ensureUserExists(user);
            if (!userExists) {
                const error = '无法确保用户在数据库中存在';
                this.notifyError(error, 'createTask');
                throw new Error(error);
            }

            const { data, error } = await supabase
                .from(this.tableName)
                .insert(dbTaskData)
                .select()
                .single();

            if (error) {
                this.notifyError(error.message, 'createTask');
                throw new Error(error.message);
            }

            return { success: true, data };
        } catch (error) {
            this.notifyError(error.message, 'createTask');
            return { success: false, error: error.message };
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
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    // 获取所有任务
    async getAllTasks() {
        try {
            console.log('SupabaseStorage: 开始获取所有任务');
            // 只获取当前用户的任务
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            console.log('SupabaseStorage: 当前用户:', user);
            
            if (authError) {
                console.error('SupabaseStorage: 获取用户时出错:', authError);
                this.notifyError(authError.message, 'getAllTasks');
                throw new Error(authError.message);
            }
            
            if (!user) {
                console.log('SupabaseStorage: 用户未登录，返回空任务列表');
                return { success: true, data: [] };
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            let query = supabase
                .from(this.tableName)
                .select('*')
                .order('date', { ascending: true })
                .eq('user_id', user.id);

            console.log('SupabaseStorage: 执行查询，用户ID:', user.id);
            const { data, error } = await query;
            console.log('SupabaseStorage: 查询结果:', data, '错误:', error);

            if (error) {
                console.error('SupabaseStorage: 查询出错:', error);
                this.notifyError(error.message, 'getAllTasks');
                throw new Error(error.message);
            }

            // 转换数据库字段名回驼峰命名法
            const convertedData = data.map(task => ({
                ...task,
                workStartTime: task.work_start_time,
                workEndTime: task.work_end_time
            }));

            console.log('SupabaseStorage: 转换后的数据:', convertedData);
            return { success: true, data: convertedData };
        } catch (error) {
            console.error('SupabaseStorage: 获取所有任务时出错:', error);
            this.notifyError(error.message, 'getAllTasks');
            return { success: false, error: error.message };
        }
    }

    // 根据ID获取任务
    async getTaskById(id) {
        try {
            // 只获取当前用户的任务
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                this.notifyError(authError.message, 'getTaskById');
                throw new Error(authError.message);
            }
            
            if (!user) {
                const error = '用户未登录，无法获取任务';
                this.notifyError(error, 'getTaskById');
                throw new Error(error);
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            let query = supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();

            const { data, error } = await query;

            if (error) {
                this.notifyError(error.message, 'getTaskById');
                throw new Error(error.message);
            }

            // 转换数据库字段名回驼峰命名法
            const convertedData = {
                ...data,
                workStartTime: data.work_start_time,
                workEndTime: data.work_end_time
            };

            return { success: true, data: convertedData };
        } catch (error) {
            this.notifyError(error.message, 'getTaskById');
            return { success: false, error: error.message };
        }
    }

    // 更新任务
    async updateTask(id, updates) {
        try {
            // 只更新当前用户的任务
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                this.notifyError(authError.message, 'updateTask');
                throw new Error(authError.message);
            }
            
            if (!user) {
                const error = '用户未登录，无法更新任务';
                this.notifyError(error, 'updateTask');
                throw new Error(error);
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            // 转换字段名以匹配数据库结构
            const dbUpdates = {
                ...updates,
                work_start_time: updates.workStartTime,
                work_end_time: updates.workEndTime
            };
            
            // 删除驼峰命名的字段
            delete dbUpdates.workStartTime;
            delete dbUpdates.workEndTime;
            
            // 过滤掉空的时间值，避免数据库错误
            if ('work_start_time' in dbUpdates && (!dbUpdates.work_start_time || dbUpdates.work_start_time.trim() === '')) {
                delete dbUpdates.work_start_time;
            }
            
            if ('work_end_time' in dbUpdates && (!dbUpdates.work_end_time || dbUpdates.work_end_time.trim() === '')) {
                delete dbUpdates.work_end_time;
            }
            
            if ('time' in dbUpdates && (!dbUpdates.time || dbUpdates.time.trim() === '')) {
                delete dbUpdates.time;
            }
            
            let query = supabase
                .from(this.tableName)
                .update(dbUpdates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            const { data, error } = await query;

            if (error) {
                this.notifyError(error.message, 'updateTask');
                throw new Error(error.message);
            }

            // 转换数据库字段名回驼峰命名法
            const convertedData = {
                ...data,
                workStartTime: data.work_start_time,
                workEndTime: data.work_end_time
            };

            return { success: true, data: convertedData };
        } catch (error) {
            this.notifyError(error.message, 'updateTask');
            return { success: false, error: error.message };
        }
    }

    // 删除任务
    async deleteTask(id) {
        try {
            // 只删除当前用户的任务
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                this.notifyError(authError.message, 'deleteTask');
                throw new Error(authError.message);
            }
            
            if (!user) {
                const error = '用户未登录，无法删除任务';
                this.notifyError(error, 'deleteTask');
                throw new Error(error);
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            let query = supabase
                .from(this.tableName)
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            const { error } = await query;

            if (error) {
                this.notifyError(error.message, 'deleteTask');
                throw new Error(error.message);
            }

            return { success: true };
        } catch (error) {
            this.notifyError(error.message, 'deleteTask');
            return { success: false, error: error.message };
        }
    }

    // 根据日期获取任务
    async getTasksByDate(date) {
        try {
            // 只获取当前用户的任务
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                this.notifyError(authError.message, 'getTasksByDate');
                throw new Error(authError.message);
            }
            
            if (!user) {
                return { success: true, data: [] };
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            let query = supabase
                .from(this.tableName)
                .select('*')
                .eq('date', date)
                .eq('user_id', user.id)
                .order('time', { ascending: true });

            const { data, error } = await query;

            if (error) {
                this.notifyError(error.message, 'getTasksByDate');
                throw new Error(error.message);
            }

            // 转换数据库字段名回驼峰命名法
            const convertedData = data.map(task => ({
                ...task,
                workStartTime: task.work_start_time,
                workEndTime: task.work_end_time
            }));

            return { success: true, data: convertedData };
        } catch (error) {
            this.notifyError(error.message, 'getTasksByDate');
            return { success: false, error: error.message };
        }
    }

    // 根据分类获取任务
    async getTasksByCategory(category) {
        try {
            // 只获取当前用户的任务
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                this.notifyError(authError.message, 'getTasksByCategory');
                throw new Error(authError.message);
            }
            
            if (!user) {
                return { success: true, data: [] };
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            let query = supabase
                .from(this.tableName)
                .select('*')
                .eq('category', category)
                .eq('user_id', user.id)
                .order('date', { ascending: true });

            const { data, error } = await query;

            if (error) {
                this.notifyError(error.message, 'getTasksByCategory');
                throw new Error(error.message);
            }

            // 转换数据库字段名回驼峰命名法
            const convertedData = data.map(task => ({
                ...task,
                workStartTime: task.work_start_time,
                workEndTime: task.work_end_time
            }));

            return { success: true, data: convertedData };
        } catch (error) {
            this.notifyError(error.message, 'getTasksByCategory');
            return { success: false, error: error.message };
        }
    }

    // 切换任务状态
    async toggleTaskStatus(id, currentStatus) {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
        
        try {
            // 只更新当前用户的任务
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                this.notifyError(authError.message, 'toggleTaskStatus');
                throw new Error(authError.message);
            }
            
            if (!user) {
                const error = '用户未登录，无法切换任务状态';
                this.notifyError(error, 'toggleTaskStatus');
                throw new Error(error);
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            let query = supabase
                .from(this.tableName)
                .update({ status: newStatus })
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            const { data, error } = await query;

            if (error) {
                this.notifyError(error.message, 'toggleTaskStatus');
                throw new Error(error.message);
            }

            // 转换数据库字段名回驼峰命名法
            const convertedData = {
                ...data,
                workStartTime: data.work_start_time,
                workEndTime: data.work_end_time
            };

            return { success: true, data: convertedData };
        } catch (error) {
            this.notifyError(error.message, 'toggleTaskStatus');
            return { success: false, error: error.message };
        }
    }

    // 实时订阅任务变化 - 改进版本
    subscribeToTasks(callback) {
        // 检查用户是否已登录
        supabase.auth.getUser().then(async ({ data: { user }, error: authError }) => {
            if (authError) {
                this.notifyError(authError.message, 'realtimeSubscribe');
                return null;
            }
            
            if (!user) {
                this.notifyError('用户未登录，无法订阅实时更新', 'realtimeSubscribe');
                return null;
            }
            
            // 确保用户在users表中存在
            await this.ensureUserExists(user);
            
            // 先取消可能存在的旧订阅
            if (this.currentSubscription) {
                supabase.removeChannel(this.currentSubscription);
            }
            
            // 创建新的订阅通道名称，确保唯一性
            const channelName = `tasks-changes-${user.id}-${Date.now()}`;
            
            // 修复实时订阅参数，确保与服务器端匹配
            this.currentSubscription = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: '*',  // 监听所有事件 (INSERT, UPDATE, DELETE)
                        schema: 'public',
                        table: this.tableName,
                        // 添加过滤条件，只监听当前用户的数据
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        try {
                            if (callback && typeof callback === 'function') {
                                callback(payload);
                            }
                        } catch (error) {
                            this.notifyError(error.message, 'realtimeCallback');
                        }
                    }
                )
                .subscribe((status, error) => {
                    if (status === 'CHANNEL_ERROR') {
                        this.notifyError('实时订阅失败: ' + (error?.message || '未知错误'), 'realtimeSubscribe');
                    }
                });

            return this.currentSubscription;
        }).catch(error => {
            this.notifyError('检查用户状态失败: ' + error.message, 'realtimeSubscribe');
            return null;
        });
    }

    // 取消订阅 - 改进版本
    unsubscribe(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        } else if (this.currentSubscription) {
            supabase.removeChannel(this.currentSubscription);
            this.currentSubscription = null;
        }
    }
}

export default SupabaseStorage;