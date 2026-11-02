// Real-time notification broadcasting
const emitNotification = (io, room, eventType, data) => {
  io.to(room).emit('notification', {
    type: eventType,
    timestamp: new Date(),
    data
  });
};

// Broadcast to city-based rooms
const broadcastToCity = (io, city, eventType, data) => {
  io.to(`city_${city}`).emit('notification', {
    type: eventType,
    timestamp: new Date(),
    data
  });
};

// Broadcast to role-based rooms
const broadcastToRole = (io, role, eventType, data) => {
  io.to(`role_${role}`).emit('notification', {
    type: eventType,
    timestamp: new Date(),
    data
  });
};

module.exports = {
  emitNotification,
  broadcastToCity,
  broadcastToRole
};
