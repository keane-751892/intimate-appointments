// API基础URL
const API_BASE = window.location.origin + '/api';

// 认证管理器
class AuthManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.socket = null;
  }

  // 初始化
  async init() {
    // 从本地存储恢复会话
    this.token = storage.getToken();
    this.user = storage.getUser();

    if (this.token && this.user) {
      // 初始化WebSocket连接
      this.initWebSocket();

      // 验证Token是否仍然有效
      try {
        await this.fetchWithAuth('/auth/partner');
        return true;
      } catch (error) {
        // Token无效，清除会话
        this.logout();
        return false;
      }
    }
    return false;
  }

  // 初始化WebSocket连接
  initWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io({
      auth: {
        token: this.token
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket连接成功');
      // 发送认证信息
      this.socket.emit('authenticate', this.token);
    });

    this.socket.on('authenticated', () => {
      console.log('WebSocket认证成功');
    });

    this.socket.on('auth-error', (error) => {
      console.error('WebSocket认证失败:', error);
    });

    // 监听新预约通知
    this.socket.on('new-appointment', (data) => {
      console.log('收到新预约通知:', data);
      notify.appointment('新预约通知', `${data.from}向您发起了一个新的预约请求`, {
        browser: true
      });

      // 刷新预约列表
      if (window.appointmentManager) {
        window.appointmentManager.loadAppointments();
      }
    });

    // 监听预约状态更新
    this.socket.on('appointment-updated', (data) => {
      console.log('预约状态更新:', data);
      const statusMessages = {
        confirmed: '您的预约已被确认',
        rejected: '您的预约已被拒绝',
        modified: '您的预约已被修改'
      };

      const message = statusMessages[data.status] || '预约状态已更新';
      notify.info('预约更新', message, {
        browser: true
      });

      // 刷新预约列表
      if (window.appointmentManager) {
        window.appointmentManager.loadAppointments();
      }
    });

    // 监听预约修改
    this.socket.on('appointment-modified', (data) => {
      console.log('预约被修改:', data);
      notify.appointment('预约修改', '您的伴侣修改了预约信息，请查看并确认', {
        browser: true,
        persistent: true
      });

      // 刷新预约列表
      if (window.appointmentManager) {
        window.appointmentManager.loadAppointments();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket断开连接');
    });
  }

  // 带认证的API请求
  async fetchWithAuth(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token无效或过期，清除会话
      this.logout();
      throw new Error('登录已过期，请重新登录');
    }

    // 403不自动logout，让具体业务逻辑处理
    if (response.status === 403) {
      // 不做任何处理，让调用者处理403错误
    }

    return response;
  }

  // 用户注册
  async register(username, email, password) {
    try {
      const response = await this.fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '注册失败');
      }

      // 保存Token和用户信息
      this.token = data.token;
      this.user = data.user;
      storage.setToken(this.token);
      storage.setUser(this.user);

      // 初始化WebSocket
      this.initWebSocket();

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 用户登录
  async login(email, password) {
    try {
      const response = await this.fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 保存Token和用户信息
      this.token = data.token;
      this.user = data.user;
      storage.setToken(this.token);
      storage.setUser(this.user);

      // 初始化WebSocket
      this.initWebSocket();

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 绑定伴侣
  async bindPartner(partnerEmail) {
    try {
      const response = await this.fetchWithAuth('/auth/bind-partner', {
        method: 'POST',
        body: JSON.stringify({ partnerEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '绑定失败');
      }

      // 更新用户信息
      this.user.hasPartner = true;
      storage.setUser(this.user);

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取伴侣信息
  async getPartner() {
    try {
      const response = await this.fetchWithAuth('/auth/partner');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取伴侣信息失败');
      }

      return {
        success: true,
        partner: data.partner
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 退出登录
  logout() {
    // 断开WebSocket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // 清除本地数据
    this.token = null;
    this.user = null;
    storage.clearAuth();
    storage.clearAppointments();

    // 切换到登录页面
    showAuthPage();

    notify.info('已退出登录', '期待您的下次光临 💕');
  }

  // 检查是否已登录
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  // 检查是否已绑定伴侣
  hasPartner() {
    return this.user && this.user.hasPartner;
  }
}

// 创建全局实例
const authManager = new AuthManager();

// 页面切换
function showAuthPage() {
  document.getElementById('auth-page').style.display = 'block';
  document.getElementById('dashboard-page').style.display = 'none';
}

function showDashboardPage() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'block';
}

// 认证表单处理
document.addEventListener('DOMContentLoaded', () => {
  // 标签页切换
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // 更新标签页状态
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 切换表单
      document.querySelectorAll('.auth-form').forEach(form => {
        form.style.display = 'none';
      });

      if (targetTab === 'login') {
        document.getElementById('login-form').style.display = 'block';
      } else if (targetTab === 'register') {
        document.getElementById('register-form').style.display = 'block';
      } else if (targetTab === 'forgot') {
        document.getElementById('forgot-form').style.display = 'block';
      }
    });
  });

  // 登录表单提交
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const loading = btn.querySelector('.loading');

    // 显示加载状态
    btnText.style.display = 'none';
    loading.style.display = 'inline-block';
    btn.disabled = true;

    const result = await authManager.login(email, password);

    // 恢复按钮状态
    btnText.style.display = 'inline';
    loading.style.display = 'none';
    btn.disabled = false;

    if (result.success) {
      notify.success('登录成功', '欢迎回来！💕');
      showDashboardPage();
      initDashboard();
    } else {
      notify.error('登录失败', result.error);
    }
  });

  // 注册表单提交
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    // 验证密码
    if (password !== confirmPassword) {
      notify.error('注册失败', '两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      notify.error('注册失败', '密码长度至少为6位');
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const loading = btn.querySelector('.loading');

    // 显示加载状态
    btnText.style.display = 'none';
    loading.style.display = 'inline-block';
    btn.disabled = true;

    const result = await authManager.register(username, email, password);

    // 恢复按钮状态
    btnText.style.display = 'inline';
    loading.style.display = 'none';
    btn.disabled = false;

    if (result.success) {
      notify.success('注册成功', '欢迎加入亲密时光！💕');
      showDashboardPage();
      initDashboard();
    } else {
      notify.error('注册失败', result.error);
    }
  });

  // 退出登录
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('确定要退出登录吗？')) {
      authManager.logout();
    }
  });

  // 切换到找回密码
  document.getElementById('show-forgot').addEventListener('click', () => {
    document.querySelector('[data-tab="forgot"]').click();
  });

  // 返回登录
  document.getElementById('back-to-login').addEventListener('click', () => {
    document.querySelector('[data-tab="login"]').click();
  });

  // 忘记密码表单
  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;

    // TODO: 实现密码重置功能
    notify.info('功能开发中', '密码重置功能正在开发中，请稍后回来');
  });
});

