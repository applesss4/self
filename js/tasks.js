// 任务页面主逻辑
import TaskManager from './taskManager.js';
import SupabaseAuth from './supabaseAuth.js';

// 初始化任务管理器
const taskManager = new TaskManager();
let supabaseAuth = null;
let realtimeSubscription = null;

// DOM 元素
const DOM = {
    currentDate: null,
    currentMonth: null,
    prevMonthBtn: null,
    nextMonthBtn: null,
    calendarContainer: null,
    tasksList: null,
    taskForm: null,
    addTaskBtn: null,
    categorySelect: null,
    workTimeSection: null,
    normalTimeGroup: null,
    todayBtn: null
};

// 当前状态
const state = {
    currentMonth: new Date(),
    selectedDate: new Date().toISOString().split('T')[0],
    tasks: []
};

// 初始化应用
async function init() {
    // 获取 DOM 元素
    getDOMElements();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化 Supabase 认证
    supabaseAuth = new SupabaseAuth();
    
    // 检查用户登录状态
    const user = await supabaseAuth.getCurrentUser();
    if (user) {
        // 启用在线模式
        taskManager.setOnlineMode(true);
        // 订阅实时更新
        subscribeToRealtimeUpdates();
    }
    
    // 监听认证状态变化
    supabaseAuth.onAuthStateChange((event, session) => {
        if (session?.user) {
            // 用户已登录，启用在线模式
            taskManager.setOnlineMode(true);
            // 订阅实时更新
            subscribeToRealtimeUpdates();
            // 重新加载任务
            loadAndDisplayTasks();
        } else {
            // 用户已登出，禁用在线模式
            taskManager.setOnlineMode(false);
            // 取消订阅
            unsubscribeFromRealtimeUpdates();
            // 重新加载任务
            loadAndDisplayTasks();
        }
    });
    
    // 初始化日历
    renderCalendar();
    
    // 加载并显示任务
    await loadAndDisplayTasks();
    
    // 更新今日按钮状态
    updateTodayButton();
}

// 获取 DOM 元素
function getDOMElements() {
    DOM.currentDate = document.querySelector('.current-date');
    DOM.currentMonth = document.querySelector('.current-month');
    DOM.prevMonthBtn = document.querySelector('.prev-month');
    DOM.nextMonthBtn = document.querySelector('.next-month');
    DOM.calendarContainer = document.querySelector('.calendar-container');
    DOM.tasksList = document.querySelector('.tasks-list');
    DOM.taskForm = document.getElementById('taskForm');
    DOM.addTaskBtn = document.querySelector('.add-task-btn');
    DOM.categorySelect = document.getElementById('taskCategory');
    DOM.workTimeSection = document.getElementById('workTimeSection');
    DOM.normalTimeGroup = document.getElementById('normalTimeGroup');
    DOM.todayBtn = document.querySelector('.btn-today');
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
    DOM.todayBtn?.addEventListener('click', goToToday);
    
    // 添加任务按钮
    DOM.addTaskBtn?.addEventListener('click', () => {
        // 清空表单
        resetTaskForm();
        // 设置默认日期为选中日期
        document.getElementById('taskDate').value = state.selectedDate;
        // 设置默认分类为生活
        document.getElementById('taskCategory').value = 'life';
        // 触发分类变化事件以正确显示时间设置
        handleCategoryChange();
        // 更新模态框标题
        document.getElementById('modalTitle').textContent = '添加任务';
        
        document.getElementById('taskModal').classList.add('active');
    });
    
    // 任务表单提交
    DOM.taskForm?.addEventListener('submit', handleTaskSubmit);
    
    // 分类选择变化
    DOM.categorySelect?.addEventListener('change', handleCategoryChange);
    
    // 模态框关闭按钮
    document.getElementById('closeModal')?.addEventListener('click', () => {
        document.getElementById('taskModal').classList.remove('active');
    });
    
    // 取消按钮
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        document.getElementById('taskModal').classList.remove('active');
    });
    
    // 点击模态框外部关闭
    document.getElementById('taskModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') {
            document.getElementById('taskModal').classList.remove('active');
        }
    });
    
    // ESC 键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('taskModal').classList.remove('active');
            document.getElementById('authModal')?.classList.remove('active');
        }
    });
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

