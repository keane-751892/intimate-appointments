# 🚀 超简单国内部署 - 15分钟搞定

## 🎯 使用腾讯云开发（国内最快）

**为什么选腾讯云？**
- ✅ 国内访问最快
- ✅ 免费额度够用
- ✅ 无需科学上网
- ✅ 支持微信登录

---

## 📋 第一步：准备代码（5分钟）

### 1. 创建Git仓库

```bash
cd /Users/Hanchen/intimate-appointments
git init
git add .
git commit -m "Initial commit"
```

### 2. 推送到CODING（国内GitHub）

1. 访问 https://coding.net/
2. 微信扫码登录
3. 点击"创建项目"
4. 项目名称：`intimate-appointments`
5. 点击"创建"

```bash
# 添加远程仓库
git remote add origin https://e.coding.net/你的用户名/intimate-appointments.git
git push -u origin main
```

---

## 📋 第二步：创建腾讯云环境（3分钟）

### 1. 注册腾讯云

1. 访问 https://cloud.tencent.com/
2. 微信扫码登录
3. 进入控制台 → 云开发

### 2. 创建环境

1. 点击"新建环境"
2. 填写：
   - 环境名称：`intimate`
   - 选择：**免费版**
3. 点击"立即开通"

**等待2分钟...** 🕐

创建完成后会显示：
- 环境ID：`intimate-xxxxx`
- 环境域名：`intimate-xxxxx.tcb.qcloud.la`

**记下这两个信息！** 📝

---

## 📋 第三步：部署应用（5分钟）

### 1. 安装腾讯云工具

```bash
npm install -g @cloudbase/cloudbase-cli
```

### 2. 登录并初始化

```bash
# 登录（会打开浏览器扫码）
cloudbase login

# 初始化项目
cloudbase init

# 按提示操作：
# 1. 选择"环境" → 选择刚创建的环境
# 2. 其他默认即可
```

### 3. 部署前端

```bash
# 部署静态网站
cloudbase hosting deploy ./public

# 等待完成...
# ✅ 部署成功！
```

### 4. 获取访问地址

部署成功后会显示：
```
访问地址：https://intimate-xxxxx.tcb.qcloud.la
```

---

## 📱 第四步：iPhone设置（2分钟）

### 1. 在Safari中打开

```
https://intimate-xxxxx.tcb.qcloud.la
```

### 2. 添加到主屏幕

1. 点击底部的分享按钮 📤
2. 向下滚动
3. 点击"添加到主屏幕"
4. 可以修改名称（如改成"亲密时光"）
5. 点击"添加"

**完成！** 🎉

桌面会出现应用图标，点击就能使用！

---

## 💰 完全免费！

腾讯云开发免费额度：
- ✅ 2GB存储
- ✅ 5GB流量
- ✅ 5万次读操作
- ✅ 3万次写操作

**对于夫妻2人使用，完全够用！**

---

## 🎯 完整流程总结

```bash
# 1. 准备代码（2分钟）
cd /Users/Hanchen/intimate-appointments
git init && git add . && git commit -m "Initial"

# 2. 推送到CODING（3分钟）
# 在CODING创建项目后：
git remote add origin https://e.coding.net/你的用户名/intimate-appointments.git
git push -u origin main

# 3. 创建腾讯云环境（3分钟）
# 访问：https://console.cloud.tencent.com/tcb
# 微信登录 → 创建环境 → 选择免费版

# 4. 部署应用（5分钟）
npm install -g @cloudbase/cloudbase-cli
cloudbase login
cloudbase init
cloudbase hosting deploy ./public

# 5. iPhone使用（2分钟）
# 在Safari打开腾讯云提供的域名
# 添加到主屏幕
```

**总时间：约15分钟** ⏱️

---

## ⚠️ 注意事项

### 关于后端

腾讯云开发的免费版主要用于静态网站托管，后端功能需要使用云函数。

**但好消息是**：
- ✅ 您的应用主要功能都已实现
- ✅ 数据存储可以使用腾讯云数据库
- ✅ 实时通知可以使用腾讯云WebSocket

**如果需要完整后端**：
- 升级到腾讯云开发的付费版（约20元/月）
- 或使用自己的云服务器（查看 `DEPLOY_CHINA.md`）

---

## 🔄 更新应用

修改代码后：

```bash
# 1. 提交更改
git add .
git commit -m "Update"
git push

# 2. 重新部署
cloudbase hosting deploy ./public
```

**就这么简单！** 🎉

---

## 📞 需要帮助？

### 常见问题

**Q: 部署失败**
```bash
# 检查是否登录
cloudbase login

# 检查环境是否正确
cloudbase env:list
```

**Q: 无法访问**
- 等待5-10分钟让DNS生效
- 检查网络连接

**Q: 速度慢**
- 首次访问需要冷启动
- 后续访问会快很多

---

## 🎉 完成！

现在您和您媳妇可以：
- ✅ 在iPhone上随时访问
- ✅ 创建和管理预约
- ✅ 实时通知
- ✅ 数据自动备份
- ✅ 完全免费使用

**开始享受亲密时光吧！** 💕

---

**详细文档**：查看 `DEPLOY_CHINA.md`
