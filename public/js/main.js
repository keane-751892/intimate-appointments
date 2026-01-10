// 主入口文件 - 应用初始化和全局配置

// 全局应用状态
const AppState = {
  isOnline: navigator.onLine,
  lastSyncTime: null,
  syncInProgress: false
};

// 监听网络状态变化
window.addEventListener('online', () => {
  AppState.isOnline = true;
  notify.success('网络已连接', '可以正常使用所有功能');
  // 触发数据同步
  if (authManager.isAuthenticated()) {
    syncData();
  }
});

window.addEventListener('offline', () => {
  AppState.isOnline = false;
  notify.warning('网络已断开', '部分功能可能无法使用，数据将保存在本地');
});

// 数据同步
async function syncData() {
  if (AppState.syncInProgress) {
    return;
  }

  AppState.syncInProgress = true;

  try {
    // 同步预约数据
    if (window.appointmentManager) {
      await window.appointmentManager.loadAppointments();
    }

    // 更新同步时间
    AppState.lastSyncTime = new Date();
  } catch (error) {
    console.error('数据同步失败:', error);
  } finally {
    AppState.syncInProgress = false;
  }
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  // ESC键关闭所有模态框
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }

  // Ctrl/Cmd + K 创建新预约
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (authManager.isAuthenticated()) {
      document.getElementById('create-appointment-btn').click();
    }
  }
});

// 页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && AppState.isOnline) {
    // 页面重新可见时，检查是否有新数据
    if (authManager.isAuthenticated()) {
      syncData();
    }
  }
});

// 定期同步数据（每5分钟）
setInterval(() => {
  if (AppState.isOnline && authManager.isAuthenticated()) {
    syncData();
  }
}, 5 * 60 * 1000);

// 自动备份（每天一次）
setInterval(() => {
  if (authManager.isAuthenticated()) {
    storage.createBackup().then(result => {
      if (result.success) {
        console.log('自动备份创建成功');
      }
    });
  }
}, 24 * 60 * 60 * 1000);

// 页面加载完成后的初始化
window.addEventListener('load', () => {
  // 设置页面标题
  document.title = '💕 亲密时光 - 夫妻预约应用';

  // 添加favicon（如果有的话）
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💕</text></svg>';
  document.head.appendChild(link);

  // 检查浏览器兼容性
  checkBrowserCompatibility();

  // 显示欢迎提示（首次访问）
  showWelcomeHint();
});

// 检查浏览器兼容性
function checkBrowserCompatibility() {
  const requiredFeatures = [
    'localStorage',
    'crypto',
    'fetch',
    'WebSocket'
  ];

  const missingFeatures = requiredFeatures.filter(feature => {
    if (feature === 'WebSocket') {
      return typeof window.WebSocket === 'undefined' && typeof window.io === 'undefined';
    }
    return !(feature in window);
  });

  if (missingFeatures.length > 0) {
    notify.error('浏览器不兼容',
      `您的浏览器缺少以下功能：${missingFeatures.join(', ')}。建议使用最新版本的Chrome、Firefox或Safari。`,
      { persistent: true }
    );
  }
}

// 显示欢迎提示
function showWelcomeHint() {
  const hasSeenWelcome = localStorage.getItem('intimate_welcome_seen');

  if (!hasSeenWelcome) {
    setTimeout(() => {
      notify.love('欢迎使用亲密时光 💕',
        '按 Ctrl+K 快速创建新预约 | 我们致力于守护您的甜蜜时光',
        { duration: 8000 }
      );
      localStorage.setItem('intimate_welcome_seen', 'true');
    }, 2000);
  }
}

// 防止页面意外关闭时的数据丢失
window.addEventListener('beforeunload', (e) => {
  // 如果有未保存的数据，提示用户
  const hasUnsavedData = document.querySelectorAll('.modal[style*="block"]').length > 0;

  if (hasUnsavedData) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// 错误处理
window.addEventListener('error', (e) => {
  console.error('全局错误:', e.error);
  // 在生产环境中，可以发送错误报告到服务器
});

// 未处理的Promise错误
window.addEventListener('unhandledrejection', (e) => {
  console.error('未处理的Promise错误:', e.reason);
});

// PWA支持（可选）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 注册Service Worker（如果需要PWA功能）
    // navigator.serviceWorker.register('/sw.js')
    //   .then(reg => console.log('Service Worker注册成功'))
    //   .catch(err => console.error('Service Worker注册失败:', err));
  });
}

// 性能监控
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

      console.log(`页面加载时间: ${pageLoadTime}ms`);

      // 如果加载时间过长，给出提示
      if (pageLoadTime > 3000) {
        notify.warning('加载较慢', '页面加载时间较长，建议检查网络连接');
      }
    }, 0);
  });
}

// 导出工具函数供其他模块使用
window.IntimateApp = {
  storage,
  cryptoManager,
  notificationManager,
  notify,
  authManager,
  appointmentManager,
  syncData,
  AppState
};

// 开发模式下的调试工具
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('%c💕 亲密时光 - 开发模式', 'color: #FF6B6B; font-size: 20px; font-weight: bold;');
  console.log('%c可用命令:', 'color: #4A4A4A; font-size: 14px; font-weight: bold;');
  console.log('- IntimateApp.authManager: 认证管理器');
  console.log('- IntimateApp.appointmentManager: 预约管理器');
  console.log('- IntimateApp.storage: 存储管理器');
  console.log('- IntimateApp.notify: 通知工具');
  console.log('- IntimateApp.syncData(): 手动同步数据');
}

console.log('%c💕 亲密时光 v1.0.0', 'color: #FF6B6B; font-size: 16px;');
console.log('%c为夫妻打造的私密预约管理应用', 'color: #7A7A7A; font-size: 12px;');
