const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: String,
  city: { type: String, required: true },
  state: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

locationSchema.index({ latitude: '2dsphere', longitude: '2dsphere' });

module.exports = mongoose.model('Location', locationSchema);
