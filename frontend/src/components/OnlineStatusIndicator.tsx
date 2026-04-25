import { useState, useEffect } from 'react';
import { formatLastSeen, getPresenceColor, getPresenceTooltip } from '@/utils/presence';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  lastActive?: Date | string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  format?: 'badge' | 'dot' | 'text';
}

export const OnlineStatusIndicator = ({
  isOnline,
  lastActive,
  showLabel = true,
  size = 'md',
  format = 'badge'
}: OnlineStatusIndicatorProps) => {
  const [shouldUpdate, setShouldUpdate] = useState(0);

  // Re-render periodically to update "X minutes ago"
  useEffect(() => {
    if (!isOnline && lastActive) {
      const interval = setInterval(() => {
        setShouldUpdate(prev => prev + 1);
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [isOnline, lastActive]);

  const dotSizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClass = getPresenceColor(isOnline);
  const dotSize = dotSizeMap[size];

  if (format === 'dot') {
    return (
      <div
        className={`${dotSize} ${colorClass} rounded-full`}
        title={getPresenceTooltip(isOnline, lastActive)}
      />
    );
  }

  if (format === 'text') {
    return (
      <span className="text-sm text-gray-600">
        {isOnline ? (
          <span className="text-green-600 font-medium">Online</span>
        ) : (
          <>Last seen {formatLastSeen(lastActive)}</>
        )}
      </span>
    );
  }

  // badge format (default)
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${dotSize} ${colorClass} rounded-full flex-shrink-0`}
        title={getPresenceTooltip(isOnline, lastActive)}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          {isOnline ? (
            <span className="text-green-600">Online</span>
          ) : (
            <span className="text-gray-600">Last seen {formatLastSeen(lastActive)}</span>
          )}
        </span>
      )}
    </div>
  );
};
