# 💕 亲密时光 - 夫妻预约应用

一个专为夫妻打造的私密预约管理应用，支持实时同步、双向确认、修改协商等功能，营造温馨的视觉体验。

## ✨ 核心功能

### 1. 用户认证系统
- ✅ 注册/登录/找回密码
- ✅ JWT令牌认证
- ✅ 密码哈希存储（bcryptjs）
- ✅ 自动会话管理

### 2. 预约管理
- ✅ 创建私密预约
- ✅ 日期时间选择
- ✅ 备注信息添加
- ✅ 预约状态管理（待确认、已确认、已拒绝、已修改）
- ✅ 预约历史记录

### 3. 实时通知系统
- ✅ WebSocket双向通信
- ✅ 新预约通知
- ✅ 状态变更通知
- ✅ 浏览器原生通知
- ✅ 应用内通知系统

### 4. 夫妻绑定机制
- ✅ 邮箱配对绑定
- ✅ 双向确认机制
- ✅ 唯一伴侣关系

### 5. 数据安全
- ✅ AES-GCM加密
- ✅ 本地数据加密存储
- ✅ 自动备份机制
- ✅ 数据导入/导出功能

### 6. UI/UX设计
- ✅ 温馨柔和的色彩方案
- ✅ 响应式移动端设计
- ✅ 流畅的动画效果
- ✅ 直观的操作流程

## 🚀 技术栈

### 后端
- **Node.js** + **Express** - 服务器框架
- **Socket.io** - WebSocket实时通信
- **MongoDB** - 数据存储
- **Mongoose** - ODM
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **dotenv** - 环境变量管理

### 前端
- **HTML5** + **CSS3** + **Vanilla JavaScript** - 无框架依赖
- **WebSocket** - 实时通信
- **IndexedDB** - 本地数据存储
- **Web Crypto API** - 数据加密

## 📦 安装与部署

### 前置要求

- Node.js 16.x 或更高版本
- MongoDB 4.x 或更高版本
- npm 或 yarn 包管理器

### 1. 克隆项目

```bash
git clone <repository-url>
cd intimate-appointments
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/intimate-appointments

# JWT密钥（生产环境请使用随机字符串）
JWT_SECRET=your-random-secret-key-here

# CORS配置
CORS_ORIGIN=http://localhost:8080
```

**重要：生产环境中请务必更改 `JWT_SECRET` 为随机字符串！**

生成随机密钥的方法：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 启动MongoDB

确保MongoDB服务正在运行：

```bash
# macOS (使用Homebrew安装的MongoDB)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. 启动应用

开发模式（自动重启）：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

应用将在 `http://localhost:3000` 启动。

## 🎯 使用指南

### 首次使用流程

#### 1. 注册账号
1. 打开应用，点击"注册"标签
2. 填写用户名、邮箱和密码
3. 点击"注册"按钮
4. 注册成功后自动登录

#### 2. 绑定伴侣
1. 登录后，系统会提示绑定伴侣
2. 输入您伴侣的注册邮箱
3. 您的伴侣也需要登录后确认绑定
4. 绑定完成后即可开始使用预约功能

#### 3. 创建预约
1. 点击"创建预约"按钮
2. 填写预约标题、日期时间和备注
3. 点击"发送预约"
4. 伴侣会收到实时通知

#### 4. 处理预约请求
- **同意**：点击"同意"按钮，预约状态变为"已确认"
- **拒绝**：点击"拒绝"按钮，预约状态变为"已拒绝"
- **修改**：点击"修改"按钮，可修改预约信息并说明原因

### 快捷键

- **Ctrl/Cmd + K** - 快速创建新预约
- **ESC** - 关闭所有模态框

### 数据备份与恢复

#### 自动备份
系统每天会自动创建一次数据备份，保存在浏览器本地。

#### 手动备份
1. 打开浏览器开发者工具控制台
2. 输入命令：`IntimateApp.storage.createBackup()`
3. 备份将保存在本地存储中

#### 导出数据
```javascript
IntimateApp.storage.exportData()
```

#### 导入数据
```javascript
// 在文件输入中选择备份文件
IntimateApp.storage.importData(file)
```

