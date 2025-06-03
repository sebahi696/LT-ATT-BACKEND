const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

<<<<<<< HEAD
// Load environment variables
=======
>>>>>>> 22ff5191947ffcd885f47517df388e6a65239926
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
<<<<<<< HEAD
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected to LT-ATT-APP'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));
=======
mongoose.connect('mongodb://localhost:27017/LTAPP', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected to LTAPP database'))
.catch(err => console.log('MongoDB Connection Error:', err));
>>>>>>> 22ff5191947ffcd885f47517df388e6a65239926

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/employee', require('./routes/employee'));

<<<<<<< HEAD
app.get('/', (req, res) => {
  res.send('✅ LT-ATT Backend is working');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
=======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
>>>>>>> 22ff5191947ffcd885f47517df388e6a65239926
