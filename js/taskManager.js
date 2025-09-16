// 任务管理模块
import Storage from './storage.js';
import SupabaseStorage from './supabaseStorage.js';

class TaskManager {
    constructor() {
        this.storage = new Storage();
        this.supabaseStorage = new SupabaseStorage();
        this.tasks = this.loadTasks();
        this.currentTaskId = null;
        console.log('TaskManager: 初始化开始');
        // 检查用户是否已认证来决定默认模式
        this.isOnline = this.checkDefaultOnlineMode();
        console.log('TaskManager: 初始化完成，isOnline =', this.isOnline);
        this.errorCallbacks = [];
        this.realtimeSubscription = null;
        
        // 注册错误处理
        this.supabaseStorage.onError((error, operation) => {
            this.notifyError(error, operation);
        });
    }

    // 添加错误回调
    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    // 检查默认在线模式
    checkDefaultOnlineMode() {
        try {
            // 检查本地存储中是否有认证令牌
            const sessionToken = localStorage.getItem('supabase.auth.token');
            if (sessionToken) {
                // 如果有认证令牌，默认使用在线模式
                console.log('TaskManager: 检测到认证令牌，使用在线模式');
                return true;
            }
            
            // 默认使用离线模式
            console.log('TaskManager: 未检测到认证令牌，使用离线模式');
            return false;
        } catch (error) {
            console.error('检查默认在线模式时出错:', error);
            // 出错时默认使用离线模式
            console.log('TaskManager: 检查在线模式出错，使用离线模式');
            return false;
        }
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

    // 设置在线模式
    setOnlineMode(isOnline) {
        console.log('TaskManager: 设置在线模式为', isOnline);
        this.isOnline = isOnline;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 加载所有任务
    async loadTasks() {
        console.log('TaskManager: 开始加载任务，当前在线模式:', this.isOnline);
        if (this.isOnline) {
            try {
                console.log('TaskManager: 尝试从Supabase加载任务');
                const result = await this.supabaseStorage.getAllTasks();
                console.log('TaskManager: Supabase返回结果:', result);
                if (result.success) {
                    this.tasks = result.data;
                    console.log('TaskManager: 成功加载任务数量:', this.tasks.length);
                    return result.data;
                } else {
                    console.log('TaskManager: Supabase加载失败，回退到本地存储');
                    // 回退到本地存储
                    const tasks = this.storage.load(this.storage.keys.TASKS);
                    this.tasks = tasks || [];
                    console.log('TaskManager: 本地存储任务数量:', this.tasks.length);
                    return this.tasks;
                }
            } catch (error) {
                console.error('TaskManager: Supabase加载异常:', error);
                // 回退到本地存储
                const tasks = this.storage.load(this.storage.keys.TASKS);
                this.tasks = tasks || [];
                console.log('TaskManager: 异常回退后本地存储任务数量:', this.tasks.length);
                return this.tasks;
            }
        } else {
            console.log('TaskManager: 使用离线模式加载任务');
            const tasks = this.storage.load(this.storage.keys.TASKS);
            this.tasks = tasks || [];
            console.log('TaskManager: 离线模式任务数量:', this.tasks.length);
            return this.tasks;
        }
    }

    // 保存任务到存储
    async saveTasks() {
        if (this.isOnline) {
            // 在在线模式下，所有操作都直接通过 Supabase 进行
            return true;
        } else {
            return this.storage.save(this.storage.keys.TASKS, this.tasks);
        }
    }

    // 创建任务
    async createTask(taskData) {
        if (this.isOnline) {
            try {
                const result = await this.supabaseStorage.createTask(taskData);
                if (result.success) {
                    // 重新加载任务列表以保持同步
                    await this.loadTasks();
                    return result.data.id;
                } else {
                    this.notifyError(result.error, 'createTask');
                    return null;
                }
            } catch (error) {
                this.notifyError(error.message, 'createTask');
                return null;
            }
        } else {
            const task = {
                id: this.generateId(),
                title: taskData.title,
                date: taskData.date,
                time: taskData.time || '',
                category: taskData.category || 'life',
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 如果是工作类别，添加工作时间
            if (taskData.category === 'work') {
                task.workStartTime = taskData.workStartTime || '';
                task.workEndTime = taskData.workEndTime || '';
            }

            this.tasks.push(task);
            this.saveTasks();
            return task.id;
        }
    }

    // 更新任务
    async updateTask(id, updates) {
        if (this.isOnline) {
            try {
                const result = await this.supabaseStorage.updateTask(id, updates);
                if (result.success) {
                    // 重新加载任务列表以保持同步
                    await this.loadTasks();
                    return true;
                } else {
                    this.notifyError(result.error, 'updateTask');
                    return false;
                }
            } catch (error) {
                this.notifyError(error.message, 'updateTask');
                return false;
            }
        } else {
            const taskIndex = this.tasks.findIndex(task => task.id === id);
            if (taskIndex === -1) {
                this.notifyError('任务不存在', 'updateTask');
                return false;
            }

            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            this.saveTasks();
            return true;
        }
    }

    // 删除任务
    async deleteTask(id) {
        if (this.isOnline) {
            try {
                const result = await this.supabaseStorage.deleteTask(id);
                if (result.success) {
                    // 重新加载任务列表以保持同步
                    await this.loadTasks();
                    return true;
                } else {
                    this.notifyError(result.error, 'deleteTask');
                    return false;
                }
            } catch (error) {
                this.notifyError(error.message, 'deleteTask');
                return false;
            }
        } else {
            const taskIndex = this.tasks.findIndex(task => task.id === id);
            if (taskIndex === -1) {
                this.notifyError('任务不存在', 'deleteTask');
                return false;
            }

            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            return true;
        }
    }

    // 获取单个任务
    getTask(id) {
        return this.tasks.find(task => task.id === id) || null;
    }

    // 获取所有任务
    getAllTasks() {
        return [...this.tasks];
    }

    // 按日期获取任务
    async getTasksByDate(date) {
        if (this.isOnline) {
            try {
                const result = await this.supabaseStorage.getTasksByDate(date);
                if (result.success) {
                    return result.data;
                } else {
                    this.notifyError(result.error, 'getTasksByDate');
                    return [];
                }
            } catch (error) {
                this.notifyError(error.message, 'getTasksByDate');
                return [];
            }
        } else {
            // 确保本地日期比较使用相同的格式
            return this.tasks.filter(task => task.date === date);
        }
    }

    // 按日期范围获取任务
    getTasksByDateRange(startDate, endDate) {
        return this.tasks.filter(task => {
            return task.date >= startDate && task.date <= endDate;
        });
    }

    // 按分类获取任务
    async getTasksByCategory(category) {
        if (this.isOnline) {
            try {
                const result = await this.supabaseStorage.getTasksByCategory(category);
                if (result.success) {
                    return result.data;
                } else {
                    this.notifyError(result.error, 'getTasksByCategory');
                    return [];
                }
            } catch (error) {
                this.notifyError(error.message, 'getTasksByCategory');
                return [];
            }
        } else {
            return this.tasks.filter(task => task.category === category);
        }
    }

    // 按状态获取任务
    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    }

    // 切换任务状态
    async toggleTaskStatus(id) {
        if (this.isOnline) {
            const task = this.getTask(id);
            if (!task) {
                this.notifyError('任务不存在', 'toggleTaskStatus');
                return false;
            }
            
            try {
                const result = await this.supabaseStorage.toggleTaskStatus(id, task.status);
                if (result.success) {
                    // 重新加载任务列表以保持同步
                    await this.loadTasks();
                    return true;
                } else {
                    this.notifyError(result.error, 'toggleTaskStatus');
                    return false;
                }
            } catch (error) {
                this.notifyError(error.message, 'toggleTaskStatus');
                return false;
            }
        } else {
            const task = this.getTask(id);
            if (!task) {
                this.notifyError('任务不存在', 'toggleTaskStatus');
                return false;
            }

            const newStatus = task.status === 'pending' ? 'completed' : 'pending';
            return this.updateTask(id, { status: newStatus });
        }
    }

    // 获取任务统计
    getTaskStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.status === 'completed').length;
        const pending = total - completed;
        
        const byCategory = {};
        this.tasks.forEach(task => {
            byCategory[task.category] = (byCategory[task.category] || 0) + 1;
        });

        return {
            total,
            completed,
            pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            byCategory
        };
    }

