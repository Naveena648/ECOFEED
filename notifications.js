const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get notifications
router.get('/', auth, (req, res) => {
  res.json({ message: 'Notifications endpoint' });
});

// Mark as read
router.put('/:notificationId/read', auth, (req, res) => {
  res.json({ message: 'Notification marked as read' });
});

module.exports = router;
