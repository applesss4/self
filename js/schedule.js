// 工作排班表主逻辑
import TaskManager from './taskManager.js';
import SupabaseAuth from './supabaseAuth.js';

// 初始化任务管理器
const taskManager = new TaskManager();
let supabaseAuth = null;
let realtimeSubscription = null;

// DOM 元素
const DOM = {
    currentWeek: null,
    prevWeekBtn: null,
    nextWeekBtn: null,
    scheduleContainer: null,
    tasksList: null,
    scheduleForm: null,
    addTaskBtn: null,
    todayBtn: null
};

// 当前状态
const state = {
    currentDate: new Date(),
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
    
    // 初始化排班表
    renderSchedule();
    
    // 加载并显示任务
    await loadAndDisplayTasks();
    
    // 更新今日按钮状态
    updateTodayButton();
}

// 获取 DOM 元素
function getDOMElements() {
    DOM.currentWeek = document.querySelector('.current-month');
    DOM.prevWeekBtn = document.getElementById('prevWeek');
    DOM.nextWeekBtn = document.getElementById('nextWeek');
    DOM.scheduleContainer = document.getElementById('scheduleContainer');
    DOM.tasksList = document.getElementById('tasksList');
    DOM.scheduleForm = document.getElementById('scheduleForm');
    DOM.addTaskBtn = document.querySelector('.add-task-btn');
    DOM.todayBtn = document.getElementById('todayBtn');
}

// 绑定事件监听器
function bindEventListeners() {
    // 周导航
    DOM.prevWeekBtn?.addEventListener('click', () => {
        // 移动到上周
        state.currentDate.setDate(state.currentDate.getDate() - 7);
        renderSchedule();
    });
    
    DOM.nextWeekBtn?.addEventListener('click', () => {
        // 移动到下周
        state.currentDate.setDate(state.currentDate.getDate() + 7);
        renderSchedule();
    });
    
    // 今日按钮
    DOM.todayBtn?.addEventListener('click', goToToday);
    
    // 添加排班按钮
    DOM.addTaskBtn?.addEventListener('click', () => {
        // 清空表单
        resetScheduleForm();
        // 设置默认日期为选中日期
        document.getElementById('scheduleDate').value = state.selectedDate;
        // 更新模态框标题
        document.getElementById('modalTitle').textContent = '添加排班';
        
        document.getElementById('scheduleModal').classList.add('active');
    });
    
    // 排班表单提交
    DOM.scheduleForm?.addEventListener('submit', handleScheduleSubmit);
    
    // 模态框关闭按钮
    document.getElementById('closeModal')?.addEventListener('click', () => {
        document.getElementById('scheduleModal').classList.remove('active');
    });
    
    // 取消按钮
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        document.getElementById('scheduleModal').classList.remove('active');
    });
    
    // 点击模态框外部关闭
    document.getElementById('scheduleModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'scheduleModal') {
            document.getElementById('scheduleModal').classList.remove('active');
        }
    });
    
    // ESC 键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('scheduleModal').classList.remove('active');
            document.getElementById('authModal')?.classList.remove('active');
        }
    });
}

// 重置排班表单
function resetScheduleForm() {
    document.getElementById('scheduleId').value = '';
    document.getElementById('scheduleTitle').value = '';
    document.getElementById('scheduleDate').value = '';
    document.getElementById('workStartTime').value = '';
    document.getElementById('workEndTime').value = '';
}

// 订阅实时更新
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
        // 重新渲染排班表
        renderSchedule();
    });
}

// 取消订阅
function unsubscribeFromRealtimeUpdates() {
    if (taskManager && typeof taskManager.unsubscribeFromRealtimeUpdates === 'function') {
        taskManager.unsubscribeFromRealtimeUpdates();
    }
    realtimeSubscription = null;
}

