import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceState {
  onlineUsers: Set<string>;
  userPresence: Record<string, { isOnline: boolean; lastSeen: Date | null }>;
}

// Global presence state (shared across components)
let globalPresenceState: PresenceState = {
  onlineUsers: new Set(),
  userPresence: {}
};

const presenceListeners = new Set<(state: PresenceState) => void>();

/**
 * Subscribe to presence changes
 */
const subscribeToPresence = (callback: (state: PresenceState) => void) => {
  presenceListeners.add(callback);
  return () => {
    presenceListeners.delete(callback);
  };
};

/**
 * Notify all listeners of presence changes
 */
const notifyPresenceUpdate = () => {
  presenceListeners.forEach(callback => callback(globalPresenceState));
};

/**
 * Hook to track online/offline status of a specific user
 */
export const useUserPresence = (userId: string | null) => {
  const [presence, setPresence] = useState({
    isOnline: false,
    lastSeen: null as Date | null
  });
  const [loading, setLoading] = useState(false);

  const fetchPresence = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
      const response = await fetch(`${apiUrl}/users/${userId}/presence`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPresence({
          isOnline: Boolean(data.data.isOnline) || globalPresenceState.onlineUsers.has(userId),
          lastSeen: data.data.lastSeen ? new Date(data.data.lastSeen) : null
        });
      } else {
        setPresence((prev) => ({
          ...prev,
          isOnline: globalPresenceState.onlineUsers.has(userId),
        }));
      }
    } catch (error) {
      console.error('Error fetching presence:', error);
      setPresence((prev) => ({
        ...prev,
        isOnline: globalPresenceState.onlineUsers.has(userId),
      }));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to presence changes for this user
  useEffect(() => {
    fetchPresence();

    const unsubscribe = subscribeToPresence((state) => {
      if (!userId) return;

      if (state.userPresence[userId]) {
        setPresence({
          ...state.userPresence[userId],
          isOnline: state.userPresence[userId].isOnline || state.onlineUsers.has(userId),
        });
        return;
      }

      // Fallback for initial online snapshot events that only include onlineUsers.
      setPresence((prev) => ({
        ...prev,
        isOnline: state.onlineUsers.has(userId),
      }));
    });

    // Presence can go stale when socket events are missed; keep it synced.
    const interval = window.setInterval(fetchPresence, 20000);
    const handleFocus = () => fetchPresence();
    const handleVisibility = () => {
      if (!document.hidden) fetchPresence();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [userId, fetchPresence]);

  return { ...presence, loading };
};

/**
 * Hook to get list of all online users
 */
export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
      const response = await fetch(`${apiUrl}/users/presence/online`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userIds: Set<string> = new Set(
          (data.data.onlineUsers as Array<{ _id: string }>).map((u) => u._id)
        );
        setOnlineUsers(userIds);
        globalPresenceState.onlineUsers = userIds;
        notifyPresenceUpdate();
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchOnlineUsers]);

  return { onlineUsers, loading };
};

/**
 * Hook to initialize presence tracking via Socket.IO
 */
export const usePresenceTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    try {
      // Try to get socket instance from window
      const socket = (window as any).__socket;
      if (!socket) return;

      // Emit user online event
      socket.emit('userOnline', user._id);

      // Listen for other users coming online/offline
      const handleStatusChange = (data: any) => {
        const { userId, status, lastSeen } = data;
        
        if (status === 'online') {
          globalPresenceState.onlineUsers.add(userId);
        } else {
          globalPresenceState.onlineUsers.delete(userId);
        }

        globalPresenceState.userPresence[userId] = {
          isOnline: status === 'online',
          lastSeen: lastSeen ? new Date(lastSeen) : null
        };

        notifyPresenceUpdate();
      };

      const handleOnlineUsersUpdate = (data: any) => {
        const userIds = new Set(data.onlineUsers as string[]);
        globalPresenceState.onlineUsers = userIds;
        notifyPresenceUpdate();
      };

      socket.on('userStatusChanged', handleStatusChange);
      socket.on('onlineUsersUpdate', handleOnlineUsersUpdate);

      return () => {
        socket.off('userStatusChanged', handleStatusChange);
        socket.off('onlineUsersUpdate', handleOnlineUsersUpdate);
      };
    } catch (error) {
      console.error('Error initializing presence tracking:', error);
    }
  }, [user]);
};

/**
 * Hook to manually update user's presence (call periodically)
 */
export const useUpdatePresence = () => {
  const updatePresence = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
      await fetch(`${apiUrl}/users/presence/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, []);

  // Update presence every 5 minutes
  useEffect(() => {
    updatePresence();
    const interval = setInterval(updatePresence, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [updatePresence]);
};
