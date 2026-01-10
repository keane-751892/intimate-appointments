// 本地存储工具类
class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      TOKEN: 'intimate_token',
      USER: 'intimate_user',
      APPOINTMENTS: 'intimate_appointments',
      BACKUP: 'intimate_backup_'
    };
  }

  // 设置Token
  setToken(token) {
    localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
  }

  // 获取Token
  getToken() {
    return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
  }

  // 移除Token
  removeToken() {
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
  }

  // 设置用户信息
  setUser(user) {
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // 获取用户信息
  getUser() {
    const userStr = localStorage.getItem(this.STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  // 移除用户信息
  removeUser() {
    localStorage.removeItem(this.STORAGE_KEYS.USER);
  }

  // 清除所有认证数据
  clearAuth() {
    this.removeToken();
    this.removeUser();
  }

  // 缓存预约列表
  setAppointments(appointments) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (error) {
      console.error('缓存预约失败:', error);
    }
  }

  // 获取缓存的预约列表
  getAppointments() {
    try {
      const appointmentsStr = localStorage.getItem(this.STORAGE_KEYS.APPOINTMENTS);
      return appointmentsStr ? JSON.parse(appointmentsStr) : [];
    } catch (error) {
      console.error('读取缓存预约失败:', error);
      return [];
    }
  }

  // 清除预约缓存
  clearAppointments() {
    localStorage.removeItem(this.STORAGE_KEYS.APPOINTMENTS);
  }

  // 创建数据备份
  async createBackup() {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        user: this.getUser(),
        appointments: this.getAppointments()
      };

      const backupKey = `${this.STORAGE_KEYS.BACKUP}${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));

      // 获取所有备份
      const backups = await this.getBackups();

      // 只保留最近10个备份
      if (backups.length > 10) {
        const oldBackups = backups.slice(10);
        oldBackups.forEach(oldBackup => {
          localStorage.removeItem(oldBackup.key);
        });
      }

      return {
        success: true,
        message: '备份创建成功'
      };
    } catch (error) {
      console.error('创建备份失败:', error);
      return {
        success: false,
        message: '备份创建失败'
      };
    }
  }

  // 获取所有备份
  async getBackups() {
    try {
      const backups = [];
      const keys = Object.keys(localStorage);

      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_KEYS.BACKUP)) {
          const backupStr = localStorage.getItem(key);
          if (backupStr) {
            const backup = JSON.parse(backupStr);
            backups.push({
              key: key,
              ...backup
            });
          }
        }
      });

      // 按时间倒序排列
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return backups;
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  // 恢复备份
  async restoreBackup(backupKey) {
    try {
      const backupStr = localStorage.getItem(backupKey);
      if (!backupStr) {
        return {
          success: false,
          message: '备份不存在'
        };
      }

      const backup = JSON.parse(backupStr);

      // 恢复数据
      if (backup.user) {
        this.setUser(backup.user);
      }
      if (backup.appointments) {
        this.setAppointments(backup.appointments);
      }

      return {
        success: true,
        message: '备份恢复成功',
        data: backup
      };
    } catch (error) {
      console.error('恢复备份失败:', error);
      return {
        success: false,
        message: '备份恢复失败'
      };
    }
  }

  // 删除备份
  deleteBackup(backupKey) {
    try {
      localStorage.removeItem(backupKey);
      return {
        success: true,
        message: '备份删除成功'
      };
    } catch (error) {
      console.error('删除备份失败:', error);
      return {
        success: false,
        message: '备份删除失败'
      };
    }
  }

  // 导出数据（用于手动备份）
  exportData() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        user: this.getUser(),
        appointments: this.getAppointments(),
        backups: []
      };

      // 获取所有备份数据
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_KEYS.BACKUP)) {
          const backupStr = localStorage.getItem(key);
          if (backupStr) {
            data.backups.push({
              key: key,
              data: JSON.parse(backupStr)
            });
          }
        }
      });

      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `intimate-appointments-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: '数据导出成功'
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      return {
        success: false,
        message: '数据导出失败'
      };
    }
  }

  // 导入数据（用于手动恢复）
  async importData(file) {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);

            // 验证数据格式
            if (!data.timestamp) {
              resolve({
                success: false,
                message: '无效的备份文件格式'
              });
              return;
            }

            // 恢复数据
            if (data.user) {
              this.setUser(data.user);
            }
            if (data.appointments) {
              this.setAppointments(data.appointments);
            }

            // 恢复备份数据
            if (data.backups && Array.isArray(data.backups)) {
              data.backups.forEach(backup => {
                if (backup.key && backup.data) {
                  localStorage.setItem(backup.key, JSON.stringify(backup.data));
                }
              });
            }

            resolve({
              success: true,
              message: '数据导入成功'
            });
          } catch (error) {
            resolve({
              success: false,
              message: '解析备份文件失败'
            });
          }
        };

        reader.onerror = () => {
          resolve({
            success: false,
            message: '读取文件失败'
          });
        };

        reader.readAsText(file);
      });
    } catch (error) {
      console.error('导入数据失败:', error);
      return {
        success: false,
        message: '数据导入失败'
      };
    }
  }

  // 清除所有数据（谨慎使用）
  clearAll() {
    localStorage.clear();
    sessionStorage.clear();
  }
}

// 创建全局实例
const storage = new StorageManager();
