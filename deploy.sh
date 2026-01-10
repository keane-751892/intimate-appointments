#!/bin/bash

# 亲密时光应用 - 自动化部署脚本
# 适用于Ubuntu 20.04/22.04

set -e

echo "🚀 开始部署亲密时光应用..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量（请根据实际情况修改）
DOMAIN="your-domain.com"  # 替换为您的域名
EMAIL="your@email.com"     # 替换为您的邮箱
APP_DIR="/var/www/intimate-appointments"
MONGO_DB_NAME="intimate_appointments"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用root用户运行此脚本${NC}"
    exit 1
fi

# 1. 更新系统
echo -e "${GREEN}📦 更新系统...${NC}"
apt-get update && apt-get upgrade -y

# 2. 安装Node.js
echo -e "${GREEN}📦 安装Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js已安装: $(node -v)"
fi

# 3. 安装MongoDB
echo -e "${GREEN}📦 安装MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
else
    echo "MongoDB已安装"
fi

# 4. 安装Nginx
echo -e "${GREEN}📦 安装Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "Nginx已安装"
fi

# 5. 安装PM2
echo -e "${GREEN}📦 安装PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "PM2已安装"
fi

# 6. 安装Git
echo -e "${GREEN}📦 安装Git...${NC}"
if ! command -v git &> /dev/null; then
    apt-get install -y git
else
    echo "Git已安装"
fi

# 7. 创建应用目录
echo -e "${GREEN}📁 创建应用目录...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# 8. 上传应用文件
echo -e "${YELLOW}⚠️  请手动上传应用文件到 $APP_DIR${NC}"
echo "您可以使用以下命令："
echo "  scp -r intimate-appointments/* root@$DOMAIN:$APP_DIR/"
echo ""
read -p "文件上传完成后按Enter继续..."

# 9. 安装依赖
echo -e "${GREEN}📦 安装应用依赖...${NC}"
cd $APP_DIR
npm install --production

# 10. 配置环境变量
echo -e "${GREEN}⚙️  配置环境变量...${NC}"
JWT_SECRET=$(openssl rand -hex 32)
cat > .env << EOF
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/$MONGO_DB_NAME
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$DOMAIN
EOF

# 11. 配置Nginx
echo -e "${GREEN}⚙️  配置Nginx...${NC}"
cat > /etc/nginx/sites-available/intimate-appointments << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/intimate-appointments /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 12. 安装SSL证书（Let's Encrypt）
echo -e "${GREEN🔒 安装SSL证书...${NC}"
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# 13. 配置防火墙
echo -e "${GREEN}🔒 配置防火墙...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 14. 启动应用
echo -e "${GREEN}🚀 启动应用...${NC}"
pm2 start server/index.js --name "intimate-appointments"
pm2 save
pm2 startup

echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "🌐 访问地址："
echo "   https://$DOMAIN"
echo ""
echo "📱 iPhone使用："
echo "   1. 在Safari中打开 https://$DOMAIN"
echo "   2. 点击分享按钮"
echo "   3. 选择'添加到主屏幕'"
echo ""
echo "🔧 管理命令："
echo "   pm2 list              # 查看应用状态"
echo "   pm2 logs              # 查看日志"
echo "   pm2 restart intimate-appointments  # 重启应用"
echo ""
