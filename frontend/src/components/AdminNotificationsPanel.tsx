import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminNotifications, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/lib/notificationsApi';
import { AlertCircle, Trash2, CheckCheck } from 'lucide-react';
import type { IconType } from 'react-icons';
import { FaBell, FaBriefcase, FaFileContract, FaCommentDots, FaMoneyBillWave, FaShieldHalved, FaTriangleExclamation, FaCircleInfo } from 'react-icons/fa6';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  icon: string;
  jobId?: string;
  contractId?: string;
  jobTitle?: string;
  reason?: string;
  isRead: boolean;
  createdAt: string;
}

export function AdminNotificationsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => getAdminNotifications({ limit: 50, unreadOnly: false }),
  });

  const notifications = (data as any)?.data || [];
  const unreadCount = (data as any)?.pagination?.unreadCount || 0;

  const markReadMut = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast({ title: 'Notification deleted' });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'danger':
        return 'bg-red-50 border-l-4 border-l-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-l-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-l-blue-500';
    }
  };

  const getNotificationTarget = (notif: Notification) => {
    const path = location.pathname;
    const contractId = notif.contractId;

    if (notif.type.startsWith('hire_request_') && contractId) {
      if (path.startsWith('/admin')) return `/admin/hiring-requests?contractId=${contractId}`;
      if (path.startsWith('/dashboard/client')) return `/dashboard/client?tab=hiring-requests&contractId=${contractId}`;
      if (path.startsWith('/company-dashboard')) return `/company-dashboard?tab=contracts&contractId=${contractId}`;
      return `/dashboard/freelancer?tab=contracts&contractId=${contractId}`;
    }

    if (contractId) {
      if (path.startsWith('/admin')) return `/admin/contracts/${contractId}`;
      if (path.startsWith('/dashboard/client')) return `/dashboard/client?tab=contracts&contractId=${contractId}`;
      if (path.startsWith('/company-dashboard')) return `/company-dashboard?tab=contracts&contractId=${contractId}`;
      return `/dashboard/freelancer?tab=contracts&contractId=${contractId}`;
    }

    if (notif.jobId && path.startsWith('/admin')) {
      return '/admin/jobs';
    }

    return null;
  };

  const getNotificationIcon = (notif: Notification): IconType => {
    const text = `${notif.type} ${notif.title} ${notif.message}`.toLowerCase();

    if (text.includes('hire request') || text.includes('hire_request')) return FaBriefcase;
    if (text.includes('contract')) return FaFileContract;
    if (text.includes('message') || text.includes('chat')) return FaCommentDots;
    if (text.includes('payment') || text.includes('invoice') || text.includes('payout') || text.includes('withdrawal') || text.includes('withdraw')) return FaMoneyBillWave;
    if (text.includes('verify') || text.includes('security') || text.includes('admin')) return FaShieldHalved;

    switch (notif.severity) {
      case 'danger':
        return FaTriangleExclamation;
      case 'warning':
        return FaBell;
      default:
        return FaCircleInfo;
    }
  };

  const cleanNotificationTitle = (title: string) => {
    const cleaned = title
      .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '')
      .trim();
    return cleaned || title;
  };

  const handleOpenNotification = (notif: Notification) => {
    const target = getNotificationTarget(notif);
    if (!target) return;

    if (!notif.isRead) {
      markReadMut.mutate(notif._id);
    }

    navigate(target);
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-gray-600 font-medium mb-1">No notifications</h3>
        <p className="text-gray-500 text-sm">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with mark all as read */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Admin Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMut.mutate()}
            disabled={markAllReadMut.isPending}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            <CheckCheck size={14} className="inline mr-1" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.map((notif: Notification) => {
          const NotificationIcon = getNotificationIcon(notif);
          return (
          <div
            key={notif._id}
            className={`p-4 rounded-lg ${getSeverityColor(notif.severity)} ${
              notif.isRead ? 'opacity-75' : 'shadow-md'
            } ${getNotificationTarget(notif) ? 'cursor-pointer hover:brightness-[0.98]' : ''}`}
            onClick={() => handleOpenNotification(notif)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <NotificationIcon className="w-4 h-4 text-gray-700 flex-shrink-0" aria-hidden="true" />
                  <h3 className="font-semibold text-gray-900">{cleanNotificationTitle(notif.title)}</h3>
                  {!notif.isRead && (
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                {notif.reason && (
                  <p className="text-xs text-gray-600 italic">
                    Reason: {notif.reason}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-shrink-0">
                {!notif.isRead && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markReadMut.mutate(notif._id); }}
                    disabled={markReadMut.isPending}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                    title="Mark as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMut.mutate(notif._id); }}
                  disabled={deleteMut.isPending}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Pagination info */}
      {notifications.length > 0 && (
        <p className="text-xs text-gray-500 text-center mt-4">
          Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
