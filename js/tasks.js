// 工作任务主逻辑
// 版本: 1.0.39
import TaskManager from './taskManager.js';
import authGuard from './authGuard.js';
import SupabaseAuth from './supabaseAuth.js';

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

// 初始化任务管理器和认证服务（使用单例模式）
const taskManager = new TaskManager();
const supabaseAuth = taskManager.supabaseAuth; // 从taskManager获取单例实例

let realtimeSubscription = null;

// DOM 元素
const DOM = {
    currentMonth: null,
    prevMonthBtn: null,
    nextMonthBtn: null,
    calendarContainer: null,
    tasksList: null,
    taskForm: null,
    addTaskBtn: null,
    todayBtn: null,
    selectedDate: null
};

// 当前状态
const state = {
    currentMonth: new Date(),
    selectedDate: formatDateToLocal(new Date()),
    tasks: []
};

// 获取 DOM 元素
function getDOMElements() {
    DOM.currentMonth = document.getElementById('currentMonth');
    DOM.prevMonthBtn = document.getElementById('prevMonth');
    DOM.nextMonthBtn = document.getElementById('nextMonth');
    DOM.calendarContainer = document.getElementById('calendarContainer');
    DOM.tasksList = document.getElementById('tasksList');
    DOM.taskForm = document.getElementById('taskForm');
    DOM.addTaskBtn = document.getElementById('addTaskBtn');
    DOM.todayBtn = document.getElementById('todayBtn');
    DOM.selectedDate = document.getElementById('selectedDate');
}

// 绑定事件监听器
function bindEventListeners() {
    // 月份导航
    DOM.prevMonthBtn?.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    DOM.nextMonthBtn?.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        renderCalendar();
    });
    
    // 今日按钮
    DOM.todayBtn?.addEventListener('click', () => {
        state.currentMonth = new Date();
        state.selectedDate = formatDateToLocal(new Date());
        renderCalendar();
        loadAndDisplayTasks();
        updateTodayButton();
    });
    
    // 添加任务按钮
    DOM.addTaskBtn?.addEventListener('click', () => {
        openTaskModal();
    });
    
    // 任务表单提交
    DOM.taskForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveTask();
    });
    
    // 模态框关闭按钮
    document.getElementById('closeModal')?.addEventListener('click', closeTaskModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeTaskModal);
    
    // 点击模态框外部关闭
    document.getElementById('taskModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') {
            closeTaskModal();
        }
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
        }
    });
    
    // 工作类别选择事件
    document.getElementById('taskCategory')?.addEventListener('change', function() {
        const workTimeSection = document.getElementById('workTimeSection');
        const normalTimeGroup = document.getElementById('normalTimeGroup');
        if (this.value === 'work') {
            workTimeSection.style.display = 'block';
            normalTimeGroup.style.display = 'none';
        } else {
            workTimeSection.style.display = 'none';
            normalTimeGroup.style.display = 'block';
        }
    });
    
    // 登录按钮事件
    document.getElementById('loginBtn')?.addEventListener('click', handleLogout);
    
    // 功能菜单按钮事件
    document.getElementById('featuresBtn')?.addEventListener('click', openFeaturesModal);
    
    // 关闭功能菜单模态框
    document.getElementById('closeFeaturesModal')?.addEventListener('click', closeFeaturesModalFunc);
    
    // 点击功能菜单模态框外部关闭
    document.getElementById('featuresModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'featuresModal') {
            closeFeaturesModalFunc();
        }
    });
}

// 处理登出
async function handleLogout() {
    try {
        // 使用增强的认证服务登出
        await supabaseAuth.signOut();
        
        // 清除认证信息
        authGuard.clearAuth();
        
        // 清除登录状态标记
        sessionStorage.removeItem('isLoggedIn');
        
        // 显示登出消息
        showToast('正在登出...', 'info');
        
        // 延迟跳转以显示消息
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        console.error('登出时出错:', error);
        showToast('登出失败，请重试', 'error');
    }
}