// 渲染排班表
function renderSchedule() {
    // 更新周显示
    const weekInfo = getWeekInfo(state.currentDate);
    DOM.currentWeek.textContent = weekInfo.display;
    
    // 清空排班容器
    DOM.scheduleContainer.innerHTML = `
        <div class="schedule-weekdays">
            <div class="schedule-weekday">日</div>
            <div class="schedule-weekday">一</div>
            <div class="schedule-weekday">二</div>
            <div class="schedule-weekday">三</div>
            <div class="schedule-weekday">四</div>
            <div class="schedule-weekday">五</div>
            <div class="schedule-weekday">六</div>
        </div>
        <div class="schedule-days" id="scheduleGrid"></div>
    `;
    
    const scheduleGrid = document.getElementById('scheduleGrid');
    
    // 获取当前周的开始日期和结束日期
    const weekDates = getWeekDates(state.currentDate);
    
    // 渲染日期
    weekDates.forEach((dateObj, index) => {
        const dateStr = dateObj.dateStr;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        const isSelected = dateStr === state.selectedDate;
        
        const dayElement = document.createElement('div');
        dayElement.className = `schedule-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;
        dayElement.dataset.date = dateStr;
        
        // 日期标题
        const dayHeader = document.createElement('div');
        dayHeader.className = 'schedule-day-header';
        dayHeader.innerHTML = `
            <div class="day-name">${dateObj.dayName}</div>
            <div class="day-date">${dateObj.date.getDate()}</div>
        `;
        
        // 排班内容容器
        const dayContent = document.createElement('div');
        dayContent.className = 'schedule-day-content';
        dayContent.id = `schedule-${dateStr}`;
        
        dayElement.appendChild(dayHeader);
        dayElement.appendChild(dayContent);
        
        // 添加点击事件
        dayElement.addEventListener('click', () => {
            selectDate(dateStr);
        });
        
        scheduleGrid.appendChild(dayElement);
    });
    
    // 更新排班显示
    updateScheduleForSelectedDate();
    // 更新排班表显示
    updateScheduleDisplay();
}

// 获取周信息
function getWeekInfo(date) {
    const startDate = getWeekStartDate(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    
    // 计算这是该月的第几周
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const firstWeekStart = new Date(firstDayOfMonth);
    firstWeekStart.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);
    
    const weekNumber = Math.ceil(((startDate - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)) + 1);
    
    // 显示格式：几月第几周
    const display = `${month}月第${weekNumber}周`;
    
    return {
        startDate,
        endDate,
        display
    };
}

// 获取周开始日期
function getWeekStartDate(date) {
    const startDate = new Date(date);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - day);
    return startDate;
}

// 获取一周的日期
function getWeekDates(date) {
    const weekStartDate = getWeekStartDate(date);
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(weekStartDate.getDate() + i);
        
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        
        dates.push({
            date: currentDate,
            dateStr: currentDate.toISOString().split('T')[0],
            dayName: dayNames[i]
        });
    }
    
    return dates;
}

// 选择日期
function selectDate(dateStr) {
    state.selectedDate = dateStr;
    renderSchedule();
    updateScheduleForSelectedDate();
    updateTodayButton();
}

// 跳转到今天
function goToToday() {
    state.currentDate = new Date();
    state.selectedDate = new Date().toISOString().split('T')[0];
    renderSchedule();
    updateScheduleForSelectedDate();
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
    updateScheduleForSelectedDate();
    renderSchedule();
}

// 更新选中日期的排班显示
async function updateScheduleForSelectedDate() {
    if (!DOM.tasksList) return;
    
    // 获取选中日期的任务（只显示工作分类的任务）
    let tasks;
    if (taskManager.isOnline) {
        tasks = await taskManager.getTasksByDate(state.selectedDate);
    } else {
        tasks = taskManager.getTasksByDate(state.selectedDate);
    }
    
    // 过滤出工作分类的任务
    const workTasks = tasks.filter(task => task.category === 'work');
    
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
    if (workTasks.length === 0) {
        DOM.tasksList.innerHTML = `
            <div class="tasks-empty">
                <p>这一天还没有排班</p>
                <p>点击右上角的"+"按钮添加排班</p>
            </div>
        `;
    } else {
        workTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            DOM.tasksList.appendChild(taskElement);
        });
    }
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
    }
    
    taskElement.innerHTML = `
        <div class="task-header">
            <h4 class="task-title">${task.title}</h4>
            <div class="task-actions">
                <button class="task-action-btn complete-btn" title="完成排班">✓</button>
                <button class="task-action-btn edit-btn" title="编辑排班">✏️</button>
                <button class="task-action-btn delete-btn" title="删除排班">🗑️</button>
            </div>
        </div>
        <div class="task-meta">
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
        showToast('排班状态已更新', 'success');
        await loadAndDisplayTasks();
    } else {
        showToast('更新排班状态失败', 'error');
    }
}

// 编辑任务
function editTask(taskId) {
    const task = taskManager.getTask(taskId);
    if (!task) return;
    
    // 填充表单
    document.getElementById('scheduleId').value = task.id;
    document.getElementById('scheduleTitle').value = task.title;
    document.getElementById('scheduleDate').value = task.date;
    document.getElementById('workStartTime').value = task.workStartTime || '';
    document.getElementById('workEndTime').value = task.workEndTime || '';
    
    // 更新模态框标题
    document.getElementById('modalTitle').textContent = '编辑排班';
    
    // 显示模态框
    document.getElementById('scheduleModal').classList.add('active');
}

// 删除任务
async function deleteTask(taskId) {
    if (confirm('确定要删除这个排班吗？')) {
        const success = await taskManager.deleteTask(taskId);
        if (success) {
            showToast('排班已删除', 'success');
            await loadAndDisplayTasks();
        } else {
            showToast('删除排班失败', 'error');
        }
    }
}

// 处理排班提交
async function handleScheduleSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const scheduleId = document.getElementById('scheduleId').value;
    const scheduleData = {
        title: document.getElementById('scheduleTitle').value,
        date: document.getElementById('scheduleDate').value,
        category: 'work', // 强制设置为工作分类
        workStartTime: document.getElementById('workStartTime').value,
        workEndTime: document.getElementById('workEndTime').value
    };
    
    // 验证数据
    if (!scheduleData.title || !scheduleData.date || !scheduleData.workStartTime || !scheduleData.workEndTime) {
        showToast('请填写排班标题、日期、上班时间和下班时间', 'error');
        return;
    }
    
    let success;
    if (scheduleId) {
        // 更新排班
        success = await taskManager.updateTask(scheduleId, scheduleData);
    } else {
        // 创建新排班
        success = await taskManager.createTask(scheduleData);
    }
    
    if (success) {
        showToast(scheduleId ? '排班已更新' : '排班已创建', 'success');
        // 关闭模态框
        document.getElementById('scheduleModal').classList.remove('active');
        // 重置表单
        resetScheduleForm();
        // 更新模态框标题
        document.getElementById('modalTitle').textContent = '添加排班';
        // 重新加载任务
        await loadAndDisplayTasks();
    } else {
        showToast(scheduleId ? '更新排班失败' : '创建排班失败', 'error');
    }
}

