// 预约管理器
class AppointmentManager {
  constructor() {
    this.appointments = [];
    this.currentFilter = 'all';
  }

  // 加载预约列表
  async loadAppointments() {
    try {
      const response = await authManager.fetchWithAuth('/appointments');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加载预约失败');
      }

      this.appointments = data.appointments;
      storage.setAppointments(this.appointments);
      this.renderAppointments();

      return {
        success: true,
        appointments: this.appointments
      };
    } catch (error) {
      console.error('加载预约失败:', error);
      // 如果API失败，尝试从缓存加载
      this.appointments = storage.getAppointments();
      this.renderAppointments();

      return {
        success: false,
        error: error.message,
        appointments: this.appointments
      };
    }
  }

  // 创建预约
  async createAppointment(data) {
    try {
      const response = await authManager.fetchWithAuth('/appointments', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || '创建预约失败');
      }

      notify.success('预约创建成功', '已发送给您的伴侣，等待确认 💕');

      // 刷新预约列表
      await this.loadAppointments();

      return {
        success: true,
        appointment: responseData.appointment
      };
    } catch (error) {
      notify.error('创建预约失败', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新预约状态
  async updateStatus(appointmentId, status) {
    try {
      const response = await authManager.fetchWithAuth(`/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新状态失败');
      }

      const statusMessages = {
        confirmed: '已同意此预约',
        rejected: '已拒绝此预约'
      };

      notify.success('操作成功', statusMessages[status] || '状态已更新');

      // 刷新预约列表
      await this.loadAppointments();

      return {
        success: true
      };
    } catch (error) {
      notify.error('操作失败', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 修改预约
  async modifyAppointment(appointmentId, data) {
    try {
      const response = await authManager.fetchWithAuth(`/appointments/${appointmentId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || '修改预约失败');
      }

      notify.success('修改成功', '预约修改请求已发送给您的伴侣');

      // 刷新预约列表
      await this.loadAppointments();

      return {
        success: true,
        appointment: responseData.appointment
      };
    } catch (error) {
      notify.error('修改失败', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 渲染预约列表
  renderAppointments() {
    const listContainer = document.getElementById('appointments-list');
    const emptyState = document.getElementById('empty-state');

    // 过滤预约
    let filteredAppointments = this.appointments;
    if (this.currentFilter !== 'all') {
      filteredAppointments = this.appointments.filter(
        apt => apt.status === this.currentFilter
      );
    }

    // 显示/隐藏空状态
    if (filteredAppointments.length === 0) {
      listContainer.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    listContainer.style.display = 'grid';
    emptyState.style.display = 'none';

    // 清空列表
    listContainer.innerHTML = '';

    // 渲染预约卡片
    filteredAppointments.forEach(appointment => {
      const card = this.createAppointmentCard(appointment);
      listContainer.appendChild(card);
    });
  }

  // 创建预约卡片
  createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className = `appointment-card status-${appointment.status}`;
    card.dataset.appointmentId = appointment._id;

    const statusText = this.getStatusText(appointment.status);
    const formattedDate = this.formatDate(appointment.date);
    const isCreator = appointment.createdBy === authManager.user.id;
    const canModify = isCreator || appointment.status === 'modified';

    card.innerHTML = `
      <div class="appointment-header">
        <div>
          <h4 class="appointment-title">${this.escapeHtml(appointment.title)}</h4>
          <div class="appointment-meta">
            <span class="appointment-date">${formattedDate}</span>
            <span class="appointment-author">${isCreator ? '我创建的' : '伴侣创建的'}</span>
          </div>
        </div>
        <span class="appointment-status status-${appointment.status}">${statusText}</span>
      </div>

      ${appointment.notes ? `
        <div class="appointment-notes">
          ${this.escapeHtml(appointment.notes)}
        </div>
      ` : ''}

      ${appointment.modificationNotes ? `
        <div class="appointment-notes" style="background: var(--info-color); color: white;">
          <strong>修改说明：</strong>${this.escapeHtml(appointment.modificationNotes)}
        </div>
      ` : ''}

      <div class="appointment-actions">
        ${this.renderActionButtons(appointment, isCreator, canModify)}
      </div>
    `;

    // 绑定事件
    this.bindCardEvents(card, appointment);

    return card;
  }

  // 渲染操作按钮
  renderActionButtons(appointment, isCreator, canModify) {
    const buttons = [];

    if (appointment.status === 'pending' && !isCreator) {
      // 待确认且不是创建者：可以同意/拒绝/修改
      buttons.push(`
        <button class="btn-approve" data-action="approve">同意</button>
        <button class="btn-reject" data-action="reject">拒绝</button>
        <button class="btn-modify" data-action="modify">修改</button>
      `);
    } else if (appointment.status === 'modified' && isCreator) {
      // 修改后且是创建者：可以确认修改/拒绝/再次修改
      buttons.push(`
        <button class="btn-approve" data-action="approve">确认修改</button>
        <button class="btn-reject" data-action="reject">拒绝修改</button>
        <button class="btn-modify" data-action="modify">再次修改</button>
      `);
    } else if (canModify && appointment.status !== 'rejected') {
      // 可以修改的预约
      buttons.push(`
        <button class="btn-modify" data-action="modify">修改</button>
      `);
    }

    return buttons.join('');
  }

  // 绑定卡片事件
  bindCardEvents(card, appointment) {
    const approveBtn = card.querySelector('[data-action="approve"]');
    const rejectBtn = card.querySelector('[data-action="reject"]');
    const modifyBtn = card.querySelector('[data-action="modify"]');

    if (approveBtn) {
      approveBtn.addEventListener('click', async () => {
        if (confirm('确定要同意这个预约吗？')) {
          await this.updateStatus(appointment._id, 'confirmed');
        }
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', async () => {
        if (confirm('确定要拒绝这个预约吗？')) {
          await this.updateStatus(appointment._id, 'rejected');
        }
      });
    }

    if (modifyBtn) {
      modifyBtn.addEventListener('click', () => {
        this.showModifyModal(appointment);
      });
    }
  }

  // 显示修改模态框
  showModifyModal(appointment) {
    const modal = document.getElementById('modify-appointment-modal');
    const form = document.getElementById('modify-appointment-form');

    // 填充表单
    document.getElementById('modify-appointment-id').value = appointment._id;
    document.getElementById('modify-appointment-title').value = appointment.title;
    document.getElementById('modify-appointment-date').value = this.formatDateTimeLocal(appointment.date);
    document.getElementById('modify-appointment-notes').value = appointment.notes || '';
    document.getElementById('modify-appointment-reason').value = '';

    // 显示模态框
    modal.style.display = 'block';
  }

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      rejected: '已拒绝',
      modified: '已修改'
    };
    return statusMap[status] || status;
  }

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateStr = date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });

    const timeStr = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diffDays === 0) {
      return `今天 ${timeStr}`;
    } else if (diffDays === 1) {
      return `明天 ${timeStr}`;
    } else if (diffDays === -1) {
      return `昨天 ${timeStr}`;
    } else if (diffDays > 0 && diffDays <= 7) {
      return `${diffDays}天后 ${dateStr} ${timeStr}`;
    } else {
      return `${dateStr} ${timeStr}`;
    }
  }

  // 格式化为datetime-local格式
  formatDateTimeLocal(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 设置过滤器
  setFilter(filter) {
    this.currentFilter = filter;
    this.renderAppointments();
  }

  // 获取历史记录
  getHistory() {
    return this.appointments.filter(apt =>
      apt.status === 'confirmed' || apt.status === 'rejected'
    );
  }
}