// 初始化应用
async function init() {
    console.log('任务页面初始化开始');
    
    // 检查用户认证状态
    console.log('开始检查用户认证状态');
    const authStatus = await supabaseAuth.checkAuthStatus();
    console.log('认证状态检查结果:', authStatus);
    
    if (!authStatus.isAuthenticated) {
        console.log('用户未认证，重定向到登录页面');
        // 清除认证信息
        authGuard.clearAuth();
        // 重定向到登录页面
        window.location.href = '/';
        return;
    } else {
        console.log('用户已认证，设置登录状态标记');
        // 用户已认证，设置登录状态标记
        sessionStorage.setItem('isLoggedIn', 'true');
    }
    
    console.log('用户已认证:', authStatus.user);
    
    // 获取 DOM 元素
    getDOMElements();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 启用在线模式（在认证检查之后）
    console.log('启用在线模式');
    taskManager.setOnlineMode(true);
    
    // 订阅实时更新
    console.log('订阅实时更新');
    subscribeToRealtimeUpdates();
    
    // 初始化日历
    console.log('初始化日历');
    renderCalendar();
    
    // 加载并显示任务
    console.log('加载并显示任务');
    await loadAndDisplayTasks();
    
    // 更新今日按钮状态
    console.log('更新今日按钮状态');
    updateTodayButton();
    
    // 显示今日任务
    console.log('显示今日任务');
    displayTodayTasks();
    
    // 为导航链接添加登录检查
    console.log('为导航链接添加登录检查');
    addLoginCheckToNavLinks();
    
    // 绑定功能按钮事件
    console.log('绑定功能按钮事件');
    bindFeaturesButtonEvents();
    
    // 检查用户登录状态并更新功能按钮
    console.log('检查用户登录状态并更新功能按钮');
    checkUserStatusAndShowFeaturesButton();
    
    console.log('任务页面初始化完成');
}

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
                
                // 重定向到首页
                window.location.href = '/';
            }
        });
    });
}

// 订阅实时更新 - 改进版本
function subscribeToRealtimeUpdates() {
    if (!taskManager) {
        return;
    }
    
    // 确保在线模式
    taskManager.setOnlineMode(true);
    
    // 检查函数是否存在
    if (typeof taskManager.subscribeToRealtimeUpdates !== 'function') {
        return;
    }
    
    // 订阅新的更新
    realtimeSubscription = taskManager.subscribeToRealtimeUpdates((payload) => {
        console.log('收到实时更新:', payload);
        // 重新加载任务列表
        loadAndDisplayTasks();
        // 重新渲染日历
        renderCalendar();
    });
}

// 取消订阅 - 改进版本
function unsubscribeFromRealtimeUpdates() {
    if (taskManager && typeof taskManager.unsubscribeFromRealtimeUpdates === 'function') {
        taskManager.unsubscribeFromRealtimeUpdates();
    }
    realtimeSubscription = null;
}

