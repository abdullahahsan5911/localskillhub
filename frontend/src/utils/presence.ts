/**
 * Frontend utility for presence management and formatting
 */

export const formatLastSeen = (date: Date | string | null | undefined) => {
  if (!date) return 'Never';

  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
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
  
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: new Date().getFullYear() !== new Date(date).getFullYear() ? 'numeric' : undefined
  });
};

export const getPresenceLabel = (isOnline: boolean, lastActive: Date | string | null | undefined) => {
  if (isOnline) return 'Online';
  return `Last seen ${formatLastSeen(lastActive)}`;
};

export const getPresenceColor = (isOnline: boolean) => {
  return isOnline ? 'bg-green-500' : 'bg-gray-400';
};

export const getPresenceTooltip = (isOnline: boolean, lastActive: Date | string | null | undefined) => {
  if (isOnline) return 'User is currently online';
  return `Last seen ${formatLastSeen(lastActive)}`;
};