// 更新排班表显示
function updateScheduleDisplay() {
    // 获取当前周的日期
    const weekDates = getWeekDates(state.currentDate);
    
    // 为每个日期更新排班信息
    weekDates.forEach(dateObj => {
        const dateStr = dateObj.dateStr;
        const scheduleElement = document.getElementById(`schedule-${dateStr}`);
        
        if (scheduleElement) {
            // 获取该日期的工作任务
            const dayTasks = state.tasks.filter(task => 
                task.date === dateStr && task.category === 'work'
            );
            
            // 清空内容
            scheduleElement.innerHTML = '';
            
            // 添加排班信息
            if (dayTasks.length > 0) {
                dayTasks.forEach(task => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.dataset.id = task.id;
                    
                    scheduleItem.innerHTML = `
                        <div class="schedule-item-title">${task.title}</div>
                        <div class="schedule-item-time">${task.workStartTime} - ${task.workEndTime}</div>
                    `;
                    
                    // 添加点击事件以编辑排班
                    scheduleItem.addEventListener('click', () => {
                        editTask(task.id);
                    });
                    
                    scheduleElement.appendChild(scheduleItem);
                });
            } else {
                // 如果没有排班，显示提示信息
                scheduleElement.innerHTML = '<div class="schedule-empty">无排班</div>';
            }
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