// 渲染日历
function renderCalendar() {
    // 更新月份显示
    DOM.currentMonth.textContent = state.currentMonth.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long'
    });
    
    // 清空日历容器
    DOM.calendarContainer.innerHTML = `
        <div class="calendar-weekdays">
            <div class="calendar-weekday">日</div>
            <div class="calendar-weekday">一</div>
            <div class="calendar-weekday">二</div>
            <div class="calendar-weekday">三</div>
            <div class="calendar-weekday">四</div>
            <div class="calendar-weekday">五</div>
            <div class="calendar-weekday">六</div>
        </div>
        <div class="calendar-days" id="calendarGrid"></div>
    `;
    
    const calendarGrid = document.getElementById('calendarGrid');
    
    // 获取月份信息
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取需要显示的总天数（6周）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    // 渲染日期
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        // 使用本地日期格式而不是toISOString
        const dateStr = formatDateToLocal(currentDate);
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateStr === formatDateToLocal(new Date());
        
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''} ${dateStr === state.selectedDate ? 'selected' : ''}`;
        dayElement.dataset.date = dateStr; // 添加日期数据属性
        dayElement.innerHTML = `
            <div class="day-number">${currentDate.getDate()}</div>
        `;
        
        // 添加点击事件
        dayElement.addEventListener('click', () => {
            selectDate(dateStr);
        });
        
        calendarGrid.appendChild(dayElement);
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 更新任务显示
    updateTasksForSelectedDate();
    // 更新日历中的任务数量
    updateCalendarTaskCounts();
}

// 选择日期
function selectDate(dateStr) {
    state.selectedDate = dateStr;
    renderCalendar();
    updateTasksForSelectedDate();
    updateTodayButton();
}

// 更新今日按钮状态
function updateTodayButton() {
    const isTodaySelected = state.selectedDate === formatDateToLocal(new Date());
    if (DOM.todayBtn) {
        DOM.todayBtn.textContent = isTodaySelected ? '今日' : '跳转到今日';
        DOM.todayBtn.classList.toggle('active', isTodaySelected);
    }
}

// 加载并显示任务
async function loadAndDisplayTasks() {
    console.log('开始加载任务数据...');
    try {
        // 确保在线模式
        console.log('设置在线模式为true');
        taskManager.setOnlineMode(true);
        console.log('当前在线模式:', taskManager.isOnline);
        
        console.log('调用taskManager.loadTasks()');
        state.tasks = await taskManager.loadTasks();
        console.log('loadTasks返回结果:', state.tasks);
        console.log('任务数量:', state.tasks.length);
        updateTasksForSelectedDate();
        renderCalendar();
        // 更新今日任务显示
        displayTodayTasks();
        console.log('任务数据加载和显示完成');
    } catch (error) {
        console.error('加载任务数据时出错:', error);
        console.error('错误堆栈:', error.stack);
        showToast('加载任务数据失败: ' + error.message, 'error');
    }
}

// 显示今日任务
async function displayTodayTasks() {
    // 获取今日任务
    const todayStr = formatDateToLocal(new Date());
    let todayTasks;
    
    if (taskManager.isOnline) {
        todayTasks = await taskManager.getTasksByDate(todayStr);
    } else {
        todayTasks = taskManager.getTasksByDate(todayStr);
    }
    
    // 对任务进行排序：
    // 1. 工作任务按上班时间排序
    // 2. 生活任务按时间排序
    // 3. 工作任务排在生活任务前面
    todayTasks.sort((a, b) => {
        // 如果两个任务都是工作分类
        if (a.category === 'work' && b.category === 'work') {
            // 按上班时间排序
            if (a.workStartTime && b.workStartTime) {
                return a.workStartTime.localeCompare(b.workStartTime);
            }
            // 如果其中一个没有上班时间，则有时间的排在前面
            return a.workStartTime ? -1 : (b.workStartTime ? 1 : 0);
        }
        
        // 如果两个任务都是生活分类
        if (a.category === 'life' && b.category === 'life') {
            // 按时间排序
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            // 如果其中一个没有时间，则有时间的排在前面
            return a.time ? -1 : (b.time ? 1 : 0);
        }
        
        // 工作任务排在生活任务前面
        if (a.category === 'work' && b.category === 'life') {
            return -1;
        }
        if (a.category === 'life' && b.category === 'work') {
            return 1;
        }
        
        // 默认情况
        return 0;
    });
    
    // 如果有今日任务列表元素，则更新显示
    if (DOM.todayTasksList) {
        DOM.todayTasksList.innerHTML = '';
        
        if (todayTasks.length === 0) {
            DOM.todayTasksList.innerHTML = '<div class="tasks-empty"><p>今天还没有任务</p></div>';
        } else {
            todayTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                DOM.todayTasksList.appendChild(taskElement);
            });
        }
    }
}

// 更新选中日期的任务显示
async function updateTasksForSelectedDate() {
    console.log('更新选中日期的任务显示，选中日期:', state.selectedDate);
    if (!DOM.tasksList) {
        console.error('任务列表DOM元素不存在');
        return;
    }
    
    // 获取选中日期的任务
    let tasks;
    if (taskManager.isOnline) {
        tasks = await taskManager.getTasksByDate(state.selectedDate);
    } else {
        tasks = taskManager.getTasksByDate(state.selectedDate);
    }
    
    console.log('获取到的日期任务:', tasks);
    
    // 对任务进行排序：
    // 1. 工作任务按上班时间排序
    // 2. 生活任务按时间排序
    // 3. 工作任务排在生活任务前面
    tasks.sort((a, b) => {
        // 如果两个任务都是工作分类
        if (a.category === 'work' && b.category === 'work') {
            // 按上班时间排序
            if (a.workStartTime && b.workStartTime) {
                return a.workStartTime.localeCompare(b.workStartTime);
            }
            // 如果其中一个没有上班时间，则有时间的排在前面
            return a.workStartTime ? -1 : (b.workStartTime ? 1 : 0);
        }
        
        // 如果两个任务都是生活分类
        if (a.category === 'life' && b.category === 'life') {
            // 按时间排序
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            // 如果其中一个没有时间，则有时间的排在前面
            return a.time ? -1 : (b.time ? 1 : 0);
        }
        
        // 工作任务排在生活任务前面
        if (a.category === 'work' && b.category === 'life') {
            return -1;
        }
        if (a.category === 'life' && b.category === 'work') {
            return 1;
        }
        
        // 默认情况
        return 0;
    });
    
    // 更新任务列表显示
    DOM.tasksList.innerHTML = '';
    
    console.log('排序后的任务:', tasks);
    
    if (tasks.length === 0) {
        DOM.tasksList.innerHTML = '<div class="tasks-empty">该日期暂无任务</div>';
        console.log('该日期没有任务');
    } else {
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            DOM.tasksList.appendChild(taskElement);
        });
        console.log('已添加任务元素到列表');
    }
    
    // 更新选中日期显示
    if (DOM.selectedDate) {
        DOM.selectedDate.textContent = new Date(state.selectedDate).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// 创建任务元素
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.status}`;
    taskElement.dataset.id = task.id;
    
    // 格式化时间显示，只显示小时和分钟
    let timeDisplay = '';
    if (task.category === 'work' && task.workStartTime && task.workEndTime) {
        // 确保时间格式为 HH:MM，去除秒数
        const formatTime = (timeStr) => {
            if (!timeStr) return '';
            // 如果时间格式是 HH:MM:SS，则只取前5个字符 HH:MM
            if (timeStr.length > 5) {
                return timeStr.substring(0, 5);
            }
            return timeStr;
        };
        
        timeDisplay = `<span class="work-time">${formatTime(task.workStartTime)} - ${formatTime(task.workEndTime)}</span>`;
    } else if (task.time) {
        // 确保时间格式为 HH:MM，去除秒数
        const formatTime = (timeStr) => {
            if (!timeStr) return '';
            // 如果时间格式是 HH:MM:SS，则只取前5个字符 HH:MM
            if (timeStr.length > 5) {
                return timeStr.substring(0, 5);
            }
            return timeStr;
        };
        
        timeDisplay = `<span class="task-time">${formatTime(task.time)}</span>`;
    }
    
    taskElement.innerHTML = `
        <div class="task-header">
            <h4 class="task-title">${task.title}</h4>
            <div class="task-actions">
                <button class="task-action-btn complete-btn" title="完成任务">✓</button>
                <button class="task-action-btn edit-btn" title="编辑任务">✏️</button>
                <button class="task-action-btn delete-btn" title="删除任务">🗑️</button>
            </div>
        </div>
        <div class="task-meta">
            <span class="task-category ${task.category}">${task.category === 'life' ? '生活' : '工作'}</span>
            ${timeDisplay}
        </div>
    `;
    
    // 绑定事件
    taskElement.querySelector('.complete-btn').addEventListener('click', () => {
        toggleTaskStatus(task.id);
    });
    
    taskElement.querySelector('.edit-btn').addEventListener('click', () => {
        editTask(task.id);
    });
    
    taskElement.querySelector('.delete-btn').addEventListener('click', () => {
        deleteTask(task.id);
    });
    
    return taskElement;
}

