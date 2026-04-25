import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDisputes, resolveDispute } from '@/lib/adminApi';
import { Link, useSearchParams } from 'react-router-dom';
import { Scale, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  open: 'text-red-600 bg-red-50', under_review: 'text-amber-600 bg-amber-50',
  resolved: 'text-blue-600 bg-blue-50', closed: 'text-gray-600 bg-gray-100'
};

function ResolveModal({ disputeId, onClose, onDone }: { disputeId: string; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState('full_release');
  const [fAmount, setFAmount] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => resolveDispute(disputeId, {
      resolutionType: type,
      freelancerAmount: fAmount ? parseFloat(fAmount) : undefined,
      clientAmount: cAmount ? parseFloat(cAmount) : undefined,
      notes, reason
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-disputes'] }); toast({ title: 'Dispute resolved' }); onDone(); },
    onError: () => toast({ title: 'Error', variant: 'destructive' })
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg mx-4">
        <h3 className="text-gray-900 font-bold text-lg mb-4">⚖️ Resolve Dispute</h3>

        <div className="space-y-4">
          <div>
            <label className="text-gray-700 text-sm mb-2 block">Resolution Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'full_release', label: '✅ Full Release', sub: 'To Freelancer' },
                { value: 'full_refund', label: '💸 Full Refund', sub: 'To Client' },
                { value: 'partial_split', label: '✂️ Partial Split', sub: 'Both parties' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setType(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${type === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <p className="text-gray-900 text-sm font-medium">{opt.label}</p>
                  <p className="text-gray-600 text-xs">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {type === 'partial_split' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-700 text-xs mb-1 block">Freelancer Amount</label>
                <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500" placeholder="0.00" />
              </div>
              <div>
                <label className="text-gray-700 text-xs mb-1 block">Client Amount</label>
                <input type="number" value={cAmount} onChange={e => setCAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500" placeholder="0.00" />
              </div>
            </div>
          )}

          <div>
            <label className="text-gray-700 text-xs mb-1 block">Admin Reason (required)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Why are you resolving this way?" />
          </div>
          <div>
            <label className="text-gray-700 text-xs mb-1 block">Notes for parties (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Message to freelancer and client..." />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={!reason.trim() || mut.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-40">
            {mut.isPending ? 'Processing...' : 'Resolve Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DisputeResolution() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resolving, setResolving] = useState<string | null>(null);
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const sp = (key: string, val: string) => { const p = new URLSearchParams(searchParams); val ? p.set(key, val) : p.delete(key); p.set('page', '1'); setSearchParams(p); };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', page, status],
    queryFn: () => fetchDisputes({ page, limit: 20, status: status || undefined }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-5">
      {resolving && <ResolveModal disputeId={resolving} onClose={() => setResolving(null)} onDone={() => setResolving(null)} />}

      <div>
        <h1 className="text-xl font-bold text-gray-900">Dispute Resolution</h1>
        <p className="text-gray-600 text-sm">Review and resolve contract disputes</p>
      </div>

      <div className="flex gap-2">
        {['', 'open', 'under_review', 'resolved'].map(s => (
          <button key={s} onClick={() => sp('status', s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${status === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />) :
          (data?.data || []).map((d: Record<string, unknown>) => {
            const contract = d.contractId as Record<string, unknown>;
            const raisedBy = d.raisedBy as Record<string, unknown>;
            return (
              <div key={d._id as string} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[d.status as string]}`}>{(d.status as string)?.replace('_', ' ')}</span>
                      <span className="text-gray-600 text-sm">Contract: <span className="text-gray-900">{(contract?.title as string) || 'Unknown'}</span></span>
                    </div>
                    <p className="text-gray-700 text-sm mb-1">
                      Raised by: <span className="text-gray-900 font-medium">{raisedBy?.name as string}</span>
                      <span className="text-gray-600 ml-2">({d.raisedByRole as string})</span>
                    </p>
                    <p className="text-gray-600 text-sm line-clamp-2">{d.reason as string}</p>
                    <p className="text-gray-500 text-xs mt-1">{new Date(d.createdAt as string).toLocaleString()}</p>
                    {d.resolution && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                        <p className="text-blue-600 text-xs font-medium">Resolved: {(d.resolution as Record<string, unknown>).type as string}</p>
                        {(d.resolution as Record<string, unknown>).notes && <p className="text-gray-600 text-xs">{(d.resolution as Record<string, unknown>).notes as string}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link to={`/admin/disputes/${d._id}`} className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-300">View Detail</Link>
                    {['open', 'under_review'].includes(d.status as string) && (
                      <button onClick={() => setResolving(d._id as string)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors">
                        <Scale size={13} /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        {!isLoading && (data?.data || []).length === 0 && (
          <div className="text-center py-16 text-gray-600"><Scale size={32} className="mx-auto mb-2 text-blue-600" />No disputes found</div>
        )}
      </div>

      {data?.pagination && (
        <div className="flex justify-end gap-2">
          <button disabled={page <= 1} onClick={() => sp('page', String(page - 1))} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 disabled:opacity-30"><ChevronLeft size={16} /></button>
          <button disabled={page >= data.pagination.pages} onClick={() => sp('page', String(page + 1))} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
