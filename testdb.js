require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  mongoose.connection.close();
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
});
