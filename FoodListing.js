const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodType: {
    type: String,
    enum: ['vegetarian', 'non_vegetarian', 'vegan'],
    required: true
  },
  quantity: { type: Number, required: true, description: 'Number of servings' },
  cookingTime: { type: Date, required: true },
  expiryTime: { type: Date, required: true },
  description: String,
  cuisineType: [String],
  allergens: [String],
  pickupLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },
    instructions: String
  },
  images: [String],
  status: {
    type: String,
    enum: ['available', 'accepted', 'picked_up', 'delivered', 'expired'],
    default: 'available'
  },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: Date,
  pickedUpBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickedUpAt: Date,
  deliveredAt: Date,
  deliveredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipients: [
    {
      name: String,
      servings: Number
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-expire listings
foodListingSchema.pre('save', async function() {
  if (this.expiryTime < new Date() && this.status === 'available') {
    this.status = 'expired';
  }
});

module.exports = mongoose.model('FoodListing', foodListingSchema);
