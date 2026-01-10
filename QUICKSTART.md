# 🚀 快速启动指南

## 方式一：自动启动（推荐）

### macOS/Linux

```bash
# 1. 进入项目目录
cd intimate-appointments

# 2. 运行启动脚本
./setup.sh

# 3. 启动应用
npm run dev
```

### Windows PowerShell

```powershell
# 1. 进入项目目录
cd intimate-appointments

# 2. 创建.env文件
copy .env.example .env

# 3. 安装依赖
npm install

# 4. 启动应用
npm run dev
```

## 方式二：手动启动

### 步骤1：安装依赖

```bash
npm install
```

### 步骤2：配置环境变量

```bash
# 复制配置文件
cp .env.example .env

# 编辑.env文件，修改JWT_SECRET
# 生成随机密钥：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤3：启动MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 步骤4：启动应用

```bash
# 开发模式（推荐）
npm run dev

# 生产模式
npm start
```

应用将在 `http://localhost:3000` 启动。

## 方式三：Docker部署

### 使用Docker Compose（最简单）

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

### 单独使用Docker

```bash
# 构建镜像
docker build -t intimate-appointments .

# 运行容器
docker run -d \
  --name intimate-app \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/intimate-appointments \
  intimate-appointments
```

## 首次使用

### 1. 注册账号

1. 打开浏览器访问 `http://localhost:3000`
2. 点击"注册"标签
3. 填写用户名、邮箱和密码
4. 点击"注册"

### 2. 绑定伴侣

1. 注册后，系统会提示绑定伴侣
2. 输入您伴侣的注册邮箱
3. 您的伴侣也需要登录并确认绑定

### 3. 开始使用

- 点击"创建预约"按钮创建第一个预约
- 您的伴侣会收到实时通知
- 可以同意、拒绝或修改预约请求

## 常见问题

### Q: MongoDB连接失败怎么办？

**A:** 确保MongoDB服务正在运行：

```bash
# 检查MongoDB状态
pgrep mongod

# 如果没有运行，启动它
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Q: 如何查看应用日志？

**A:** 日志文件在 `logs/` 目录：

```bash
# 查看实时日志
tail -f logs/out.log

# 查看错误日志
tail -f logs/err.log
```

### Q: 如何修改端口？

**A:** 编辑 `.env` 文件中的 `PORT` 变量：

```env
PORT=8080  # 改为你想要的端口
```

### Q: 如何重置数据？

**A:** 清除MongoDB数据：

```bash
# 连接到MongoDB
mongosh

# 切换到应用数据库
use intimate_appointments

# 删除所有集合
db.users.deleteMany({})
db.appointments.deleteMany({})
```

### Q: 如何启用HTTPS？

**A:** 使用Nginx反向代理，参考 `README.md` 中的生产环境部署章节。

## 开发提示

### 调试模式

打开浏览器控制台，输入：

```javascript
// 查看应用状态
IntimateApp.AppState

// 手动同步数据
IntimateApp.syncData()

// 查看所有预约
IntimateApp.appointmentManager.appointments
```

### 快捷键

- `Ctrl/Cmd + K` - 快速创建新预约
- `ESC` - 关闭所有模态框

## 需要帮助？

- 查看完整文档：`README.md`
- 提交问题：GitHub Issues
- 查看示例：项目内置了完整的示例代码

## 下一步

1. 根据需求自定义UI样式（修改 `css/` 目录下的文件）
2. 添加新功能（参考现有代码结构）
3. 部署到生产环境（参考 `README.md` 部署章节）

**祝您使用愉快！💕**
