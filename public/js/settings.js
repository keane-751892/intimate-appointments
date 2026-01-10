// 设置管理器
class SettingsManager {
  constructor() {
    this.modal = null;
  }

  // 初始化设置功能
  init() {
    this.bindEvents();
  }

  // 绑定事件
  bindEvents() {
    // 打开设置模态框
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openSettings();
    });

    // 关闭设置模态框
    document.getElementById('close-settings-modal').addEventListener('click', () => {
      this.closeSettings();
    });

    document.getElementById('close-settings-btn').addEventListener('click', () => {
      this.closeSettings();
    });

    // 绑定伴侣按钮
    document.getElementById('bind-partner-btn').addEventListener('click', () => {
      this.closeSettings();
      document.getElementById('bind-partner-modal').style.display = 'block';
    });

    // 设置页面中的"立即绑定"按钮
    document.querySelectorAll('.btn-bind-partner-now').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeSettings();
        document.getElementById('bind-partner-modal').style.display = 'block';
      });
    });

    // 备份按钮
    document.getElementById('btn-backup').addEventListener('click', async () => {
      const result = await storage.createBackup();
      if (result.success) {
        notify.success('备份成功', '数据备份已创建');
      } else {
        notify.error('备份失败', result.message);
      }
    });

    // 导出按钮
    document.getElementById('btn-export').addEventListener('click', () => {
      const result = storage.exportData();
      if (result.success) {
        notify.success('导出成功', '数据已导出到文件');
      } else {
        notify.error('导出失败', result.message);
      }
    });

    // 导入按钮
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    // 文件选择
    document.getElementById('import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const result = await storage.importData(file);
        if (result.success) {
          notify.success('导入成功', '数据已导入');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          notify.error('导入失败', result.message);
        }
      }
    });
  }

  // 打开设置模态框
  async openSettings() {
    this.modal = document.getElementById('settings-modal');
    this.modal.style.display = 'block';

    // 加载用户信息
    await this.loadUserInfo();

    // 加载伴侣信息
    await this.loadPartnerInfo();

    // 加载同步时间
    this.loadSyncTime();
  }

  // 关闭设置模态框
  closeSettings() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  // 加载用户信息
  loadUserInfo() {
    const user = authManager.user;
    if (user) {
      document.getElementById('settings-username').textContent = user.username;
      document.getElementById('settings-email').textContent = user.email;
      document.getElementById('settings-created').textContent = new Date().toLocaleDateString('zh-CN');
    }
  }

  // 加载伴侣信息
  async loadPartnerInfo() {
    const partnerInfoContainer = document.getElementById('settings-partner-info');

    if (!authManager.user.hasPartner) {
      // 未绑定伴侣
      partnerInfoContainer.innerHTML = `
        <div class="settings-empty">
          <p>💔 尚未绑定伴侣</p>
          <button class="btn-secondary btn-bind-partner-now" style="margin-top: 12px;">
            💑 立即绑定
          </button>
        </div>
      `;

      // 绑定新按钮的事件
      partnerInfoContainer.querySelector('.btn-bind-partner-now').addEventListener('click', () => {
        this.closeSettings();
        document.getElementById('bind-partner-modal').style.display = 'block';
      });
    } else {
      // 已绑定，获取伴侣信息
      try {
        const result = await authManager.getPartner();
        if (result.success && result.partner) {
          const partner = result.partner;
          partnerInfoContainer.innerHTML = `
            <div class="settings-info-item">
              <label>伴侣用户名</label>
              <div class="settings-info-value">${this.escapeHtml(partner.username)}</div>
            </div>
            <div class="settings-info-item">
              <label>伴侣邮箱</label>
              <div class="settings-info-value">${this.escapeHtml(partner.email)}</div>
            </div>
            <div class="settings-info-item">
              <label>绑定状态</label>
              <div class="settings-info-value" style="color: var(--success-color);">💕 已绑定</div>
            </div>
          `;
        } else {
          throw new Error('获取伴侣信息失败');
        }
      } catch (error) {
        partnerInfoContainer.innerHTML = `
          <div class="settings-empty">
            <p>⚠️ 加载伴侣信息失败</p>
          </div>
        `;
      }
    }
  }

  // 加载同步时间
  loadSyncTime() {
    const lastSync = localStorage.getItem('intimate_last_sync');
    if (lastSync) {
      const syncTime = new Date(lastSync);
      const now = new Date();
      const diffMs = now - syncTime;
      const diffMins = Math.floor(diffMs / 60000);

      let timeText;
      if (diffMins < 1) {
        timeText = '刚刚';
      } else if (diffMins < 60) {
        timeText = `${diffMins}分钟前`;
      } else if (diffMins < 1440) {
        timeText = `${Math.floor(diffMins / 60)}小时前`;
      } else {
        timeText = syncTime.toLocaleDateString('zh-CN');
      }

      document.getElementById('settings-last-sync').textContent = timeText;
    }
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 创建全局实例
const settingsManager = new SettingsManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  settingsManager.init();
});
