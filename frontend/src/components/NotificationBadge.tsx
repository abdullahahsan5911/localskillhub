import { useQuery } from '@tanstack/react-query';
import { getAdminNotifications } from '@/lib/notificationsApi';
import { AlertCircle } from 'lucide-react';

export function NotificationBadge() {
  const { data } = useQuery({
    queryKey: ['admin-notifications-unread'],
    queryFn: () => getAdminNotifications({ unreadOnly: true }),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time feel
  });

  const unreadCount = (data as any)?.pagination?.unreadCount || 0;

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <AlertCircle size={20} className="text-gray-700" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-fit">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </div>
  );
}
