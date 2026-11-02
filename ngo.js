const express = require('express');
const FoodListing = require('../models/FoodListing');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { auth, roleCheck } = require('../middleware/auth');
const { findNearbyDonations, sortByExpiry, getDistance } = require('../utils/location');

const router = express.Router();

// Get nearby donations
router.get('/nearby', auth, roleCheck(['ngo', 'volunteer']), async (req, res) => {
  try {
    const { latitude, longitude, radiusKm = 5 } = req.query;

    const listings = await FoodListing.find({
      status: 'available',
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

    const sorted = sortByExpiry(nearby);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
});

// Accept donation
router.post('/accept/:listingId', auth, roleCheck(['ngo']), async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.listingId);

    if (!listing || listing.status !== 'available') {
      return res.status(400).json({ message: 'Listing not available' });
    }

    listing.status = 'accepted';
    listing.acceptedBy = req.user.id;
    listing.acceptedAt = new Date();
    await listing.save();

    // Create donation record
    const donation = new Donation({
      foodListing: listing._id,
      donor: listing.donor,
      acceptor: req.user.id,
      servingsDelivered: listing.quantity,
      peopleServed: listing.recipients.length,
      status: 'accepted'
    });

    await donation.save();

    // Notify donor
    req.io.to(`user_${listing.donor}`).emit('donation_accepted', {
      listing,
      acceptor: await User.findById(req.user.id)
    });

    res.json({ message: 'Donation accepted', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting donation', error: error.message });
  }
});

// Get my donations (NGO)
router.get('/my-donations', auth, roleCheck(['ngo']), async (req, res) => {
  try {
    const donations = await Donation.find({ acceptor: req.user.id })
      .populate('donor', 'name phone')
      .populate('foodListing')
      .sort({ createdAt: -1 });

    const stats = {
      total: donations.length,
      delivered: donations.filter((d) => d.status === 'completed').length,
      totalMealsDelivered: donations.reduce((sum, d) => sum + d.servingsDelivered, 0),
      totalPeopleServed: donations.reduce((sum, d) => sum + d.peopleServed, 0)
    };

    res.json({ donations, stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
});

// Confirm delivery
router.post('/confirm-delivery/:donationId', auth, roleCheck(['ngo']), async (req, res) => {
  try {
    const { recipientName, servingsDelivered, notes } = req.body;

    const donation = await Donation.findById(req.params.donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.status = 'completed';
    donation.completedAt = new Date();
    donation.timeline.push({
      status: 'delivered',
      actor: req.user.id,
      notes
    });

    await donation.save();

    // Update listing
    const listing = await FoodListing.findById(donation.foodListing);
    listing.status = 'delivered';
    listing.deliveredAt = new Date();
    listing.deliveredTo = req.user.id;
    listing.recipients.push({ name: recipientName, servings: servingsDelivered });
    await listing.save();

    res.json({ message: 'Delivery confirmed', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming delivery', error: error.message });
  }
});

// Rate donor
router.post('/rate-donor/:donationId', auth, roleCheck(['ngo']), async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const donation = await Donation.findById(req.params.donationId);
    const donor = await User.findById(donation.donor);

    const totalRatings = donor.totalRatings + 1;
    const newRating = (donor.ratings * donor.totalRatings + rating) / totalRatings;

    await User.findByIdAndUpdate(donor._id, {
      ratings: newRating,
      totalRatings: totalRatings
    });

    res.json({ message: 'Rating submitted', newRating });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting rating', error: error.message });
  }
});

module.exports = router;
