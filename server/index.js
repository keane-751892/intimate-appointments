const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intimate-appointments', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 预约模型
const appointmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'modified'],
    default: 'pending'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modificationNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的令牌' });
    }
    req.user = user;
    next();
  });
};

// ==================== API路由 ====================

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        hasPartner: !!user.partnerId
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        hasPartner: !!user.partnerId,
        partnerId: user.partnerId
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 绑定伴侣
app.post('/api/auth/bind-partner', authenticateToken, async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const userId = req.user.userId;

    // 查找伴侣
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) {
      return res.status(404).json({ error: '未找到该用户' });
    }

    if (partner._id.toString() === userId) {
      return res.status(400).json({ error: '不能绑定自己' });
    }

    // 更新双方的partnerId
    await User.findByIdAndUpdate(userId, { partnerId: partner._id });
    await User.findByIdAndUpdate(partner._id, { partnerId: userId });

    res.json({ message: '伴侣绑定成功' });
  } catch (error) {
    console.error('绑定伴侣错误:', error);
    res.status(500).json({ error: '绑定失败，请稍后重试' });
  }
});

// 获取伴侣信息
app.get('/api/auth/partner', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.partnerId) {
      return res.status(404).json({ error: '尚未绑定伴侣' });
    }

    const partner = await User.findById(user.partnerId).select('-password');
    res.json({ partner });
  } catch (error) {
    console.error('获取伴侣信息错误:', error);
    res.status(500).json({ error: '获取伴侣信息失败' });
  }
});

// 创建预约
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { title, date, notes } = req.body;
    const userId = req.user.userId;

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user.partnerId) {
      return res.status(400).json({ error: '请先绑定伴侣' });
    }

    const appointment = new Appointment({
      title,
      date: new Date(date),
      notes,
      createdBy: userId,
      partnerId: user.partnerId,
      status: 'pending'
    });

    await appointment.save();

    // 通知伴侣
    const partnerSocketId = userToSocket.get(user.partnerId.toString());
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('new-appointment', {
        appointment: {
          id: appointment._id,
          title: appointment.title,
          date: appointment.date,
          notes: appointment.notes,
          status: appointment.status
        },
        from: user.username
      });
    }

    res.status(201).json({
      message: '预约创建成功',
      appointment
    });
  } catch (error) {
    console.error('创建预约错误:', error);
    res.status(500).json({ error: '创建预约失败' });
  }
});

// 获取所有预约
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointments = await Appointment.find({
      $or: [
        { createdBy: userId },
        { partnerId: userId }
      ]
    }).sort({ date: -1 });

    res.json({ appointments });
  } catch (error) {
    console.error('获取预约错误:', error);
    res.status(500).json({ error: '获取预约失败' });
  }
});

// 更新预约状态
app.put('/api/appointments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;
    const userId = req.user.userId;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: '预约不存在' });
    }

    // 权限检查：
    // 1. 普通状态：只有伴侣可以更新
    // 2. modified状态：创建者也可以确认修改
    const isPartner = appointment.partnerId.toString() === userId;
    const isCreator = appointment.createdBy.toString() === userId;
    const isModifiedStatus = appointment.status === 'modified';

    if (!isPartner && !(isCreator && isModifiedStatus)) {
      return res.status(403).json({ error: '无权限操作此预约' });
    }

    appointment.status = status;
    await appointment.save();

    // 通知创建者
    const creatorSocketId = userToSocket.get(appointment.createdBy.toString());
    if (creatorSocketId) {
      io.to(creatorSocketId).emit('appointment-updated', {
        appointmentId: appointment._id,
        status: appointment.status
      });
    }

    res.json({ message: '状态更新成功', appointment });
  } catch (error) {
    console.error('更新预约状态错误:', error);
    res.status(500).json({ error: '更新状态失败' });
  }
});

// 修改预约
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { title, date, notes, modificationNotes } = req.body;
    const appointmentId = req.params.id;
    const userId = req.user.userId;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: '预约不存在' });
    }

    // 双方都可以修改预约
    if (appointment.createdBy.toString() !== userId &&
        appointment.partnerId.toString() !== userId) {
      return res.status(403).json({ error: '无权限操作此预约' });
    }

    appointment.title = title || appointment.title;
    appointment.date = date ? new Date(date) : appointment.date;
    appointment.notes = notes || appointment.notes;
    appointment.modificationNotes = modificationNotes;
    appointment.modifiedBy = userId;
    appointment.status = 'modified';
    await appointment.save();

    // 通知对方
    const partnerId = appointment.createdBy.toString() === userId ?
                      appointment.partnerId : appointment.createdBy;
    const partnerSocketId = userToSocket.get(partnerId.toString());
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('appointment-modified', {
        appointment
      });
    }

    res.json({ message: '预约修改成功', appointment });
  } catch (error) {
    console.error('修改预约错误:', error);
    res.status(500).json({ error: '修改预约失败' });
  }
});

// ==================== WebSocket连接 ====================

const userToSocket = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户认证
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userToSocket.set(decoded.userId, socket.id);
      socket.userId = decoded.userId;
      console.log(`用户 ${decoded.username} 认证成功`);
    } catch (error) {
      socket.emit('auth-error', { error: '认证失败' });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    if (socket.userId) {
      userToSocket.delete(socket.userId);
      console.log(`用户 ${socket.userId} 断开连接`);
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