// 订阅实时更新 - 改进版本
function subscribeToRealtimeUpdates() {
    if (!taskManager) {
        return;
    }
    
    if (!taskManager.isOnline) {
        return;
    }
    
    // 检查函数是否存在
    if (typeof taskManager.subscribeToRealtimeUpdates !== 'function') {
        return;
    }
    
    // 订阅新的更新
    realtimeSubscription = taskManager.subscribeToRealtimeUpdates((payload) => {
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
        const dateStr = currentDate.toISOString().split('T')[0];
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''} ${dateStr === state.selectedDate ? 'selected' : ''}`;
        dayElement.innerHTML = `
            <div class="day-number">${currentDate.getDate()}</div>
            <div class="day-tasks" id="tasks-${dateStr}"></div>
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
}

// 选择日期
function selectDate(dateStr) {
    state.selectedDate = dateStr;
    renderCalendar();
    updateTasksForSelectedDate();
    updateTodayButton();
}

// 跳转到今天
function goToToday() {
    const today = new Date();
    state.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    state.selectedDate = today.toISOString().split('T')[0];
    renderCalendar();
    updateTasksForSelectedDate();
    updateTodayButton();
}

// 更新今日按钮状态
function updateTodayButton() {
    const isTodaySelected = state.selectedDate === new Date().toISOString().split('T')[0];
    if (DOM.todayBtn) {
        DOM.todayBtn.textContent = isTodaySelected ? '今日' : '跳转到今日';
        DOM.todayBtn.classList.toggle('active', isTodaySelected);
    }
}

// 加载并显示任务
async function loadAndDisplayTasks() {
    state.tasks = await taskManager.loadTasks();
    updateTasksForSelectedDate();
    renderCalendar();
}

// 更新选中日期的任务显示
async function updateTasksForSelectedDate() {
    if (!DOM.tasksList) return;
    
    // 获取选中日期的任务
    let tasks;
    if (taskManager.isOnline) {
        tasks = await taskManager.getTasksByDate(state.selectedDate);
    } else {
        tasks = taskManager.getTasksByDate(state.selectedDate);
    }
    
    // 清空任务列表
    DOM.tasksList.innerHTML = '';
    
    // 更新页面标题中的日期
    const selectedDateObj = new Date(state.selectedDate);
    const dateStr = selectedDateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    document.querySelector('.tasks-date').textContent = dateStr;
    
    // 显示任务或空状态
    if (tasks.length === 0) {
        DOM.tasksList.innerHTML = `
            <div class="tasks-empty">
                <p>这一天还没有任务</p>
                <p>点击右上角的"+"按钮添加任务</p>
            </div>
        `;
    } else {
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            DOM.tasksList.appendChild(taskElement);
        });
    }
    
    // 更新日历中每天的任务数量
    updateCalendarTaskCounts();
}

// 创建任务元素
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.status}`;
    taskElement.dataset.id = task.id;
    
    // 格式化时间显示
    let timeDisplay = '';
    if (task.category === 'work' && task.workStartTime && task.workEndTime) {
        timeDisplay = `<span class="work-time">${task.workStartTime} - ${task.workEndTime}</span>`;
    } else if (task.time) {
        timeDisplay = `<span class="task-time">${task.time}</span>`;
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

// 处理任务提交
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
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

// 处理分类变化
function handleCategoryChange() {
    const category = document.getElementById('taskCategory').value;
    const workTimeSection = document.getElementById('workTimeSection');
    const normalTimeGroup = document.getElementById('normalTimeGroup');
    
    if (category === 'work') {
        workTimeSection.style.display = 'block';
        normalTimeGroup.style.display = 'none';
        // 清空普通时间字段
        document.getElementById('taskTime').value = '';
    } else {
        workTimeSection.style.display = 'none';
        normalTimeGroup.style.display = 'block';
        // 清空工作时间字段
        document.getElementById('workStartTime').value = '';
        document.getElementById('workEndTime').value = '';
    }
}

// 更新日历中每天的任务数量
function updateCalendarTaskCounts() {
    // 获取当前显示月份的所有任务
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    // 创建日期到任务数量的映射
    const taskCounts = {};
    state.tasks.forEach(task => {
        const taskDate = new Date(task.date);
        if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
            taskCounts[task.date] = (taskCounts[task.date] || 0) + 1;
        }
    });
    
    // 更新日历显示
    Object.keys(taskCounts).forEach(date => {
        const taskCountElement = document.getElementById(`tasks-${date}`);
        if (taskCountElement) {
            taskCountElement.innerHTML = `<span class="task-count">${taskCounts[date]}</span>`;
        }
    });
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