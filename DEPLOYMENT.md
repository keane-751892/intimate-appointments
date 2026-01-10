# 🌍 生产环境部署指南

## 📱 目标：让iPhone可以访问

为了在iPhone上使用，我们需要：
1. ✅ 部署到公网服务器
2. ✅ 配置HTTPS（iOS必需）
3. ✅ 绑定域名
4. ✅ 配置移动端访问

---

## 🚀 部署方案

### 方案A：Docker部署（最简单）⭐

#### 1. 准备服务器

**购买云服务器**：
- 阿里云ECS：https://www.aliyun.com/
- 腾讯云CVM：https://cloud.tencent.com/
- 推荐配置：2核2G，Ubuntu 20.04

#### 2. 安装Docker

```bash
# SSH登录服务器
ssh root@your-server-ip

# 安装Docker
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker-compose/docker-compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### 3. 上传项目文件

```bash
# 在本地（Mac）执行
cd /Users/Hanchen/intimate-appointments
scp -r . root@your-server-ip:/root/intimate-appointments/
```

#### 4. 配置环境变量

```bash
# 在服务器上执行
cd /root/intimate-appointments
cp .env.example .env
nano .env
```

修改以下内容：
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/intimate_appointments
JWT_SECRET=your-random-secret-key-here
CORS_ORIGIN=https://your-domain.com
```

生成JWT密钥：
```bash
openssl rand -hex 32
```

#### 5. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

#### 6. 配置Nginx和HTTPS

```bash
# 安装Nginx
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# 配置Nginx
nano /etc/nginx/sites-available/intimate-appointments
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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

启用配置：
```bash
ln -s /etc/nginx/sites-available/intimate-appointments /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

获取SSL证书：
```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

### 方案B：PM2部署（传统方式）

#### 1. 安装依赖

```bash
# 更新系统
apt-get update && apt-get upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 安装PM2
npm install -g pm2
```

#### 2. 上传并启动项目

```bash
# 上传项目
scp -r /Users/Hanchen/intimate-appointments/* root@your-server-ip:/var/www/intimate-appointments/

# 在服务器上
cd /var/www/intimate-appointments
npm install --production

# 配置环境变量
cp .env.example .env
nano .env

# 启动应用
pm2 start server/index.js --name intimate-appointments
pm2 save
pm2 startup
```

---

## 🌐 域名配置

### 1. 购买域名

推荐域名注册商：
- 阿里云：https://wanwang.aliyun.com/
- 腾讯云：https://dnspod.cloud.tencent.com/
- Cloudflare：https://www.cloudflare.com/

### 2. 配置DNS解析

在域名管理后台添加A记录：
```
类型: A
主机记录: @
记录值: your-server-ip
TTL: 600
```

添加www记录：
```
类型: CNAME
主机记录: www
记录值: your-domain.com
TTL: 600
```

### 3. 等待DNS生效

通常需要10分钟到24小时，可以用以下命令检查：
```bash
nslookup your-domain.com
```

---

## 📱 iPhone使用指南

### 方式1：直接访问Safari

1. 打开Safari浏览器
2. 访问：`https://your-domain.com`
3. 点击分享按钮 📤
4. 向下滚动，点击"添加到主屏幕"
5. 点击"添加"

现在您的iPhone桌面上就有了一个应用图标！

### 方式2：添加到主屏幕（推荐）

这样做的好处：
- ✅ 像原生App一样
- ✅ 全屏运行
- ✅ 离线可用
- ✅ 推送通知

---

## 🔒 安全配置

### 1. 配置防火墙

```bash
# 配置UFW防火墙
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 2. 定期备份数据

```bash
# 创建备份脚本
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db intimate_appointments --out /backup/mongodb_$DATE
tar -czf /backup/backup_$DATE.tar.gz /backup/mongodb_$DATE
find /backup -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /root/backup.sh

# 添加到crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup.sh") | crontab -
```

### 3. 监控应用状态

```bash
# 查看PM2状态
pm2 list

# 查看日志
pm2 logs

# 设置日志轮转
pm2 install pm2-logrotate
```

---

## 🛠️ 常用管理命令

### Docker方式

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码
docker-compose down
cd /root/intimate-appointments
git pull
docker-compose up -d --build
```

### PM2方式

```bash
# 查看应用状态
pm2 list

# 重启应用
pm2 restart intimate-appointments

# 查看日志
pm2 logs

# 查看实时日志
pm2 logs --lines 100
```

---

## 💰 成本估算

### 最低配置（推荐）

| 项目 | 价格 | 备注 |
|------|------|------|
| 云服务器 | 50-100元/月 | 2核2G，足够使用 |
| 域名 | 50-100元/年 | 首年优惠 |
| SSL证书 | 免费 | Let's Encrypt |
| **总计** | **50-100元/月** | 约2-3元/天 |

### 省钱技巧

1. 使用学生优惠（如果是学生）
2. 选择新用户优惠
3. 按年付费可以享受折扣
4. 使用轻量应用服务器（30-50元/月）

---

## 📞 故障排查

### 问题1：无法访问网站

**检查**：
```bash
# 检查服务是否运行
pm2 list
# 或
docker-compose ps

# 检查Nginx
systemctl status nginx

# 检查端口
netstat -tulpn | grep :3000
netstat -tulpn | grep :80
```

### 问题2：HTTPS证书失败

**解决**：
```bash
# 手动更新证书
certbot renew --force-renewal

# 重新配置Nginx
nginx -t
systemctl reload nginx
```

### 问题3：应用无法启动

**查看日志**：
```bash
# PM2方式
pm2 logs

# Docker方式
docker-compose logs
```

---

## 🎯 快速部署清单

- [ ] 购买云服务器
- [ ] 购买域名
- [ ] 配置DNS解析
- [ ] 上传项目文件
- [ ] 配置环境变量
- [ ] 安装SSL证书
- [ ] 测试访问
- [ ] iPhone添加到主屏幕
- [ ] 通知家人开始使用

---

## 📱 iPhone使用截图步骤

1. **Safari访问**：打开Safari，输入网址
2. **分享按钮**：点击底部的分享图标
3. **添加到主屏幕**：滚动找到"添加到主屏幕"
4. **确认添加**：点击右上角"添加"
5. **完成**：桌面出现应用图标

---

**准备好了吗？选择一个方案开始部署吧！** 🚀

如需帮助，随时询问！