    // 获取今日任务
    getTodayTasks() {
        // 使用本地日期而不是toISOString
        const today = new Date();
        const todayStr = formatDateToLocal(today);
        return this.tasks.filter(task => task.date === todayStr);
    }

    // 获取本周任务
    async getWeekTasks() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
        
        const startDate = startOfWeek.toISOString().split('T')[0];
        const endDate = endOfWeek.toISOString().split('T')[0];
        
        if (this.isOnline) {
            // 对于在线模式，我们获取整个星期的任务
            try {
                const result = await this.supabaseStorage.getAllTasks();
                if (result.success) {
                    return result.data.filter(task => 
                        task.date >= startDate && task.date <= endDate
                    );
                } else {
                    this.notifyError(result.error, 'getWeekTasks');
                    return [];
                }
            } catch (error) {
                this.notifyError(error.message, 'getWeekTasks');
                return [];
            }
        } else {
            return this.getTasksByDateRange(startDate, endDate);
        }
    }

    // 搜索任务
    searchTasks(query) {
        const lowerQuery = query.toLowerCase();
        return this.tasks.filter(task => 
            task.title.toLowerCase().includes(lowerQuery) ||
            (task.description && task.description.toLowerCase().includes(lowerQuery))
        );
    }

    // 验证任务数据
    validateTaskData(taskData) {
        const errors = [];

        if (!taskData.title || taskData.title.trim().length === 0) {
            errors.push('任务标题不能为空');
        }

        if (!taskData.date) {
            errors.push('任务日期不能为空');
        }

        if (taskData.category && !['life', 'work'].includes(taskData.category)) {
            errors.push('任务分类无效');
        }

        // 工作类别的时间验证
        if (taskData.category === 'work') {
            if (taskData.workStartTime && taskData.workEndTime) {
                if (taskData.workStartTime >= taskData.workEndTime) {
                    errors.push('上班时间必须早于下班时间');
                }
            }
        }

        return errors;
    }

    // 清空所有任务
    async clearAllTasks() {
        if (this.isOnline) {
            // 在在线模式下，我们不提供清空所有任务的功能以防止误操作
            this.notifyError('在线模式下不支持清空所有任务', 'clearAllTasks');
            return false;
        } else {
            this.tasks = [];
            this.saveTasks();
            return true;
        }
    }

    // 订阅实时更新 - 改进版本
    subscribeToRealtimeUpdates(callback) {
        if (!this.isOnline) {
            return null;
        }

        // 订阅新的更新
        this.realtimeSubscription = this.supabaseStorage.subscribeToTasks((payload) => {
            try {
                if (callback && typeof callback === 'function') {
                    callback(payload);
                }
                // 重新加载任务列表
                this.loadTasks();
            } catch (error) {
                this.notifyError(error.message, 'realtimeUpdate');
            }
        });

        return this.realtimeSubscription;
    }

    // 取消订阅实时更新 - 改进版本
    unsubscribeFromRealtimeUpdates() {
        if (this.supabaseStorage) {
            this.supabaseStorage.unsubscribe(this.realtimeSubscription);
        }
        this.realtimeSubscription = null;
    }
}

export default TaskManager;

// 辅助函数：将Date对象格式化为本地日期字符串 (YYYY-MM-DD)
function formatDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 辅助函数：将本地日期字符串解析为Date对象
function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}