// 切换任务状态
async function toggleTaskStatus(taskId) {
    const success = await taskManager.toggleTaskStatus(taskId);
    if (success) {
        showToast('任务状态已更新', 'success');
        await loadAndDisplayTasks();
    } else {
        showToast('更新任务状态失败', 'error');
    }
}

// 编辑任务
function editTask(taskId) {
    const task = taskManager.getTask(taskId);
    if (!task) return;
    
    // 填充表单
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDate').value = task.date;
    document.getElementById('taskCategory').value = task.category;
    
    // 处理时间字段
    if (task.category === 'work') {
        document.getElementById('workStartTime').value = task.workStartTime || '';
        document.getElementById('workEndTime').value = task.workEndTime || '';
        document.getElementById('workTimeSection').style.display = 'block';
        document.getElementById('normalTimeGroup').style.display = 'none';
    } else {
        document.getElementById('taskTime').value = task.time || '';
        document.getElementById('workTimeSection').style.display = 'none';
        document.getElementById('normalTimeGroup').style.display = 'block';
    }
    
    // 更新模态框标题
    document.getElementById('modalTitle').textContent = '编辑任务';
    
    // 显示模态框
    document.getElementById('taskModal').classList.add('active');
}

// 删除任务
async function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        const success = await taskManager.deleteTask(taskId);
        if (success) {
            showToast('任务已删除', 'success');
            await loadAndDisplayTasks();
        } else {
            showToast('删除任务失败', 'error');
        }
    }
}

