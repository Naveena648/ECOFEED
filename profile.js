const express = require('express');
const User = require('../models/User');
const Location = require('../models/Location');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Update location (used in location setup)
router.put('/update-location', auth, async (req, res) => {
  try {
    const { latitude, longitude, address, accuracy } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Extract city from address if available
    let city = 'Unknown';
    if (address) {
      const parts = address.split(',');
      city = parts[parts.length - 2]?.trim() || parts[parts.length - 1]?.trim() || 'Unknown';
    }

    // Update user location
    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          latitude,
          longitude,
          address: address || `${latitude}, ${longitude}`,
          city,
          state: null,
          accuracy
        }
      },
      { new: true }
    ).select('-password');

    // Also create/update location in Location collection for geospatial queries
    let location = await Location.findOne({ user: userId });
    if (location) {
      location.latitude = latitude;
      location.longitude = longitude;
      location.address = address || `${latitude}, ${longitude}`;
      location.city = city;
      await location.save();
    } else {
      location = new Location({
        user: userId,
        latitude,
        longitude,
        address: address || `${latitude}, ${longitude}`,
        city
      });
      await location.save();
    }

    res.json({
      message: 'Location updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update profile (general updates)
router.put('/update-profile', auth, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar })
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;
