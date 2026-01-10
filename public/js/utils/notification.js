// 通知管理器
class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = 5;
  }

  // 初始化
  init() {
    this.container = document.getElementById('notifications-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'notifications-container';
      this.container.id = 'notifications-container';
      document.body.appendChild(this.container);
    }
  }

  // 显示通知
  show(options) {
    const {
      title = '通知',
      message = '',
      type = 'info',
      duration = 5000,
      icon = this.getIcon(type),
      persistent = false
    } = options;

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-title">${this.escapeHtml(title)}</div>
        <div class="notification-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="notification-close">&times;</button>
    `;

    // 添加关闭按钮事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.hide(notification);
    });

    // 添加到容器
    this.container.appendChild(notification);

    // 限制通知数量
    this.limitNotifications();

    // 自动隐藏
    if (!persistent && duration > 0) {
      setTimeout(() => {
        this.hide(notification);
      }, duration);
    }

    // 触发进入动画
    requestAnimationFrame(() => {
      notification.style.animation = 'slideInRight 0.3s ease';
    });

    return notification;
  }

  // 隐藏通知
  hide(notification) {
    if (!notification || !notification.parentNode) return;

    notification.classList.add('removing');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  // 限制通知数量
  limitNotifications() {
    const notifications = this.container.querySelectorAll('.notification');
    if (notifications.length > this.maxNotifications) {
      const oldest = notifications[0];
      this.hide(oldest);
    }
  }

  // 获取图标
  getIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      appointment: '📅',
      love: '💕',
      notification: '🔔'
    };
    return icons[type] || icons.info;
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 便捷方法：成功通知
  success(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'success',
      icon: '✅',
      ...options
    });
  }

  // 便捷方法：错误通知
  error(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'error',
      icon: '❌',
      duration: 7000,
      ...options
    });
  }

  // 便捷方法：警告通知
  warning(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'warning',
      icon: '⚠️',
      duration: 6000,
      ...options
    });
  }

  // 便捷方法：信息通知
  info(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'info',
      icon: 'ℹ️',
      ...options
    });
  }

  // 便捷方法：预约通知
  appointment(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'appointment',
      icon: '📅',
      persistent: true,
      ...options
    });
  }

  // 便捷方法：亲密通知
  love(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'love',
      icon: '💕',
      duration: 6000,
      ...options
    });
  }

  // 清除所有通知
  clearAll() {
    const notifications = this.container.querySelectorAll('.notification');
    notifications.forEach(notification => {
      this.hide(notification);
    });
  }

  // 请求浏览器通知权限
  async requestBrowserPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // 显示浏览器通知
  showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 自动关闭
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
    return null;
  }

  // 组合通知（应用内 + 浏览器）
  showAll(title, message, options = {}) {
    // 应用内通知
    this.show({
      title,
      message,
      ...options
    });

    // 浏览器通知
    if (options.browser !== false) {
      this.showBrowserNotification(title, {
        body: message,
        ...options
      });
    }
  }
}

// 创建全局实例
const notificationManager = new NotificationManager();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    notificationManager.init();
  });
} else {
  notificationManager.init();
}

// 导出便捷方法
const notify = {
  success: (title, message, options) => notificationManager.success(title, message, options),
  error: (title, message, options) => notificationManager.error(title, message, options),
  warning: (title, message, options) => notificationManager.warning(title, message, options),
  info: (title, message, options) => notificationManager.info(title, message, options),
  appointment: (title, message, options) => notificationManager.appointment(title, message, options),
  love: (title, message, options) => notificationManager.love(title, message, options),
  clearAll: () => notificationManager.clearAll()
};