// 保存任务
async function saveTask() {
    const taskId = document.getElementById('taskId').value;
    const taskData = {
        title: document.getElementById('taskTitle').value,
        date: document.getElementById('taskDate').value,
        category: document.getElementById('taskCategory').value
    };
    
    // 根据分类处理时间数据
    if (taskData.category === 'work') {
        taskData.workStartTime = document.getElementById('workStartTime').value;
        taskData.workEndTime = document.getElementById('workEndTime').value;
        // 清空普通时间字段
        taskData.time = '';
    } else {
        taskData.time = document.getElementById('taskTime').value;
        // 清空工作时间字段
        taskData.workStartTime = '';
        taskData.workEndTime = '';
    }
    
    // 验证数据
    if (!taskData.title || !taskData.date) {
        showToast('请填写任务标题和日期', 'error');
        return;
    }
    
    let success;
    if (taskId) {
        // 更新任务
        success = await taskManager.updateTask(taskId, taskData);
    } else {
        // 创建新任务
        success = await taskManager.createTask(taskData);
    }
    
    if (success) {
        showToast(taskId ? '任务已更新' : '任务已创建', 'success');
        // 关闭模态框
        document.getElementById('taskModal').classList.remove('active');
        // 重置表单
        resetTaskForm();
        // 更新模态框标题
        document.getElementById('modalTitle').textContent = '添加任务';
        // 重新加载任务
        await loadAndDisplayTasks();
    } else {
        showToast(taskId ? '更新任务失败' : '创建任务失败', 'error');
    }
}

