const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecofeed';
let mongoConnected = false;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(err => {
  console.warn('⚠️  MongoDB connection failed. Running in development mode without database.');
  console.warn('To enable database, install MongoDB or use MongoDB Atlas.');
});

const db = mongoose.connection;
db.on('error', (err) => {
  console.warn('⚠️  MongoDB connection error:', err.message);
});
db.once('open', () => {
  mongoConnected = true;
  console.log('✅ Connected to MongoDB');
});

// Make MongoDB status available
app.get('/api/db-status', (req, res) => {
  res.json({ 
    mongodb: mongoConnected,
    message: mongoConnected ? 'Database connected' : 'Database not connected - running in development mode'
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('📱 New user connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import Models
require('./models/User');
require('./models/FoodListing');
require('./models/Donation');
require('./models/Location');
require('./models/Rating');
require('./models/ImpactMetrics');

// Import Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const donorRoutes = require('./routes/donor');
const ngoRoutes = require('./routes/ngo');
const volunteerRoutes = require('./routes/volunteer');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🌱 EcoFeed Server running on port ${PORT}`);
});
