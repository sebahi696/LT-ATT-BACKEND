const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://lt-att-frontend-n7cvr0qwq-sebahis-projects.vercel.app', /\.vercel\.app$/]
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
};

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ extended: false }));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'La Tavola Attendance API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/qr', require('./routes/qr'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 routes
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API URL:', process.env.NODE_ENV === 'production' 
    ? 'https://lt-att-backend.onrender.com'
    : `http://localhost:${PORT}`);
  console.log('MongoDB Connected:', process.env.MONGODB_URI?.split('@')[1]);
});
