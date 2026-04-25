import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, MessageSquare, User, ChevronLeft, ChevronRight, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { resolveAvatarSrc } from '@/lib/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AppealData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  banDate: string;
  banReason: string;
  appealMessage: string;
  status: 'pending' | 'approved' | 'rejected' | 'reopen';
  createdAt: string;
  reviewedAt?: string;
  adminReview?: string;
  reviewedBy?: { name: string };
}

interface PaginationData {
  total: number;
  page: number;
  pages: number;
  pendingCount: number;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:  { label: 'Pending',    icon: Clock,        badge: 'bg-amber-50 text-amber-700 border border-amber-200',   dot: 'bg-amber-400'  },
  approved: { label: 'Approved',   icon: CheckCircle,  badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected',   icon: XCircle,      badge: 'bg-red-50 text-red-700 border border-red-200',         dot: 'bg-red-400'    },
  reopen:   { label: 'Can Reopen', icon: AlertCircle,  badge: 'bg-blue-50 text-blue-700 border border-blue-200',      dot: 'bg-blue-400'   },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
function FilterTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      {(['pending', 'approved', 'rejected', 'reopen'] as const).map((s) => {
        const isActive = active === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

// ─── Meta Pill ────────────────────────────────────────────────────────────────
function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[11px] text-slate-500">
      <span className="font-medium text-slate-600">{label}:</span> {value}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AppealsList() {
  const { toast } = useToast();
  const [appeals, setAppeals] = useState<AppealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<AppealData | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewMessage, setReviewMessage] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const fetchAppeals = async (pageNum: number, status: string) => {
    try {
      setLoading(true);
      const response = await api.getAllBanAppeals({ page: pageNum, limit: 20, status: status || undefined });
      setAppeals((response as any).data || []);
      setPagination((response as any).pagination);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      toast({ title: 'Error', description: 'Failed to load appeals', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppeals(page, statusFilter); }, [page, statusFilter]);

  const handleReviewClick = (appeal: AppealData) => {
    setSelectedAppeal(appeal);
    setReviewDecision('approved');
    setReviewMessage('');
    setShowReviewDialog(true);
  };

  const submitReview = async () => {
    if (!selectedAppeal) return;
    try {
      setReviewing(true);
      await api.reviewBanAppeal(selectedAppeal._id, reviewDecision, reviewMessage);
      toast({ title: 'Success', description: `Appeal ${reviewDecision} successfully` });
      setShowReviewDialog(false);
      setSelectedAppeal(null);
      fetchAppeals(page, statusFilter);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to review appeal', variant: 'destructive' });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-end justify-between pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ban Appeals</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review and manage user ban appeal requests</p>
        </div>
        {pagination && (
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{pagination.pendingCount}</p>
            <p className="text-xs text-slate-400 font-medium">pending appeals</p>
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <FilterTabs
        active={statusFilter}
        onChange={(s) => { setStatusFilter(s); setPage(1); }}
      />

      {/* ── List ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-36 bg-slate-100 rounded-full" />
                    <div className="h-3 w-48 bg-slate-100 rounded-full" />
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full mb-2" />
                <div className="h-3 w-3/4 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : appeals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3">
              <ShieldOff size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No {statusFilter} appeals</p>
            <p className="text-xs text-slate-400 mt-1">Appeals with this status will appear here.</p>
          </div>
        ) : (
          appeals.map((appeal) => (
            <div
              key={appeal._id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 p-5 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={resolveAvatarSrc(appeal.userId.avatar)} alt={appeal.userId.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{appeal.userId.name}</p>
                    <p className="text-xs text-slate-400 truncate">{appeal.userId.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={appeal.status} />
                  {appeal.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleReviewClick(appeal)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-lg px-3"
                    >
                      Review Appeal
                    </Button>
                  )}
                  {appeal.status === 'rejected' && (
                    <Button variant="outline" disabled className="text-[11px] rounded-lg px-3 border-slate-200 text-slate-400">
                      Can reopen in 30 days
                    </Button>
                  )}
                </div>
              </div>

              {/* Content blocks */}
              <div className="px-5 pb-5 space-y-3">
                {/* Ban Reason */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Ban Reason</p>
                  <p className="text-sm text-slate-700">{appeal.banReason}</p>
                </div>

                {/* Appeal Message */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <MessageSquare size={10} /> Appeal Message
                  </p>
                  <p className="text-sm text-slate-700">{appeal.appealMessage}</p>
                </div>

                {/* Admin Review (if present) */}
                {appeal.adminReview && (
                  <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Admin Review{appeal.reviewedBy ? ` · ${appeal.reviewedBy.name}` : ''}
                    </p>
                    <p className="text-sm text-slate-700">{appeal.adminReview}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="flex flex-wrap gap-4 pt-1">
                  <MetaPill label="Banned" value={new Date(appeal.banDate).toLocaleDateString()} />
                  <MetaPill label="Appealed" value={new Date(appeal.createdAt).toLocaleDateString()} />
                  {appeal.reviewedAt && (
                    <MetaPill label="Reviewed" value={new Date(appeal.reviewedAt).toLocaleDateString()} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Review Dialog ── */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Review Ban Appeal</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {selectedAppeal?.userId.name} is appealing their account ban
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            {/* Appeal preview */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1">Their Message</p>
              <p className="text-sm text-slate-700">{selectedAppeal?.appealMessage}</p>
            </div>

            {/* Decision buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setReviewDecision('approved')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                    reviewDecision === 'approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                      : 'bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'
                  }`}
                >
                  <CheckCircle size={15} /> Approve
                </button>
                <button
                  onClick={() => setReviewDecision('rejected')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                    reviewDecision === 'rejected'
                      ? 'bg-red-50 text-red-800 border-red-400'
                      : 'bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'
                  }`}
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </div>

            {/* Review message */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Admin Review Message</label>
              <textarea
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                placeholder={
                  reviewDecision === 'approved'
                    ? 'Explain why the appeal was approved…'
                    : 'Explain why the appeal was rejected…'
                }
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                disabled={reviewing}
                className="rounded-xl text-sm border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={reviewing || !reviewMessage.trim()}
                className={`rounded-xl text-sm font-semibold ${
                  reviewDecision === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {reviewing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  `${reviewDecision === 'approved' ? 'Approve' : 'Reject'} Appeal`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}