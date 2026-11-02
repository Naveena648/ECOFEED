const express = require('express');
const FoodListing = require('../models/FoodListing');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { auth, roleCheck } = require('../middleware/auth');
const { getDistance } = require('../utils/location');

const router = express.Router();

// Get nearby pickups for volunteer
router.get('/nearby-tasks', auth, roleCheck(['volunteer']), async (req, res) => {
  try {
    const { latitude, longitude, radiusKm = 10 } = req.query;

    const listings = await FoodListing.find({
      status: 'accepted',
      expiryTime: { $gt: new Date() }
    }).populate('donor', 'name phone');

    const nearby = listings.filter((listing) => {
      const distance = getDistance(
        latitude,
        longitude,
        listing.pickupLocation.latitude,
        listing.pickupLocation.longitude
      );
      return distance <= radiusKm;
    });

    const withDistance = nearby.map((listing) => ({
      ...listing.toObject(),
      distance: getDistance(
        latitude,
        longitude,
        listing.pickupLocation.latitude,
        listing.pickupLocation.longitude
      )
    }));

    res.json(withDistance.sort((a, b) => a.distance - b.distance));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Accept pickup task
router.post('/accept-task/:listingId', auth, roleCheck(['volunteer']), async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.listingId);

    if (!listing || listing.status !== 'accepted') {
      return res.status(400).json({ message: 'Listing not available' });
    }

    listing.status = 'picked_up';
    listing.pickedUpBy = req.user.id;
    listing.pickedUpAt = new Date();
    await listing.save();

    const donation = await Donation.findOne({ foodListing: listing._id });
    donation.volunteer = req.user.id;
    donation.status = 'in_transit';
    donation.timeline.push({
      status: 'picked_up',
      actor: req.user.id
    });
    await donation.save();

    res.json({ message: 'Task accepted', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting task', error: error.message });
  }
});

// Get volunteer tasks
router.get('/my-tasks', auth, roleCheck(['volunteer']), async (req, res) => {
  try {
    const donations = await Donation.find({ volunteer: req.user.id })
      .populate('donor', 'name')
      .populate('acceptor', 'name')
      .populate('foodListing')
      .sort({ createdAt: -1 });

    const stats = {
      total: donations.length,
      completed: donations.filter((d) => d.status === 'completed').length,
      totalHours: donations.length * 1.5, // Placeholder
      badges: []
    };

    res.json({ donations, stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Update delivery status
router.put('/update-status/:donationId', auth, roleCheck(['volunteer']), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const donation = await Donation.findById(req.params.donationId);
    donation.status = status;
    donation.timeline.push({
      status,
      actor: req.user.id,
      notes
    });

    await donation.save();

    // Notify NGO
    req.io.to(`user_${donation.acceptor}`).emit('delivery_update', {
      donation,
      status
    });

    res.json({ message: 'Status updated', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

module.exports = router;
