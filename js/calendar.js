// 日历组件
class Calendar {
    constructor(container, options = {}) {
        this.container = container;
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.tasks = [];
        
        // 配置选项
        this.options = {
            weekdays: ['日', '一', '二', '三', '四', '五', '六'],
            months: ['一月', '二月', '三月', '四月', '五月', '六月', 
                    '七月', '八月', '九月', '十月', '十一月', '十二月'],
            ...options
        };

        // 事件回调
        this.onDateClick = null;
        this.onMonthChange = null;

        this.render();
    }

    // 渲染日历
    render() {
        this.container.innerHTML = this.generateCalendarHTML();
        this.bindEvents();
    }

    // 生成日历HTML
    generateCalendarHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        let html = '<div class="calendar-weekdays">';
        this.options.weekdays.forEach(day => {
            html += `<div class="calendar-weekday">${day}</div>`;
        });
        html += '</div>';

        html += '<div class="calendar-days">';
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = this.formatDate(currentDate);
            const dayClasses = this.getDayClasses(currentDate, year, month);
            const tasksForDay = this.getTasksForDate(dateStr);
            
            html += `<div class="calendar-day ${dayClasses}" data-date="${dateStr}">
                ${currentDate.getDate()}
                ${this.generateTaskIndicators(tasksForDay)}
            </div>`;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        html += '</div>';
        return html;
    }

    // 获取日期样式类
    getDayClasses(date, currentYear, currentMonth) {
        const classes = [];
        const today = new Date();
        
        // 是否是其他月份的日期
        if (date.getMonth() !== currentMonth) {
            classes.push('other-month');
        }
        
        // 是否是今天
        if (this.isSameDate(date, today)) {
            classes.push('today');
        }
        
        // 是否是选中日期
        if (this.isSameDate(date, this.selectedDate)) {
            classes.push('selected');
        }
        
        // 是否有任务
        const dateStr = this.formatDate(date);
        const tasksForDay = this.getTasksForDate(dateStr);
        if (tasksForDay.length > 0) {
            const completedTasks = tasksForDay.filter(task => task.status === 'completed');
            if (completedTasks.length === tasksForDay.length) {
                classes.push('has-completed-tasks');
            } else if (completedTasks.length > 0) {
                classes.push('has-mixed-tasks');
            } else {
                classes.push('has-tasks');
            }
        }
        
        return classes.join(' ');
    }

    // 生成任务指示器
    generateTaskIndicators(tasks) {
        if (tasks.length === 0) return '';
        
        const indicators = tasks.slice(0, 3).map(task => {
            const statusClass = task.status === 'completed' ? 'completed' : '';
            return `<div class="task-indicator ${task.category} ${statusClass}"></div>`;
        }).join('');
        
        return `<div class="task-indicators">${indicators}</div>`;
    }

    // 绑定事件
    bindEvents() {
        // 日期点击事件
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day')) {
                const dateStr = e.target.dataset.date;
                if (dateStr) {
                    this.selectDate(new Date(dateStr));
                }
            }
        });
    }

    // 选择日期
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.render();
        
        if (this.onDateClick) {
            this.onDateClick(this.formatDate(date));
        }
    }

    // 切换到下个月
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        
        if (this.onMonthChange) {
            this.onMonthChange(this.currentDate.getFullYear(), this.currentDate.getMonth());
        }
    }

    // 切换到上个月
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        
        if (this.onMonthChange) {
            this.onMonthChange(this.currentDate.getFullYear(), this.currentDate.getMonth());
        }
    }

    // 跳转到今天
    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();
    }

    // 跳转到指定月份
    goToMonth(year, month) {
        this.currentDate = new Date(year, month);
        this.render();
    }

    // 更新任务数据
    updateTasks(tasks) {
        this.tasks = tasks;
        this.render();
    }

    // 获取指定日期的任务
    getTasksForDate(dateStr) {
        return this.tasks.filter(task => task.date === dateStr);
    }

    // 格式化日期
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // 判断是否是同一天
    isSameDate(date1, date2) {
        return this.formatDate(date1) === this.formatDate(date2);
    }

    // 获取当前显示的月份信息
    getCurrentMonthInfo() {
        return {
            year: this.currentDate.getFullYear(),
            month: this.currentDate.getMonth(),
            monthName: this.options.months[this.currentDate.getMonth()],
            dateString: `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`
        };
    }

    // 获取选中日期信息
    getSelectedDateInfo() {
        return {
            date: new Date(this.selectedDate),
            dateString: this.formatDate(this.selectedDate),
            displayString: this.selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
    }

    // 设置日期点击回调
    setOnDateClick(callback) {
        this.onDateClick = callback;
    }

    // 设置月份变化回调
    setOnMonthChange(callback) {
        this.onMonthChange = callback;
    }
}

export default Calendar;