## 🔒 安全说明

### 数据加密
- 所有敏感数据都使用AES-GCM加密
- 密码使用bcryptjs哈希存储
- JWT令牌用于API认证

### 隐私保护
- 数据仅存储在您自己的服务器
- 夫妻之间的数据完全私密
- 支持本地加密存储

### 最佳实践
1. 定期备份MongoDB数据
2. 使用强密码
3. 定期更新JWT密钥
4. 启用HTTPS（生产环境）
5. 定期更新依赖包

## 🌐 生产环境部署

### 使用PM2部署

1. 安装PM2：

```bash
npm install -g pm2
```

2. 创建PM2配置文件 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'intimate-appointments',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

3. 启动应用：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 使用Nginx反向代理

1. 安装Nginx：

```bash
sudo apt-get install nginx
```

2. 创建配置文件 `/etc/nginx/sites-available/intimate-appointments`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. 启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/intimate-appointments /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 启用HTTPS（使用Let's Encrypt）

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🛠️ 开发指南

### 项目结构

```
intimate-appointments/
├── server/              # 后端代码
│   └── index.js        # 服务器入口
├── public/             # 前端代码
│   ├── index.html      # 主页面
│   ├── css/            # 样式文件
│   └── js/             # JavaScript文件
│       ├── utils/      # 工具函数
│       ├── auth.js     # 认证逻辑
│       ├── appointment.js  # 预约管理
│       └── main.js     # 主入口
├── package.json        # 依赖配置
├── .env.example        # 环境变量示例
└── README.md           # 项目文档
```

### API端点

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/bind-partner` - 绑定伴侣
- `GET /api/auth/partner` - 获取伴侣信息

#### 预约相关
- `POST /api/appointments` - 创建预约
- `GET /api/appointments` - 获取预约列表
- `PUT /api/appointments/:id/status` - 更新预约状态
- `PUT /api/appointments/:id` - 修改预约

### WebSocket事件

#### 客户端发送
- `authenticate` - 认证连接

#### 服务器推送
- `new-appointment` - 新预约通知
- `appointment-updated` - 预约状态更新
- `appointment-modified` - 预约被修改

### 调试模式

在浏览器控制台中，可以使用以下命令：

```javascript
// 查看应用状态
IntimateApp.AppState

// 手动同步数据
IntimateApp.syncData()

// 查看认证信息
IntimateApp.authManager.user

// 查看所有预约
IntimateApp.appointmentManager.appointments

// 发送测试通知
IntimateApp.notify.success('测试通知', '这是一条测试消息')
```

## 🐛 常见问题

### 1. MongoDB连接失败
**问题**：应用启动时提示MongoDB连接失败

**解决方案**：
- 确保MongoDB服务正在运行
- 检查 `.env` 文件中的 `MONGODB_URI` 配置
- 检查MongoDB端口是否被占用

### 2. WebSocket连接失败
**问题**：实时通知不工作

**解决方案**：
- 检查防火墙设置
- 确保WebSocket端口可访问
- 检查反向代理配置（生产环境）

### 3. 本地数据丢失
**问题**：刷新页面后数据消失

**解决方案**：
- 检查浏览器是否禁用了本地存储
- 清除浏览器缓存并重试
- 使用导出功能定期备份数据

### 4. 伴侣绑定失败
**问题**：无法绑定伴侣账号

**解决方案**：
- 确保输入的是伴侣的正确注册邮箱
- 伴侣账号需要已注册
- 检查是否已经绑定了其他伴侣

## 📝 更新日志

### v1.0.0 (2024-01-10)
- ✨ 初始版本发布
- ✅ 完整的用户认证系统
- ✅ 预约创建和管理功能
- ✅ WebSocket实时通知
- ✅ 夫妻绑定机制
- ✅ 数据加密和备份
- ✅ 响应式UI设计

## 🤝 贡献指南

欢迎提交问题报告和功能建议！

## 📄 许可证

MIT License

## 💖 致谢

感谢所有为改善夫妻关系而努力的人们！

---

**联系方式**：如有问题，请提交Issue或Pull Request。

**祝您使用愉快！💕**
