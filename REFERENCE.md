# 💕 亲密时光 - 快速参考卡片

## 🎯 项目概览

一个专为夫妻打造的私密预约管理应用，支持实时双向通信、预约协商、温馨UI设计。

**核心特色**：
- ✅ 实时同步通知（WebSocket）
- ✅ 温馨的视觉设计
- ✅ 夫妻配对绑定
- ✅ 数据加密存储
- ✅ 响应式移动端

---

## 🚀 快速启动（3步）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境（复制示例文件）
cp .env.example .env

# 3. 启动应用
npm run dev
```

访问：http://localhost:3000

---

## 📂 核心文件速查

| 文件 | 功能 |
|------|------|
| `server/index.js` | 后端服务器（Express + Socket.io） |
| `public/index.html` | 前端主页面 |
| `public/js/auth.js` | 用户认证逻辑 |
| `public/js/appointment.js` | 预约管理逻辑 |
| `public/js/main.js` | 应用初始化 |
| `css/variables.css` | 颜色和样式变量 |

---

## 🎨 自定义配色

修改 `css/variables.css`：

```css
:root {
  --primary-color: #FF6B6B;    /* 主色 - 珊瑚粉 */
  --bg-color: #FFF8E7;          /* 背景 - 奶油色 */
  /* 修改这些值来自定义配色 */
}
```

---

## 🔧 常用命令

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# Docker部署
docker-compose up -d

# PM2部署
pm2 start ecosystem.config.js

# 查看日志
tail -f logs/out.log
```

---

## 📝 API端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/bind-partner` - 绑定伴侣

### 预约
- `POST /api/appointments` - 创建预约
- `GET /api/appointments` - 获取列表
- `PUT /api/appointments/:id/status` - 更新状态
- `PUT /api/appointments/:id` - 修改预约

---

## 🔌 WebSocket事件

### 服务器推送
- `new-appointment` - 新预约通知
- `appointment-updated` - 状态更新
- `appointment-modified` - 预约修改

### 客户端发送
- `authenticate` - 认证连接

---

## 🛠️ 调试命令

打开浏览器控制台：

```javascript
// 查看应用状态
IntimateApp.AppState

// 手动同步数据
IntimateApp.syncData()

// 查看用户信息
IntimateApp.authManager.user

// 查看所有预约
IntimateApp.appointmentManager.appointments

// 发送测试通知
IntimateApp.notify.success('测试', '消息')
```

---

## ⌨️ 快捷键

- `Ctrl/Cmd + K` - 快速创建预约
- `ESC` - 关闭所有模态框

---

## 🔒 安全配置

### 修改JWT密钥

```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 复制到 .env 文件的 JWT_SECRET
```

### MongoDB安全

```bash
# 启用认证
mongod --auth

# 创建管理员用户
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["root"]
})
```

---

## 📱 部署清单

### 生产环境检查清单

- [ ] 修改JWT_SECRET为随机字符串
- [ ] 设置NODE_ENV=production
- [ ] 启用HTTPS（Let's Encrypt）
- [ ] 配置防火墙
- [ ] 设置MongoDB备份
- [ ] 配置Nginx反向代理
- [ ] 设置PM2自动重启
- [ ] 配置日志轮转

---

## 🐛 故障排除

### 问题：MongoDB连接失败
```bash
# 检查MongoDB状态
pgrep mongod

# 启动MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### 问题：WebSocket不工作
- 检查防火墙设置
- 确认WebSocket端口可访问
- 查看浏览器控制台错误

### 问题：数据丢失
- 检查浏览器本地存储是否启用
- 使用导出功能备份数据
- 从MongoDB恢复数据

---

## 📚 文档索引

- `README.md` - 完整项目文档
- `QUICKSTART.md` - 快速启动指南
- `PROJECT_STRUCTURE.md` - 项目结构详解
- `REFERENCE.md` - 本文件（快速参考）

---

## 🌟 功能清单

### 已实现功能 ✅

- [x] 用户注册/登录
- [x] JWT认证
- [x] 夫妻绑定机制
- [x] 创建预约
- [x] 修改预约
- [x] 实时通知
- [x] 浏览器通知
- [x] 数据加密
- [x] 自动备份
- [x] 数据导出/导入
- [x] 响应式设计
- [x] 预约历史记录

### 未来规划 🚀

- [ ] 密码找回功能
- [ ] 预约提醒设置
- [ ] 统计图表
- [ ] 情绪日记
- [ ] 纪念日提醒
- [ ] 移动App版本
- [ ] 多语言支持

---

## 📞 获取帮助

1. 查看完整文档：`README.md`
2. 查看项目结构：`PROJECT_STRUCTURE.md`
3. 查看快速启动：`QUICKSTART.md`
4. 提交问题：GitHub Issues

---

## 💡 最佳实践

### 开发
1. 使用 `npm run dev` 进行开发
2. 修改代码后自动重启
3. 使用浏览器控制台调试
4. 查看日志文件排查问题

### 部署
1. 使用PM2或Docker部署
2. 启用HTTPS
3. 定期备份数据库
4. 监控应用运行状态

### 安全
1. 修改默认JWT密钥
2. 启用MongoDB认证
3. 使用强密码策略
4. 定期更新依赖包

---

## 🎉 项目信息

- **版本**：v1.0.0
- **技术栈**：Node.js + Express + Socket.io + MongoDB + Vanilla JS
- **许可证**：MIT
- **最后更新**：2024-01-10

---

## 🙏 致谢

感谢您选择"亲密时光"！

**祝您和您的伴侣幸福美满！💕**

---

*提示：将此文件添加到书签，方便随时查阅*
