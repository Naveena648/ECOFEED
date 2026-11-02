const mongoose = require('mongoose');

const impactMetricsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  city: String,
  totalFoodSaved: { type: Number, default: 0 },
  totalMealsDelivered: { type: Number, default: 0 },
  activeDonors: { type: Number, default: 0 },
  activeNGOs: { type: Number, default: 0 },
  activeVolunteers: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  carbonFootprintReduced: { type: Number, default: 0 },
  donations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donation' }]
});

module.exports = mongoose.model('ImpactMetrics', impactMetricsSchema);