// 打开任务模态框
function openTaskModal() {
    // 清空表单
    resetTaskForm();
    // 设置默认日期为选中日期
    document.getElementById('taskDate').value = state.selectedDate;
    // 设置默认分类为生活
    document.getElementById('taskCategory').value = 'life';
    // 触发分类变化事件以正确显示时间设置
    document.getElementById('taskCategory').dispatchEvent(new Event('change'));
    // 更新模态框标题
    document.getElementById('modalTitle').textContent = '添加任务';
    
    document.getElementById('taskModal').classList.add('active');
}

// 关闭任务模态框
function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

// 重置任务表单
function resetTaskForm() {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDate').value = '';
    document.getElementById('taskCategory').value = 'life';
    document.getElementById('taskTime').value = '';
    document.getElementById('workStartTime').value = '';
    document.getElementById('workEndTime').value = '';
    // 默认显示生活分类的时间设置
    document.getElementById('workTimeSection').style.display = 'none';
    document.getElementById('normalTimeGroup').style.display = 'block';
}

// 更新日历中每天的任务数量
function updateCalendarTaskCounts() {
    // 获取当前显示月份的所有任务
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    // 创建日期到任务数量的映射
    const taskCounts = {};
    state.tasks.forEach(task => {
        // 使用本地日期格式而不是toISOString
        const taskDate = parseLocalDate(task.date);
        if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
            taskCounts[task.date] = (taskCounts[task.date] || 0) + 1;
        }
    });
    
    // 更新日历显示
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        // 遍历所有日期元素
        const dayElements = calendarGrid.querySelectorAll('.calendar-day');
        dayElements.forEach(element => {
            const dateStr = element.dataset.date;
            if (dateStr && taskCounts[dateStr]) {
                // 查找或创建任务数量显示元素
                let taskCountElement = element.querySelector('.task-count');
                if (!taskCountElement) {
                    taskCountElement = document.createElement('div');
                    taskCountElement.className = 'task-count';
                    element.appendChild(taskCountElement);
                }
                taskCountElement.textContent = taskCounts[dateStr];
            } else {
                // 如果没有任务，移除任务数量显示元素
                const taskCountElement = element.querySelector('.task-count');
                if (taskCountElement) {
                    taskCountElement.remove();
                }
            }
        });
    }
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    unsubscribeFromRealtimeUpdates();
});

// 绑定功能按钮事件
function bindFeaturesButtonEvents() {
    // 功能按钮点击事件
    const featuresBtn = document.getElementById('featuresBtn');
    if (featuresBtn) {
        featuresBtn.addEventListener('click', function() {
            openFeaturesModal();
        });
    }
    
    // 关闭功能菜单模态框
    const closeFeaturesModal = document.getElementById('closeFeaturesModal');
    if (closeFeaturesModal) {
        closeFeaturesModal.addEventListener('click', function() {
            closeFeaturesModalFunc();
        });
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

// 检查用户登录状态并更新功能按钮和菜单项
function checkUserStatusAndShowFeaturesButton() {
    try {
        // 从sessionStorage获取登录状态
        const loginStatus = sessionStorage.getItem('isLoggedIn');
        const featuresBtn = document.getElementById('featuresBtn');
        
        // 获取所有功能菜单项
        const menuItems = document.querySelectorAll('.feature-menu-item');
        
        if (loginStatus === 'true') {
            // 用户已登录，显示功能按钮并更新菜单项样式
            if (featuresBtn) {
                featuresBtn.style.display = 'block';
            }
            
            // 为所有菜单项添加登录样式类
            menuItems.forEach(item => {
                item.classList.add('logged-in');
                item.classList.remove('not-logged-in');
            });
        } else {
            // 用户未登录，仍然显示功能按钮但更新菜单项样式
            if (featuresBtn) {
                featuresBtn.style.display = 'block';
            }
            
            // 为所有菜单项添加未登录样式类
            menuItems.forEach(item => {
                item.classList.add('not-logged-in');
                item.classList.remove('logged-in');
            });
        }
    } catch (error) {
        console.error('检查用户状态时出错:', error);
    }
}