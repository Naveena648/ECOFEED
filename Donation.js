const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  foodListing: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalRecipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  servingsDelivered: { type: Number, required: true },
  peopleServed: { type: Number, required: true },
  status: {
    type: String,
    enum: ['accepted', 'in_transit', 'delivered', 'completed'],
    default: 'accepted'
  },
  timeline: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      notes: String,
      actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
