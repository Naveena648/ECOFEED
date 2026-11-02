const express = require('express');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Donation = require('../models/Donation');
const ImpactMetrics = require('../models/ImpactMetrics');
const { auth, roleCheck } = require('../middleware/auth');

const router = express.Router();

// Verify user
router.post('/verify-user/:userId', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { verified, rejectionReason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verified },
      { new: true }
    );

    res.json({ message: 'User verification updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying user', error: error.message });
  }
});

// Get all users for verification
router.get('/pending-verifications', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const users = await User.find({ verified: false }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get all food listings
router.get('/all-listings', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const listings = await FoodListing.find()
      .populate('donor', 'name email')
      .populate('acceptedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

// Get impact metrics
router.get('/impact-metrics', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await ImpactMetrics.findOne({ date: { $gte: today } });

    if (!metrics) {
      const donations = await Donation.find({
        createdAt: { $gte: today }
      });

      const users = await User.find({});

      const foodSaved = donations.reduce((sum, d) => sum + d.servingsDelivered, 0);
      const mealDelivered = donations.reduce((sum, d) => sum + d.peopleServed, 0);

      const newMetrics = new ImpactMetrics({
        totalFoodSaved: foodSaved,
        totalMealsDelivered: mealDelivered,
        activeDonors: users.filter((u) => u.role === 'donor').length,
        activeNGOs: users.filter((u) => u.role === 'ngo').length,
        activeVolunteers: users.filter((u) => u.role === 'volunteer').length,
        totalUsers: users.length,
        donations: donations.map((d) => d._id)
      });

      await newMetrics.save();
      return res.json(newMetrics);
    }

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching metrics', error: error.message });
  }
});

// Get statistics by city
router.get('/city-stats/:city', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const city = req.params.city;

    const donors = await User.countDocuments({
      'location.city': city,
      role: 'donor'
    });
    const ngos = await User.countDocuments({
      'location.city': city,
      role: 'ngo'
    });
    const volunteers = await User.countDocuments({
      'location.city': city,
      role: 'volunteer'
    });

    const listings = await FoodListing.find({
      'pickupLocation.address': { $regex: city, $options: 'i' }
    });

    const stats = {
      city,
      donors,
      ngos,
      volunteers,
      totalListings: listings.length,
      delivered: listings.filter((l) => l.status === 'delivered').length,
      expired: listings.filter((l) => l.status === 'expired').length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching city stats', error: error.message });
  }
});

// Generate reports
router.get('/reports', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    let startDate = new Date();
    if (period === 'daily') startDate.setDate(startDate.getDate() - 1);
    if (period === 'weekly') startDate.setDate(startDate.getDate() - 7);
    if (period === 'monthly') startDate.setMonth(startDate.getMonth() - 1);

    const donations = await Donation.find({
      createdAt: { $gte: startDate }
    });

    const report = {
      period,
      totalDonations: donations.length,
      totalMealsDelivered: donations.reduce((sum, d) => sum + d.servingsDelivered, 0),
      totalPeopleServed: donations.reduce((sum, d) => sum + d.peopleServed, 0),
      averageDonationValue: donations.length > 0 ? donations.length : 0,
      carbonFootprintReduced: donations.length * 2.5 // kg CO2 per meal
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Delete/suspend user
router.delete('/user/:userId', auth, roleCheck(['admin']), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { isActive: false });
    res.json({ message: 'User suspended' });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending user', error: error.message });
  }
});

module.exports = router;
