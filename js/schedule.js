// 工作排班表主逻辑
import TaskManager from './taskManager.js';

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
    selectedDate: formatDateToLocal(new Date()),
    tasks: []
};

// 获取 DOM 元素
function getDOMElements() {
    DOM.currentWeek = document.getElementById('currentWeek');
    DOM.prevWeekBtn = document.getElementById('prevWeek');
    DOM.nextWeekBtn = document.getElementById('nextWeek');
    DOM.scheduleContainer = document.getElementById('scheduleContainer');
    DOM.tasksList = document.getElementById('tasksList');
    DOM.scheduleForm = document.getElementById('scheduleForm');
    DOM.addTaskBtn = document.getElementById('addTaskBtn');
    DOM.todayBtn = document.getElementById('todayBtn');
}

// 绑定事件监听器
function bindEventListeners() {
    // 周导航
    DOM.prevWeekBtn?.addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() - 7);
        renderSchedule();
    });
    
    DOM.nextWeekBtn?.addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() + 7);
        renderSchedule();
    });
    
    // 本周按钮
    DOM.todayBtn?.addEventListener('click', () => {
        state.currentDate = new Date();
        state.selectedDate = formatDateToLocal(new Date());
        renderSchedule();
        loadAndDisplayTasks();
    });
    
    // 添加排班按钮
    DOM.addTaskBtn?.addEventListener('click', () => {
        openScheduleModal();
    });
    
    // 排班表单提交
    DOM.scheduleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSchedule();
    });
    
    // 模态框关闭按钮
    document.getElementById('closeModal')?.addEventListener('click', closeScheduleModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeScheduleModal);
    
    // 点击模态框外部关闭
    document.getElementById('scheduleModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'scheduleModal') {
            closeScheduleModal();
        }
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeScheduleModal();
        }
    });
    
    // 导出图片按钮
    document.getElementById('exportBtn')?.addEventListener('click', exportScheduleAsImage);
}

// 初始化应用
async function init() {
    // 获取 DOM 元素
    getDOMElements();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 检查是否从首页登录
    const loginStatus = sessionStorage.getItem('isLoggedIn');
    if (loginStatus !== 'true') {
        // 用户未在首页登录，重定向到首页
        window.location.href = '/';
        return;
    }
    
    // 初始化 Supabase 认证
    supabaseAuth = new SupabaseAuth();
    
    // 启用在线模式
    taskManager.setOnlineMode(true);
    // 订阅实时更新
    subscribeToRealtimeUpdates();
    
    // 初始化排班表
    renderSchedule();
    
    // 加载任务
    state.tasks = await taskManager.loadTasks();
}

