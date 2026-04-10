// Socket.IO manager for emitting friend request events
let io = null;
let userSocketsMultiple = null;

const setSocketIO = (ioInstance, userSocketsMultipleMap) => {
  io = ioInstance;
  userSocketsMultiple = userSocketsMultipleMap;
};

const getIO = () => io;

const getUserSocketIds = (userId) => {
  return userSocketsMultiple?.get(userId);
};

const emitToUser = (userId, event, data) => {
  const socketSet = getUserSocketIds(userId);
  
  if (socketSet && socketSet.size > 0 && io) {
    socketSet.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
};

const notifyFriendRequest = (recipientId, data) => {
  emitToUser(recipientId, 'friend-request-received', data);
};

const notifyFriendRequestAccepted = (userId, data) => {
  emitToUser(userId, 'friend-request-accepted', data);
};

const notifyFriendRequestDeclined = (userId, data) => {
  emitToUser(userId, 'friend-request-declined', data);
};

const notifyUserOnline = (userId, friends) => {
  // Notify all friends that this user is now online
  if (!friends || friends.length === 0) return;
  
  friends.forEach(friendId => {
    emitToUser(friendId, 'user-online', { userId, username: userId });
  });
};

const notifyUserOffline = (userId, friends) => {
  // Notify all friends that this user is now offline
  if (!friends || friends.length === 0) return;
  
  friends.forEach(friendId => {
    emitToUser(friendId, 'user-offline', { userId, username: userId });
  });
};

const broadcastMessageToServerChannel = (serverId, channelId, message) => {
  // Broadcast message to all users in a server channel room
  const roomId = `server-${serverId}-channel-${channelId}`;
  if (io) {
    io.to(roomId).emit('receive-message', message);
  }
};

module.exports = {
  setSocketIO,
  getIO,
  getUserSocketIds,
  emitToUser,
  notifyFriendRequest,
  notifyFriendRequestAccepted,
  notifyFriendRequestDeclined,
  notifyUserOnline,
  notifyUserOffline,
  broadcastMessageToServerChannel
};
