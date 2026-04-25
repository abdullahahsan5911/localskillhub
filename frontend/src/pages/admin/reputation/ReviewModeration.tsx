import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminReviews, deleteReview, flagReview } from '@/lib/adminApi';
import { Trash2, Flag, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resolveAvatarSrc } from '@/lib/avatar';

function ReasonModal({ title, onConfirm, onClose }: { title: string; onConfirm: (r: string) => void; onClose: () => void }) {
  const [r, setR] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-gray-900 font-bold mb-3">{title}</h3>
        <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3} placeholder="Reason..." value={r} onChange={e => setR(e.target.value)} />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:text-gray-900">Cancel</button>
          <button onClick={() => r.trim() && onConfirm(r)} disabled={!r.trim()} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-500">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
      ))}
    </div>
  );
}

export default function ReviewModeration() {
  const [isFlagged, setIsFlagged] = useState<string>('false');
  const [modal, setModal] = useState<null | { type: string; id: string }>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', isFlagged],
    queryFn: () => fetchAdminReviews({ isFlagged: isFlagged === 'all' ? undefined : isFlagged }),
  });

  const opts = { onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); setModal(null); toast({ title: 'Done' }); } };
  const deleteMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteReview(id, reason), ...opts });
  const flagMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => flagReview(id, reason), ...opts });

  const handleConfirm = (reason: string) => {
    if (!modal) return;
    if (modal.type === 'delete') deleteMut.mutate({ id: modal.id, reason });
    if (modal.type === 'flag') flagMut.mutate({ id: modal.id, reason });
  };

  return (
    <div className="space-y-5">
      {modal && (
        <ReasonModal title={modal.type === 'delete' ? '🗑 Delete Review' : '🚩 Flag Review'} onConfirm={handleConfirm} onClose={() => setModal(null)} />
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-600 text-sm">Delete fake reviews and flag abusive content</p>
      </div>

      <div className="flex gap-2">
        {[{ v: 'false', l: 'All Reviews' }, { v: 'true', l: 'Flagged' }, { v: 'all', l: 'Everything' }].map(({ v, l }) => (
          <button key={v} onClick={() => setIsFlagged(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${isFlagged === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'}`}>{l}</button>
        ))}
      </div>

      <div className="grid gap-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />) :
          (data?.data || []).map((review: Record<string, unknown>) => {
            const reviewer = review.reviewerId as Record<string, unknown>;
            const reviewed = review.reviewedUserId as Record<string, unknown>;
            const rating = review.rating as Record<string, unknown>;
            return (
              <div key={review._id as string} className={`bg-white border rounded-xl p-5 ${review.isFlagged ? 'border-red-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={resolveAvatarSrc(reviewer?.avatar as string)} alt="" className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-gray-900 text-sm font-medium">{reviewer?.name as string} → <span className="text-blue-600">{reviewed?.name as string}</span></p>
                        <Stars rating={rating?.overall as number || 0} />
                      </div>
                      {review.isFlagged && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded">🚩 Flagged</span>}
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-3">{review.reviewText as string}</p>
                    {(review.flagReason as string) && <p className="text-red-600 text-xs mt-1">Flag reason: {review.flagReason as string}</p>}
                    <p className="text-gray-500 text-xs mt-2">{new Date(review.createdAt as string).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!review.isFlagged && (
                      <button onClick={() => setModal({ type: 'flag', id: review._id as string })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-lg text-xs">
                        <Flag size={12} /> Flag
                      </button>
                    )}
                    <button onClick={() => setModal({ type: 'delete', id: review._id as string })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
