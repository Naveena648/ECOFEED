const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['donor', 'ngo', 'volunteer', 'ashram', 'admin'],
    required: true
  },
  donorType: {
    type: String,
    enum: ['restaurant', 'hostel', 'event_organizer', 'catering', null],
    default: null
  },
  verified: { type: Boolean, default: false },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String,
    state: String
  },
  avatar: String,
  ecoPoints: { type: Number, default: 0 },
  badges: [String],
  ratings: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    ifsc: String
  },
  documents: [
    {
      type: String,
      url: String,
      verified: Boolean,
      uploadedAt: Date
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