// 创建全局实例
const appointmentManager = new AppointmentManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 创建预约按钮
  document.getElementById('create-appointment-btn').addEventListener('click', () => {
    const modal = document.getElementById('create-appointment-modal');
    modal.style.display = 'block';
  });

  // 关闭创建预约模态框
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('create-appointment-modal').style.display = 'none';
  });

  document.getElementById('cancel-appointment').addEventListener('click', () => {
    document.getElementById('create-appointment-modal').style.display = 'none';
  });

  // 创建预约表单提交
  document.getElementById('appointment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('appointment-title').value;
    const date = document.getElementById('appointment-date').value;
    const notes = document.getElementById('appointment-notes').value;

    const result = await appointmentManager.createAppointment({
      title,
      date,
      notes
    });

    if (result.success) {
      // 关闭模态框并重置表单
      document.getElementById('create-appointment-modal').style.display = 'none';
      e.target.reset();
    }
  });

  // 关闭修改预约模态框
  document.getElementById('close-modify-modal').addEventListener('click', () => {
    document.getElementById('modify-appointment-modal').style.display = 'none';
  });

  document.getElementById('cancel-modify').addEventListener('click', () => {
    document.getElementById('modify-appointment-modal').style.display = 'none';
  });

  // 修改预约表单提交
  document.getElementById('modify-appointment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const appointmentId = document.getElementById('modify-appointment-id').value;
    const title = document.getElementById('modify-appointment-title').value;
    const date = document.getElementById('modify-appointment-date').value;
    const notes = document.getElementById('modify-appointment-notes').value;
    const modificationNotes = document.getElementById('modify-appointment-reason').value;

    const result = await appointmentManager.modifyAppointment(appointmentId, {
      title,
      date,
      notes,
      modificationNotes
    });

    if (result.success) {
      // 关闭模态框
      document.getElementById('modify-appointment-modal').style.display = 'none';
    }
  });

  // 绑定伴侣模态框
  document.getElementById('close-bind-modal').addEventListener('click', () => {
    document.getElementById('bind-partner-modal').style.display = 'none';
  });

  document.getElementById('cancel-bind').addEventListener('click', () => {
    document.getElementById('bind-partner-modal').style.display = 'none';
  });

  document.getElementById('bind-partner-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const partnerEmail = document.getElementById('partner-email').value;
    const result = await authManager.bindPartner(partnerEmail);

    if (result.success) {
      notify.success('绑定成功', '伴侣绑定成功！现在可以开始创建预约了 💕');
      document.getElementById('bind-partner-modal').style.display = 'none';
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      notify.error('绑定失败', result.error);
    }
  });

  // 过滤按钮
  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // 更新按钮状态
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 设置过滤器
      appointmentManager.setFilter(filter);
    });
  });

  // 查看历史按钮
  document.getElementById('view-history-btn').addEventListener('click', () => {
    const history = appointmentManager.getHistory();

    if (history.length === 0) {
      notify.info('历史记录', '暂无历史记录');
      return;
    }

    // 显示历史记录（可以扩展为专门的模态框）
    const confirmed = history.filter(apt => apt.status === 'confirmed').length;
    const rejected = history.filter(apt => apt.status === 'rejected').length;

    notify.info('历史记录', `已确认: ${confirmed}个, 已拒绝: ${rejected}个`);
  });

  // 点击模态框背景关闭
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => {
      backdrop.parentElement.style.display = 'none';
    });
  });
});

// 将实例挂载到全局，方便其他模块访问
window.appointmentManager = appointmentManager;
