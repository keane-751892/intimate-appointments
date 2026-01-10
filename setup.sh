#!/bin/bash

# 亲密时光应用快速启动脚本

echo "💕 亲密时光 - 快速启动脚本"
echo "================================"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js 16.x或更高版本"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm"
    exit 1
fi

echo "✅ npm版本: $(npm -v)"

# 检查MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  警告: 未找到MongoDB，请确保MongoDB已安装并运行"
    echo "   安装指南: https://www.mongodb.com/docs/manual/installation/"
fi

# 创建.env文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 创建.env配置文件..."
    cp .env.example .env

    # 生成随机JWT密钥
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    # 更新.env文件
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-change-in-production/$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/your-secret-key-change-in-production/$JWT_SECRET/" .env
    fi

    echo "✅ .env文件已创建，JWT密钥已生成"
else
    echo "✅ .env文件已存在"
fi

# 安装依赖
echo "📦 安装项目依赖..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在，跳过安装"
fi

# 创建日志目录
if [ ! -d "logs" ]; then
    mkdir logs
    echo "✅ 日志目录已创建"
fi

# 检查MongoDB连接
echo "🔍 检查MongoDB连接..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB正在运行"
    else
        echo "⚠️  MongoDB未运行，尝试启动..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start mongodb-community 2>/dev/null || brew services start mongodb 2>/dev/null
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo systemctl start mongod 2>/dev/null || sudo service mongod start 2>/dev/null
        fi
        sleep 2
        if pgrep -x "mongod" > /dev/null; then
            echo "✅ MongoDB启动成功"
        else
            echo "❌ MongoDB启动失败，请手动启动MongoDB"
        fi
    fi
fi

echo ""
echo "🚀 准备就绪！"
echo ""
echo "可用命令："
echo "  npm start       - 启动生产服务器"
echo "  npm run dev     - 启动开发服务器（自动重启）"
echo ""
echo "访问地址: http://localhost:3000"
echo ""
echo "💕 祝您使用愉快！"
