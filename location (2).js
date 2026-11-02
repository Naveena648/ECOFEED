const geolib = require('geolib');

// Calculate distance between two points
const getDistance = (lat1, lon1, lat2, lon2) => {
  return geolib.getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  ) / 1000; // Convert to km
};

// Find nearby donations
const findNearbyDonations = (userLat, userLon, donations, radiusKm = 5) => {
  return donations.filter((donation) => {
    const distance = getDistance(
      userLat,
      userLon,
      donation.pickupLocation.latitude,
      donation.pickupLocation.longitude
    );
    return distance <= radiusKm;
  });
};

// Sort by expiry (earliest first)
const sortByExpiry = (donations) => {
  return donations.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));
};

module.exports = {
  getDistance,
  findNearbyDonations,
  sortByExpiry
};
