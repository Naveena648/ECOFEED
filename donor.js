const express = require('express');
const FoodListing = require('../models/FoodListing');
const User = require('../models/User');
const { auth, roleCheck } = require('../middleware/auth');
const { broadcastToCity } = require('../utils/notifications');

const router = express.Router();

// Create food listing
router.post('/create-listing', auth, roleCheck(['donor']), async (req, res) => {
  try {
    const {
      foodType,
      quantity,
      cookingTime,
      expiryTime,
      description,
      cuisineType,
      pickupLocation,
      images
    } = req.body;

    const user = await User.findById(req.user.id);

    const listing = new FoodListing({
      donor: req.user.id,
      foodType,
      quantity,
      cookingTime: new Date(cookingTime),
      expiryTime: new Date(expiryTime),
      description,
      cuisineType,
      pickupLocation,
      images
    });

    await listing.save();

    // Broadcast to city
    broadcastToCity(req.io, user.location.city, 'new_donation', {
      listing,
      donor: user.name
    });

    res.status(201).json({ message: 'Listing created', listing });
  } catch (error) {
    res.status(500).json({ message: 'Error creating listing', error: error.message });
  }
});

// Get donor's listings
router.get('/my-listings', auth, roleCheck(['donor']), async (req, res) => {
  try {
    const listings = await FoodListing.find({ donor: req.user.id }).sort({
      createdAt: -1
    });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

// Get donation history
router.get('/donation-history', auth, roleCheck(['donor']), async (req, res) => {
  try {
    const listings = await FoodListing.find({ donor: req.user.id })
      .populate('acceptedBy', 'name')
      .sort({ createdAt: -1 });

    const stats = {
      total: listings.length,
      delivered: listings.filter((l) => l.status === 'delivered').length,
      totalServings: listings.reduce((sum, l) => sum + l.quantity, 0),
      totalMeals: listings.reduce((sum, l) => {
        if (l.status === 'delivered') {
          return sum + l.recipients.reduce((s, r) => s + r.servings, 0);
        }
        return sum;
      }, 0)
    };

    res.json({ listings, stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

// Update donor profile
router.put('/profile', auth, roleCheck(['donor']), async (req, res) => {
  try {
    const { name, phone, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, location },
      { new: true }
    );

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;
