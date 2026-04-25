import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSocketNotifications = () => {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Get socket instance stored globally
    const socket = (window as any).__socket;
    if (!socket) return;

    // Listen for admin notifications
    const handleAdminNotification = (notification: any) => {
      console.log('📬 Received admin notification:', notification);

      // Handle job deletion - invalidate job queries
      if (notification.type === 'job_deleted') {
        console.log('🗑️  Job deleted:', notification.jobId);
        
        // Show user notification
        toast({
          title: notification.title || '❌ Job Deleted',
          description: notification.message || 'Your job has been removed from the platform.',
          variant: 'destructive',
        });
        
        // Invalidate all job-related caches to force refresh
        qc.invalidateQueries({ queryKey: ['jobs'] });
        qc.invalidateQueries({ queryKey: ['myJobs'] });
        qc.invalidateQueries({ queryKey: ['jobDetail'] });
        qc.invalidateQueries({ queryKey: ['analytics'] });
        qc.invalidateQueries({ queryKey: ['clientAnalytics'] });
        
        // Refresh the affected data if queries are active
        qc.refetchQueries({ queryKey: ['jobs'], type: 'active' });
        qc.refetchQueries({ queryKey: ['myJobs'], type: 'active' });
      }

      // Handle other notification types as needed
      if (notification.type === 'job_flagged') {
        console.log('🚩 Job flagged:', notification.jobId);
        toast({
          title: notification.title || '🚩 Job Flagged',
          description: notification.message || 'Your job has been flagged for review.',
          variant: 'destructive',
        });
        qc.invalidateQueries({ queryKey: ['jobs'] });
        qc.refetchQueries({ queryKey: ['jobs'], type: 'active' });
      }

      if (notification.type === 'job_featured') {
        console.log('⭐ Job featured:', notification.jobId);
        toast({
          title: notification.title || '⭐ Job Featured',
          description: notification.message || 'Your job has been featured!',
          variant: 'default',
        });
        qc.invalidateQueries({ queryKey: ['jobs'] });
        qc.refetchQueries({ queryKey: ['jobs'], type: 'active' });
      }

      // Handle new escrow/payment and contract moderation events
      if (notification.type === 'payment_held') {
        console.log('⚠️ Payment Held:', notification.contractId);
        toast({
          title: notification.title || '⚠️ Payment Held',
          description: notification.message || 'Payment has been placed on hold.',
          variant: 'destructive',
        });
      }

      if (['payment_unhold', 'payment_released', 'withdrawal_initiated', 'payment_refunded'].includes(notification.type)) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: 'default',
        });
      }

      if (notification.type === 'contract_report') {
        toast({
          title: notification.title || 'Contract Report',
          description: notification.message || 'Contract report activity detected.',
          variant: notification.severity === 'warning' ? 'destructive' : 'default',
        });
      }
    };

    // Listen for global platform settings updates
    const handlePlatformSettings = (data: any) => {
      console.log('⚙️ Platform settings updated:', data.updates);
      const updates = data.updates || {};
      let message = '';
      if ('platformFeePercentage' in updates) message += `Platform fee is now ${updates.platformFeePercentage}%. `;
      if ('maintenanceMode' in updates) message += updates.maintenanceMode ? 'Maintenance Mode enabled. ' : 'Maintenance Mode disabled. ';
      if ('escrowEnabled' in updates) message += updates.escrowEnabled ? 'Escrow payments enabled. ' : 'Escrow payments disabled. ';
      if ('allowNewRegistrations' in updates) message += updates.allowNewRegistrations ? 'Registrations opened. ' : 'Registrations closed. ';
      
      if (message) {
        toast({
          title: '📢 Platform Update',
          description: message,
          variant: 'default'
        });
      }
    };

    // Register the listeners
    socket.on('adminNotification', handleAdminNotification);
    socket.on('platformSettingsUpdated', handlePlatformSettings);

    // Cleanup on unmount
    return () => {
      socket.off('adminNotification', handleAdminNotification);
      socket.off('platformSettingsUpdated', handlePlatformSettings);
    };
  }, [isAuthenticated, qc, toast]);
};
