import { useState, useEffect } from 'react';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { useUserPresence } from '@/hooks/usePresence';

interface UserPresenceColumnProps {
  userId: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Component to display user presence in table/list views
 * Used in admin dashboard, user lists, etc.
 */
export const UserPresenceColumn = ({
  userId,
  showLabel = true,
  size = 'md'
}: UserPresenceColumnProps) => {
  const { isOnline, lastSeen } = useUserPresence(userId);

  return (
    <div className="flex items-center gap-2">
      <OnlineStatusIndicator
        isOnline={isOnline}
        lastActive={lastSeen}
        showLabel={showLabel}
        size={size}
        format="badge"
      />
    </div>
  );
};

/**
 * Compact presence dot for inline display
 */
export const PresenceDot = ({ userId, size = 'md' }: { userId: string; size?: 'sm' | 'md' | 'lg' }) => {
  const { isOnline, lastSeen } = useUserPresence(userId);

  return (
    <OnlineStatusIndicator
      isOnline={isOnline}
      lastActive={lastSeen}
      showLabel={false}
      size={size}
      format="dot"
    />
  );
};
