/**
 * Format a date to a human-readable "time ago" string
 * @param {Date} date - The date to format
 * @returns {string} Human-readable time string (e.g., "2h ago", "Just now")
 */
export const formatLastSeen = (date) => {
  if (!date) return 'Never';

  const now = new Date();
  const diff = now - new Date(date);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  if (seconds < 30) return 'Just now';
  if (minutes < 1) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  
  // Return formatted date for older times
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Get presence display info (online/offline status + last seen)
 * @param {Object} user - User object with lastActive field
 * @param {Set} onlineUsers - Set of currently online user IDs
 * @returns {Object} Presence info {isOnline, lastSeen, label}
 */
export const getPresenceInfo = (user, onlineUsers = new Set()) => {
  const isOnline = onlineUsers.has(user._id?.toString());
  
  return {
    isOnline,
    lastSeen: user.lastActive || null,
    lastSeenFormatted: formatLastSeen(user.lastActive),
    label: isOnline ? 'Online' : `Last seen ${formatLastSeen(user.lastActive)}`
  };
};

/**
 * Check if a user is considered "active" (online or recently active)
 * @param {Date} lastActive - User's last active timestamp
 * @param {number} thresholdMinutes - Minutes threshold for "recently active" (default 5)
 * @returns {boolean}
 */
export const isUserActive = (lastActive, thresholdMinutes = 5) => {
  if (!lastActive) return false;
  
  const now = new Date();
  const diff = now - new Date(lastActive);
  const minutesAgo = Math.floor(diff / 60000);
  
  return minutesAgo <= thresholdMinutes;
};

/**
 * Broadcast user presence change to all connected sockets
 * @param {Object} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} status - 'online' or 'offline'
 * @param {Date} lastSeen - Last seen timestamp
 */
export const broadcastPresenceChange = (io, userId, status, lastSeen = null) => {
  io.emit('userStatusChanged', {
    userId,
    status,
    lastSeen: lastSeen || new Date(),
    timestamp: new Date()
  });
};
