import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '@/lib/adminApi';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  BAN_USER: 'bg-red-50 text-red-600', UNBAN_USER: 'bg-blue-50 text-blue-600',
  SUSPEND_USER: 'bg-orange-50 text-orange-600', WARN_USER: 'bg-amber-50 text-amber-600',
  APPROVE_VERIFICATION: 'bg-blue-50 text-blue-600', REJECT_VERIFICATION: 'bg-red-50 text-red-600',
  FLAG_JOB: 'bg-amber-50 text-amber-600', DELETE_JOB: 'bg-red-50 text-red-600',
  FORCE_RELEASE_ESCROW: 'bg-blue-50 text-blue-600', REFUND_CLIENT: 'bg-orange-50 text-orange-600',
  FREEZE_CONTRACT: 'bg-red-50 text-red-600', RESOLVE_DISPUTE: 'bg-blue-50 text-blue-600',
  DELETE_REVIEW: 'bg-red-50 text-red-600', ADJUST_REPUTATION_SCORE: 'bg-purple-50 text-purple-600',
  DELETE_COMMUNITY: 'bg-red-50 text-red-600', SUSPEND_COMMUNITY: 'bg-amber-50 text-amber-600',
  UPDATE_SETTINGS: 'bg-blue-50 text-blue-600',
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin-logs', page, actionType],
    queryFn: () => fetchAuditLogs({ page, limit: 30, actionType: actionType || undefined }),
    placeholderData: (prev) => prev,
  });
  const data = queryData as { data: Record<string, unknown>[]; pagination: { total: number; pages: number } } | undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 text-sm">Complete trail of all admin actions for accountability</p>
      </div>

      <div className="flex gap-3">
        <select value={actionType} onChange={e => { setActionType(e.target.value); setPage(1); }}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500">
          <option value="">All Actions</option>
          <option value="BAN_USER">Ban User</option>
          <option value="UNBAN_USER">Unban User</option>
          <option value="SUSPEND_USER">Suspend User</option>
          <option value="APPROVE_VERIFICATION">Approve Verification</option>
          <option value="REJECT_VERIFICATION">Reject Verification</option>
          <option value="FLAG_JOB">Flag Job</option>
          <option value="DELETE_JOB">Delete Job</option>
          <option value="FORCE_RELEASE_ESCROW">Release Escrow</option>
          <option value="REFUND_CLIENT">Refund</option>
          <option value="FREEZE_CONTRACT">Freeze Contract</option>
          <option value="RESOLVE_DISPUTE">Resolve Dispute</option>
          <option value="DELETE_REVIEW">Delete Review</option>
          <option value="ADJUST_REPUTATION_SCORE">Adjust Score</option>
          <option value="UPDATE_SETTINGS">Update Settings</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-200">
          {isLoading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-4">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
            </div>
          )) : (data?.data || []).map((log: Record<string, unknown>) => {
            const admin = log.adminId as Record<string, unknown>;
            const meta = log.metadata as Record<string, unknown>;
            const colorClass = ACTION_COLORS[log.actionType as string] || 'bg-gray-100 text-gray-600';
            return (
              <div key={log._id as string} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                    {(log.actionType as string)?.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <span>by <span className="text-gray-900">{admin?.name as string || 'Admin'}</span></span>
                      <span>·</span>
                      <span>{log.targetType as string} {log.targetId as string}</span>
                    </div>
                    {(log.reason as string) && (
                      <p className="text-gray-700 text-sm">Reason: {log.reason as string}</p>
                    )}
                    {meta && Object.keys(meta).length > 0 && (
                      <p className="text-gray-600 text-xs mt-0.5 font-mono">{JSON.stringify(meta)}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-gray-600 text-xs">{new Date(log.createdAt as string).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
          {!isLoading && (data?.data || []).length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <ScrollText size={32} className="mx-auto mb-2 text-gray-400" />
              No audit logs found
            </div>
          )}
        </div>

        {data?.pagination && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
            <p className="text-gray-600 text-sm">Total: {data.pagination.total} entries</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