// 保存排班
async function saveSchedule() {
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
        closeScheduleModal();
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

// 打开排班模态框
function openScheduleModal() {
    // 清空表单
    resetScheduleForm();
    // 设置默认日期为选中日期
    document.getElementById('scheduleDate').value = state.selectedDate;
    // 更新模态框标题
    document.getElementById('modalTitle').textContent = '添加排班';
    
    document.getElementById('scheduleModal').classList.add('active');
}

// 关闭排班模态框
function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('active');
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
        const dateStr = formatDateToLocal(dateObj.date);
        const isToday = dateStr === formatDateToLocal(new Date());
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
    
    // 计算这是该月的第几周（正确的方法）
    // 找到该月的第一天
    const firstDayOfMonth = new Date(year, month - 1, 1);
    
    // 找到该月第一个星期日（一周的开始）
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const firstWeekStart = new Date(firstDayOfMonth);
    firstWeekStart.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);
    
    // 计算当前周的开始日期与该月第一周开始日期之间的周数差异
    const weekNumber = Math.floor((startDate - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
    
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
            dateStr: formatDateToLocal(currentDate),
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
}

// 加载并显示任务
async function loadAndDisplayTasks() {
    try {
        state.tasks = await taskManager.loadTasks();
        updateScheduleForSelectedDate();
        // 更新排班表显示
        updateScheduleDisplay();
    } catch (error) {
        console.error('加载任务失败:', error);
        showToast('加载任务失败，请重试', 'error');
    }
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
    
    // 按照上班时间早到晚排序
    workTasks.sort((a, b) => {
        // 如果上班时间相同，则按下班时间排序
        if (a.workStartTime === b.workStartTime) {
            return a.workEndTime.localeCompare(b.workEndTime);
        }
        // 按上班时间排序
        return a.workStartTime.localeCompare(b.workStartTime);
    });
    
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
            
            // 按照上班时间早到晚排序
            dayTasks.sort((a, b) => {
                // 如果上班时间相同，则按下班时间排序
                if (a.workStartTime === b.workStartTime) {
                    return a.workEndTime.localeCompare(b.workEndTime);
                }
                // 按上班时间排序
                return a.workStartTime.localeCompare(b.workStartTime);
            });
            
            // 清空内容
            scheduleElement.innerHTML = '';
            
            // 添加排班信息
            if (dayTasks.length > 0) {
                dayTasks.forEach(task => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.dataset.id = task.id;
                    
                    // 确保时间格式为 HH:MM，去除秒数
                    const formatTime = (timeStr) => {
                        if (!timeStr) return '';
                        // 如果时间格式是 HH:MM:SS，则只取前5个字符 HH:MM
                        if (timeStr.length > 5) {
                            return timeStr.substring(0, 5);
                        }
                        return timeStr;
                    };
                    
                    scheduleItem.innerHTML = `
                        <div class="schedule-item-title">${task.title}</div>
                        <div class="schedule-item-time">${formatTime(task.workStartTime)} - ${formatTime(task.workEndTime)}</div>
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

// 导出排班表为图片
function exportScheduleAsImage() {
    // 确保DOM已完全渲染
    setTimeout(() => {
        // 获取要导出的元素
        const scheduleContainer = document.querySelector('.schedule-container');
        
        if (!scheduleContainer) {
            showToast('无法找到排班表容器', 'error');
            return;
        }
        
        // 禁用导出按钮防止重复点击
        if (DOM.exportBtn) {
            DOM.exportBtn.disabled = true;
            DOM.exportBtn.textContent = '正在导出...';
        }
        
        try {
            // 使用 html2canvas 库将元素转换为图片
            // 创建script标签动态加载html2canvas
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
            script.onload = function() {
                // 配置选项 - 为移动端优化
                const options = {
                    backgroundColor: '#FFFFFB', // 与页面背景色一致
                    scale: 2, // 提高图片质量
                    useCORS: true,
                    logging: false,
                    scrollY: -window.scrollY, // 修复滚动位置问题
                    width: scheduleContainer.scrollWidth, // 确保完整宽度
                    height: scheduleContainer.scrollHeight, // 确保完整高度
                    onclone: function(clonedDoc) {
                        // 克隆文档时的处理
                        const clonedContainer = clonedDoc.querySelector('.schedule-container');
                        if (clonedContainer) {
                            // 确保在移动端也能正确显示
                            clonedContainer.style.overflow = 'visible';
                        }
                    }
                };
                
                // 转换为canvas
                html2canvas(scheduleContainer, options).then(canvas => {
                    // 将canvas转换为图片数据
                    const imageData = canvas.toDataURL('image/png');
                    
                    // 检测是否为移动设备
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    // 检测是否为iOS设备（特殊处理）
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    
                    if (isMobile) {
                        // 移动端处理 - 创建新窗口显示图片
                        const newWindow = window.open();
                        if (!newWindow) {
                            // 如果弹窗被阻止，提供替代方案
                            showToast('弹窗被浏览器阻止，请允许弹窗或手动保存图片', 'error');
                            
                            // 恢复导出按钮
                            if (DOM.exportBtn) {
                                DOM.exportBtn.disabled = false;
                                DOM.exportBtn.textContent = '📥 导出图片';
                            }
                            
                            return;
                        }
                        
                        newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>工作排班表导出</title>
                                <style>
                                    body {
                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                        text-align: center;
                                        padding: 20px;
                                        background: #f5f5dc;
                                        margin: 0;
                                    }
                                    .container {
                                        max-width: 100%;
                                        margin: 0 auto;
                                        background: white;
                                        padding: 20px;
                                        border-radius: 12px;
                                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                    }
                                    .image-container {
                                        margin: 20px 0;
                                        overflow-x: auto;
                                    }
                                    img {
                                        max-width: 100%;
                                        height: auto;
                                        border: 1px solid #e6dcc7;
                                        border-radius: 8px;
                                    }
                                    .download-btn {
                                        background: #f0e68c;
                                        border: 1px solid #e6dcc7;
                                        border-radius: 8px;
                                        padding: 12px 24px;
                                        font-size: 16px;
                                        cursor: pointer;
                                        text-decoration: none;
                                        display: inline-block;
                                        margin: 10px 5px;
                                        min-width: 120px;
                                    }
                                    .download-btn:hover {
                                        background: #fffacd;
                                        transform: translateY(-2px);
                                    }
                                    .instructions {
                                        color: #8b7355;
                                        margin: 20px 0;
                                        line-height: 1.6;
                                    }
                                    .mobile-instructions {
                                        background: #fffacd;
                                        padding: 15px;
                                        border-radius: 8px;
                                        margin: 20px 0;
                                        border: 1px solid #e6dcc7;
                                    }
                                    @media (max-width: 768px) {
                                        body {
                                            padding: 10px;
                                        }
                                        .container {
                                            padding: 15px;
                                        }
                                        .download-btn {
                                            padding: 10px 16px;
                                            font-size: 14px;
                                            width: 100%;
                                            margin: 5px 0;
                                        }
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <h2>工作排班表导出成功</h2>
                                    <div class="mobile-instructions">
                                        <p><strong>移动端保存说明：</strong></p>
                                        <p>1. 点击下方"直接下载图片"按钮</p>
                                        <p>2. 如果无法直接下载，请长按图片选择"保存图片"</p>
                                        <p>3. 或点击图片后选择分享到相册</p>
                                    </div>
                                    <div class="image-container">
                                        <img src="${imageData}" alt="工作排班表" id="scheduleImage" />
                                    </div>
                                    <div>
                                        <button class="download-btn" id="downloadBtn">
                                            📥 直接下载图片
                                        </button>
                                        <button class="download-btn" onclick="window.close()">关闭窗口</button>
                                    </div>
                                </div>
                                <script>
                                    document.getElementById('downloadBtn').addEventListener('click', function() {
                                        const link = document.createElement('a');
                                        link.href = '${imageData}';
                                        link.download = '工作排班表_${new Date().toISOString().slice(0, 10)}.png';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    });
                                <\/script>
                            </body>
                            </html>
                        `);
                        newWindow.document.close();
                        
                        // 恢复导出按钮
                        if (DOM.exportBtn) {
                            DOM.exportBtn.disabled = false;
                            DOM.exportBtn.textContent = '📥 导出图片';
                        }
                        
                        showToast('排班表已成功导出，请在新窗口中查看和下载', 'success');
                    } else {
                        // 桌面端处理 - 尝试直接下载
                        try {
                            // 创建下载链接
                            const link = document.createElement('a');
                            link.download = `工作排班表_${new Date().toISOString().slice(0, 10)}.png`;
                            link.href = imageData;
                            link.target = '_blank'; // 在新标签页中打开
                            
                            // 触发下载
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // 恢复导出按钮
                            if (DOM.exportBtn) {
                                DOM.exportBtn.disabled = false;
                                DOM.exportBtn.textContent = '📥 导出图片';
                            }
                            
                            showToast('排班表已成功导出为图片', 'success');
                        } catch (downloadError) {
                            // 如果直接下载失败，回退到新窗口显示
                            const newWindow = window.open();
                            if (!newWindow) {
                                showToast('弹窗被浏览器阻止，请允许弹窗', 'error');
                                
                                // 恢复导出按钮
                                if (DOM.exportBtn) {
                                    DOM.exportBtn.disabled = false;
                                    DOM.exportBtn.textContent = '📥 导出图片';
                                }
                                
                                return;
                            }
                            
                            newWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>工作排班表导出</title>
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            text-align: center;
                                            padding: 20px;
                                            background: #f5f5dc;
                                        }
                                        .container {
                                            max-width: 800px;
                                            margin: 0 auto;
                                            background: white;
                                            padding: 20px;
                                            border-radius: 12px;
                                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                        }
                                        .image-container {
                                            margin: 20px 0;
                                        }
                                        img {
                                            max-width: 100%;
                                            height: auto;
                                            border: 1px solid #e6dcc7;
                                            border-radius: 8px;
                                        }
                                        .download-btn {
                                            background: #f0e68c;
                                            border: 1px solid #e6dcc7;
                                            border-radius: 8px;
                                            padding: 12px 24px;
                                            font-size: 16px;
                                            cursor: pointer;
                                            text-decoration: none;
                                            display: inline-block;
                                            margin: 10px 5px;
                                        }
                                        .download-btn:hover {
                                            background: #fffacd;
                                            transform: translateY(-2px);
                                        }
                                        .instructions {
                                            color: #8b7355;
                                            margin: 20px 0;
                                            line-height: 1.6;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h2>工作排班表导出成功</h2>
                                        <div class="instructions">
                                            <p>图片已生成，请右键点击图片选择"另存为"保存到您的设备，</p>
                                            <p>或点击下方按钮直接下载。</p>
                                        </div>
                                        <div class="image-container">
                                            <img src="${imageData}" alt="工作排班表" id="scheduleImage" />
                                        </div>
                                        <div>
                                            <button class="download-btn" id="downloadBtn">
                                                📥 直接下载图片
                                            </button>
                                            <button class="download-btn" onclick="window.close()">关闭窗口</button>
                                        </div>
                                    </div>
                                    <script>
                                        document.getElementById('downloadBtn').addEventListener('click', function() {
                                            const link = document.createElement('a');
                                            link.href = '${imageData}';
                                            link.download = '工作排班表_${new Date().toISOString().slice(0, 10)}.png';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        });
                                    <\/script>
                                </body>
                                </html>
                            `);
                            newWindow.document.close();
                            
                            // 恢复导出按钮
                            if (DOM.exportBtn) {
                                DOM.exportBtn.disabled = false;
                                DOM.exportBtn.textContent = '📥 导出图片';
                            }
                            
                            showToast('排班表已成功导出，请在新窗口中查看和下载', 'success');
                        }
                    }
                }).catch(error => {
                    console.error('导出失败:', error);
                    showToast('导出失败，请重试', 'error');
                    
                    // 恢复导出按钮
                    if (DOM.exportBtn) {
                        DOM.exportBtn.disabled = false;
                        DOM.exportBtn.textContent = '📥 导出图片';
                    }
                });
            };
            
            script.onerror = function() {
                showToast('加载导出组件失败，请重试', 'error');
                
                // 恢复导出按钮
                if (DOM.exportBtn) {
                    DOM.exportBtn.disabled = false;
                    DOM.exportBtn.textContent = '📥 导出图片';
                }
            };
            
            document.head.appendChild(script);
        } catch (error) {
            console.error('导出失败:', error);
            showToast('导出失败，请重试', 'error');
            
            // 恢复导出按钮
            if (DOM.exportBtn) {
                DOM.exportBtn.disabled = false;
                DOM.exportBtn.textContent = '📥 导出图片';
            }
        }
    }, 100);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    unsubscribeFromRealtimeUpdates();
});