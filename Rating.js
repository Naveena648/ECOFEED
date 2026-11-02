const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  categories: {
    quality: Number,
    punctuality: Number,
    professionalism: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rating', ratingSchema);
