// Simple DB connection tester
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI not set. Set it in environment or .env file.');
  process.exit(2);
}

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB successfully');
  return mongoose.connection.close();
}).then(() => process.exit(0)).catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message || err);
  process.exit(1);
});
