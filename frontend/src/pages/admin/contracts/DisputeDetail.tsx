import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDisputeDetail, resolveDispute } from '@/lib/adminApi';
import { ChevronLeft, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  open: 'text-red-600 bg-red-50',
  under_review: 'text-amber-600 bg-amber-50',
  resolved: 'text-blue-600 bg-blue-50',
  closed: 'text-gray-600 bg-gray-100',
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-dispute', disputeId] }); toast({ title: 'Dispute resolved ✓' }); onDone(); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
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
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:text-gray-900 transition-colors">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={!reason.trim() || mut.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-40">
            {mut.isPending ? 'Processing...' : 'Resolve Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resolving, setResolving] = useState(false);

  const { data: dispute, isLoading, error } = useQuery({
    queryKey: ['admin-dispute', id],
    queryFn: () => fetchDisputeDetail(id!),
    enabled: !!id,
  }) as { data: Record<string, unknown> | undefined; isLoading: boolean; error: unknown };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-gray-300 text-gray-600"><ChevronLeft size={18} /></button>
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p className="mb-4">Dispute not found.</p>
        <Link to="/admin/disputes" className="text-blue-600 hover:underline">← Back to Disputes</Link>
      </div>
    );
  }

  const contract = dispute.contractId as Record<string, unknown>;
  const raisedBy = dispute.raisedBy as Record<string, unknown>;
  const resolution = dispute.resolution as Record<string, unknown> | null;
  const status = dispute.status as string;
  const canResolve = ['open', 'under_review'].includes(status);

  return (
    <div className="space-y-5">
      {resolving && id && (
        <ResolveModal disputeId={id} onClose={() => setResolving(false)} onDone={() => setResolving(false)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dispute Detail</h1>
            <p className="text-gray-600 text-xs">ID: {id}</p>
          </div>
        </div>
        {canResolve && (
          <button onClick={() => setResolving(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
            <Scale size={15} /> Resolve Dispute
          </button>
        )}
      </div>

      {/* Overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <p className="text-gray-600 text-xs mb-1">Status</p>
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[status] || 'text-gray-600 bg-gray-100'}`}>
              {status?.replace('_', ' ')}
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Contract</p>
            {contract?._id ? (
              <Link to={`/admin/contracts/${contract._id}`} className="text-blue-600 hover:text-blue-700 text-sm">{(contract?.title as string) || 'View Contract'}</Link>
            ) : <p className="text-gray-600 text-sm">N/A</p>}
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Raised By</p>
            <Link to={`/admin/users/${raisedBy?._id}`} className="text-blue-600 hover:text-blue-700 text-sm">
              {raisedBy?.name as string} <span className="text-gray-600 text-xs">({dispute.raisedByRole as string})</span>
            </Link>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Submitted</p>
            <p className="text-gray-700 text-sm">{new Date(dispute.createdAt as string).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-gray-900 font-semibold text-sm mb-2">Dispute Reason</h2>
        <p className="text-gray-700 text-sm leading-relaxed">{dispute.reason as string}</p>
        {(dispute.description as string) && (
          <p className="text-gray-600 text-sm mt-2 leading-relaxed">{dispute.description as string}</p>
        )}
      </div>

      {/* Payment Location Info */}
      {!resolution && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
          <h2 className="text-amber-900 font-semibold text-sm mb-3 flex items-center gap-2">💰 Payment Location During Dispute</h2>
          <div className="space-y-2 text-sm text-amber-800">
            <p><span className="font-semibold">Location:</span> <span className="text-amber-900 font-bold">🔒 Frozen in Escrow</span></p>
            <p><span className="font-semibold">Amount:</span> {(contract as Record<string, unknown>)?.amount ? `${(contract as Record<string, unknown>).amount as string}` : 'View contract for details'}</p>
            <p className="text-amber-700 text-xs">The payment is securely held in escrow and will be released according to the resolution type:</p>
            <ul className="list-disc list-inside text-xs text-amber-700 mt-2 ml-1 space-y-1">
              <li><span className="font-semibold">Full Release:</span> Funds → Freelancer</li>
              <li><span className="font-semibold">Full Refund:</span> Funds → Client</li>
              <li><span className="font-semibold">Partial Split:</span> Split → Both parties</li>
            </ul>
          </div>
        </div>
      )}

      {/* Resolution */}
      {resolution && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h2 className="text-blue-600 font-semibold text-sm mb-3 flex items-center gap-2"><Scale size={14} /> Resolution</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-600 text-xs mb-1">Type</p><p className="text-gray-900 font-medium capitalize">{(resolution.type as string)?.replace('_', ' ')}</p></div>
            {(resolution.freelancerAmount as number) !== undefined && (
              <div><p className="text-gray-600 text-xs mb-1">Freelancer Amount</p><p className="text-gray-900 font-mono font-semibold">${(resolution.freelancerAmount as number).toLocaleString()}</p></div>
            )}
            {(resolution.clientAmount as number) !== undefined && (
              <div><p className="text-gray-600 text-xs mb-1">Client Refund</p><p className="text-gray-900 font-mono font-semibold">${(resolution.clientAmount as number).toLocaleString()}</p></div>
            )}
            <div><p className="text-gray-600 text-xs mb-1">Resolved At</p><p className="text-gray-900 text-sm">{resolution.resolvedAt ? new Date(resolution.resolvedAt as string).toLocaleString() : 'N/A'}</p></div>
          </div>
          {(resolution.notes as string) && (
            <>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-gray-600 text-xs mb-1">Admin Notes</p>
                <p className="text-gray-700 text-sm leading-relaxed">{resolution.notes as string}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
