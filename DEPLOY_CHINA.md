# 🇨🇳 国内网络环境部署指南

## 🎯 目标：快速部署 + 国内访问流畅

---

## 🚀 推荐方案对比

### 方案1：Vercel（推荐）⭐⭐⭐

**优势**：
- ✅ 在国内访问速度快（有CDN）
- ✅ 自动HTTPS
- ✅ 支持自定义域名
- ✅ 部署简单
- ✅ 免费版慷慨

**缺点**：
- ❌ 需要GitHub（可能需要科学上网）
- ❌ Serverless限制（不适合WebSocket）

**成本**：免费

**速度**：⭐⭐⭐⭐ (国内访问快)

---

### 方案2：腾讯云开发（最推荐）⭐⭐⭐⭐⭐

**优势**：
- ✅ 国内访问最快
- ✅ 完整支持WebSocket
- ✅ 自动HTTPS
- ✅ 国内代码托管（CODING/Gitee）
- ✅ 每月免费额度

**缺点**：
- ❌ 配置稍复杂
- ❌ 文档主要是中文

**成本**：
- 免费版：每月2GB流量，10万次调用
- 付费版：约20-50元/月

**速度**：⭐⭐⭐⭐⭐ (国内最快)

---

### 方案3：Railway（备选）⭐⭐⭐

**优势**：
- ✅ 支持Docker部署
- ✅ 完整支持后端服务
- ✅ 自动HTTPS

**缺点**：
- ❌ 国内访问较慢
- ❌ 需要GitHub

**成本**：免费版 $5/月

**速度**：⭐⭐⭐

---

## 🇨🇳 方案2详细教程：腾讯云开发

### 为什么推荐腾讯云开发？

1. ✅ **国内访问最快** - 服务器在国内
2. ✅ **完整支持** - 支持WebSocket、定时器等
3. ✅ **免费额度** - 每月免费额度够用
4. ✅ **稳定可靠** - 腾讯云基础设施
5. ✅ **无需备案** - 使用腾讯云域名无需备案

---

## 📋 步骤1：准备代码（5分钟）

### 1.1 初始化Git仓库

```bash
cd /Users/Hanchen/intimate-appointments

# 初始化Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 亲密时光应用"
```

### 1.2 推送到国内代码托管

**选项A：使用CODING（推荐）**

1. 访问 https://coding.net/
2. 注册/登录（支持微信）
3. 创建新项目：`intimate-appointments`
4. 执行以下命令：

```bash
# 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://e.coding.net/YOUR_USERNAME/intimate-appointments.git

# 推送代码
git branch -M main
git push -u origin main
```

**选项B：使用Gitee**

1. 访问 https://gitee.com/
2. 注册/登录
3. 创建新仓库
4. 推送代码：

```bash
git remote add origin https://gitee.com/YOUR_USERNAME/intimate-appointments.git
git push -u origin main
```

---

## 📋 步骤2：注册腾讯云开发（5分钟）

### 2.1 注册账号

1. 访问 https://cloud.tencent.com/
2. 注册/登录（支持微信）
3. 进入"云开发"控制台

### 2.2 创建环境

1. 点击"新建环境"
2. 填写信息：
   - **环境名称**：intimate-appointments
   - **环境规格**：选择"免费版"
   - **付费模式**：按量付费
3. 点击"创建"
4. 等待环境创建完成（约2分钟）

### 3.2 获取环境信息

创建完成后，记下：
- **环境ID**：类似 `intimate-xxxxx`
- **环境域名**：类似 `intimate-xxxxx.tcb.qcloud.la`

---

## 📋 步骤3：配置项目（10分钟）

### 3.1 修改项目配置

创建 `.cloudbaserc.json` 文件：

```json
{
  "envId": "your-env-id",
  "region": "ap-shanghai",
  "framework": {
    "name": "intimate-appointments",
    "plugins": {
      "client": {
        "use": "@cloudbase/framework-plugin-website",
        "build": {
          "command": "npm install && npm run build"
        }
      },
      "server": {
        "use": "@cloudbase/framework-plugin-node",
        "build": {
          "command": "npm install",
          "env": {
            "PORT": "3000"
          }
        }
      },
      "database": {
        "use": "@cloudbase/framework-plugin-database",
        "resources": {
          "collections": [
            {
              "name": "users",
              "description": "用户表"
            },
            {
              "name": "appointments",
              "description": "预约表"
            }
          ]
        }
      }
    }
  }
}
```

### 3.2 修改环境变量

创建 `.env.production` 文件：

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/intimate_appointments
JWT_SECRET=your-random-secret-key-here
CORS_ORIGIN=https://your-env-id.tcb.qcloud.la
```

### 3.3 安装CloudBase CLI

```bash
# 安装CLI工具
npm install -g @cloudbase/cloudbase-cli

# 登录
cloudbase login