// 初始化仪表板
async function initDashboard() {
  if (!authManager.isAuthenticated()) {
    return;
  }

  // 更新用户信息
  const user = authManager.user;
  document.getElementById('user-name').textContent = user.username;
  document.getElementById('welcome-name').textContent = user.username;

  // 获取伴侣信息
  const partnerResult = await authManager.getPartner();
  if (partnerResult.success && partnerResult.partner) {
    document.getElementById('partner-info').textContent = `伴侣: ${partnerResult.partner.username}`;
  } else {
    document.getElementById('partner-info').textContent = '尚未绑定伴侣';
  }

  // 加载预约列表
  if (window.appointmentManager) {
    await window.appointmentManager.loadAppointments();
  }

  // 检查是否需要绑定伴侣
  if (!authManager.hasPartner()) {
    setTimeout(() => {
      if (confirm('您还没有绑定伴侣账号，是否现在绑定？')) {
        showBindPartnerModal();
      }
    }, 1000);
  }
}

// 显示绑定伴侣模态框
function showBindPartnerModal() {
  const modal = document.getElementById('bind-partner-modal');
  modal.style.display = 'block';
}

// 初始化应用
async function initApp() {
  // 初始化通知管理器
  notificationManager.init();

  // 请求浏览器通知权限
  await notificationManager.requestBrowserPermission();

  // 检查是否已登录
  const isAuthenticated = await authManager.init();

  if (isAuthenticated) {
    showDashboardPage();
    await initDashboard();
  } else {
    showAuthPage();
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
