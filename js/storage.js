// 数据存储模块
class Storage {
    constructor() {
        this.keys = {
            TASKS: 'life_manager_tasks',
            SETTINGS: 'life_manager_settings',
            USER_PREFS: 'life_manager_user_prefs'
        };
    }

    // 保存数据
    save(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    // 加载数据
    load(key) {
        try {
            const jsonData = localStorage.getItem(key);
            return jsonData ? JSON.parse(jsonData) : null;
        } catch (error) {
            console.error('加载数据失败:', error);
            return null;
        }
    }

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    // 清空所有数据
    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    // 导出数据
    exportData() {
        const data = {};
        Object.entries(this.keys).forEach(([name, key]) => {
            data[name] = this.load(key);
        });
        return data;
    }

    // 导入数据
    importData(data) {
        try {
            Object.entries(data).forEach(([name, value]) => {
                if (this.keys[name]) {
                    this.save(this.keys[name], value);
                }
            });
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    // 检查存储可用性
    isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    // 获取存储大小
    getStorageSize() {
        let total = 0;
        Object.values(this.keys).forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                total += data.length;
            }
        });
        return total;
    }
}

export default Storage;