# 初始化项目（选择刚才创建的环境）
cloudbase init
```

---

## 📋 步骤4：部署应用（5分钟）

### 4.1 部署静态网站

```bash
# 部署前端
cloudbase hosting deploy ./public
```

### 4.2 部署后端服务

由于腾讯云开发的限制，我们需要使用云函数：

#### 4.2.1 创建云函数目录结构

```bash
mkdir -p cloudfunctions
cd cloudfunctions
```

#### 4.2.2 创建云函数

创建 `appointment-manager` 函数：

```javascript
// cloudfunctions/appointment-manager/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;

  switch (action) {
    case 'create':
      return await createAppointment(data);
    case 'list':
      return await listAppointments(data);
    case 'updateStatus':
      return await updateStatus(data);
    case 'modify':
      return await modifyAppointment(data);
    default:
      return { error: 'Unknown action' };
  }
};

async function createAppointment(data) {
  try {
    const result = await db.collection('appointments').add({
      data: {
        ...data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return { success: true, id: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function listAppointments(data) {
  try {
    const { userId } = data;
    const result = await db.collection('appointments')
      .where(_.or([
        { createdBy: userId },
        { partnerId: userId }
      ]))
      .orderBy('createdAt', 'desc')
      .get();

    return { success: true, appointments: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateStatus(data) {
  try {
    const { appointmentId, status } = data;
    const result = await db.collection('appointments').doc(appointmentId).update({
      data: {
        status: status,
        updatedAt: new Date()
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function modifyAppointment(data) {
  try {
    const { appointmentId, ...updates } = data;
    const result = await db.collection('appointments').doc(appointmentId).update({
      data: {
        ...updates,
        status: 'modified',
        updatedAt: new Date()
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### 4.2.3 部署云函数

```bash
# 部署所有云函数
cloudbase functions:deploy
```

---

## 📋 步骤5：配置自定义域名（可选，10分钟）

### 5.1 购买域名

在腾讯云购买域名（可选）：
- 访问 https://dnspod.cloud.tencent.com/
- 购买域名（约50-100元/年）

### 5.2 添加域名

1. 在腾讯云开发控制台
2. 点击"静态网站托管"
3. 点击"设置"
4. 添加自定义域名
5. 按照提示配置DNS

### 5.3 配置SSL证书

腾讯云会自动为您的域名配置SSL证书

---

## 📱 步骤6：iPhone使用（2分钟）

### 6.1 访问应用

**使用腾讯云默认域名**：
```
https://your-env-id.tcb.qcloud.la
```

**使用自定义域名**：
```
https://your-domain.com
```

### 6.2 添加到主屏幕

1. 在iPhone Safari中打开应用
2. 点击底部分享按钮 📤
3. 向下滚动
4. 点击"添加到主屏幕"
5. 点击"添加"

---

## 💰 成本说明

### 腾讯云开发免费额度

每月免费：
- ✅ 2GB数据库存储
- ✅ 5GB静态网站托管
- ✅ 50,000次数据库读操作
- ✅ 30,000次数据库写操作
- ✅ 5GBCDN流量

**对于夫妻2人使用，完全够用！**

### 超出免费额度后的费用

| 项目 | 单价 | 备注 |
|------|------|------|
| 数据库读 | ¥0.015/万次 | 读操作 |
| 数据库写 | ¥0.05/万次 | 写操作 |
| 存储空间 | ¥0.004/GB/天 | 数据库 |
| CDN流量 | ¥0.21/GB | 流量 |
| 云函数 | ¥0.0000167/GBs | 运行时间 |

**预估**：正常使用每月不超过10元

---

## 🔧 常见问题

### Q1：部署失败怎么办？

**A**：检查以下项目：
1. 环境ID是否正确
2. 代码是否推送到CODING/Gitee
3. 网络是否正常

### Q2：国内访问还是很慢？

**A**：
1. 确保使用腾讯云的CDN域名
2. 配置自定义域名（国内DNS解析快）
3. 检查是否有防火墙限制

### Q3：WebSocket不工作？

**A**：腾讯云开发支持WebSocket，但需要：
1. 使用云函数
2. 配置正确的环境变量
3. 使用腾讯云提供的WebSocket服务

### Q4：数据迁移到其他平台？

**A**：可以随时导出数据
1. 使用设置页面的"导出数据"功能
2. 数据会导出为JSON文件
3. 可以导入到其他平台

---

## 🎯 总结

### 推荐方案

**如果您在国内**：
1. ⭐⭐⭐⭐⭐ 腾讯云开发（最快最稳定）
2. ⭐⭐⭐⭐ Vercel（速度快，但需GitHub）
3. ⭐⭐⭐ Railway（功能完整，但慢）

### 部署时间

- 腾讯云开发：30分钟
- Vercel：15分钟
- Railway：20分钟

### 成本

- 腾讯云开发：免费（小额使用）
- Vercel：免费
- Railway：免费版$5/月

---

## 🚀 立即开始

### 最快路径（推荐）

```bash
# 1. 推送代码到CODING
git init
git add .
git commit -m "Initial commit"
git remote add origin https://e.coding.net/YOUR_USERNAME/intimate-appointments.git
git push -u origin main

# 2. 在腾讯云创建环境
# 访问 https://console.cloud.tencent.com/tcb

# 3. 部署
npm install -g @cloudbase/cloudbase-cli
cloudbase login
cloudbase init
cloudbase hosting deploy ./public

# 4. 在iPhone访问
# 使用腾讯云提供的域名
```

---

**准备好了吗？开始部署吧！** 🚀

**有问题随时问我！**
