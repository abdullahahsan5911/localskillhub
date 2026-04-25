import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContractDetail, fetchContractEarnings, forceReleaseEscrow, refundClient, freezeContract, holdEscrow, unholdEscrow, type AdminContractDetail, type AdminContractReport } from '@/lib/adminApi';
import { ChevronLeft, Lock, DollarSign, AlertTriangle, Flag, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  active: 'text-blue-600 bg-blue-50',
  completed: 'text-gray-600 bg-gray-100',
  disputed: 'text-red-600 bg-red-50',
  cancelled: 'text-orange-600 bg-orange-50',
  draft: 'text-amber-600 bg-amber-50',
};
const PAY_COLORS: Record<string, string> = {
  escrow: 'text-blue-600 bg-blue-50',
  released: 'text-blue-600 bg-blue-50',
  refunded: 'text-orange-600 bg-orange-50',
  pending: 'text-amber-600 bg-amber-50',
  disputed: 'text-red-600 bg-red-50',
};

function ActionModal({ title, onConfirm, onClose, confirmLabel, confirmClass }: {
  title: string; onConfirm: (r: string) => void; onClose: () => void; confirmLabel: string; confirmClass: string;
}) {
  const [r, setR] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-gray-900 font-bold mb-1">{title}</h3>
        <div className="flex items-start gap-2 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Lock size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-700 text-xs">This action is irreversible and will be logged in the audit trail.</p>
        </div>
        <textarea className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3} placeholder="Reason (required)..." value={r} onChange={e => setR(e.target.value)} />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:text-gray-900 transition-colors">Cancel</button>
          <button onClick={() => r.trim() && onConfirm(r)} disabled={!r.trim()} className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState<null | string>(null);

  const invalidateContractQueries = () => {
    qc.invalidateQueries({ queryKey: ['admin-contract', id] });
    qc.invalidateQueries({ queryKey: ['contract-earnings', id] });
    qc.invalidateQueries({ queryKey: ['admin-contracts'] });
  };

  const { data: contractData, isLoading, error } = useQuery<AdminContractDetail>({
    queryKey: ['admin-contract', id],
    queryFn: () => fetchContractDetail(id!),
    enabled: !!id,
  });

  const { data: earningsData } = useQuery({
    queryKey: ['contract-earnings', id],
    queryFn: () => fetchContractEarnings(id!),
    enabled: !!id,
  }) as { data: { contract: unknown; earnings: any } | undefined };

  const mutOpts = {
    onSuccess: () => { invalidateContractQueries(); setModal(null); toast({ title: 'Done ✓' }); },
    onError: (e: unknown) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }),
  };

  const releaseMut = useMutation({ mutationFn: (r: string) => forceReleaseEscrow(id!, r), ...mutOpts });
  const refundMut = useMutation({ mutationFn: (r: string) => refundClient(id!, r), ...mutOpts });
  const freezeMut = useMutation({ mutationFn: (r: string) => freezeContract(id!, r), ...mutOpts });
  const holdMut = useMutation({ mutationFn: (r: string) => holdEscrow(id!, r), ...mutOpts });
  const unholdMut = useMutation({ mutationFn: () => unholdEscrow(id!), ...mutOpts });

  const handleModalConfirm = (reason: string) => {
    if (modal === 'release') releaseMut.mutate(reason);
    if (modal === 'refund') refundMut.mutate(reason);
    if (modal === 'freeze') freezeMut.mutate(reason);
    if (modal === 'hold') holdMut.mutate(reason);
  };

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

  const contract = contractData?.contract;

  if (error || !contract) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p className="mb-4">Contract not found.</p>
        <Link to="/admin/contracts" className="text-blue-600 hover:underline">← Back to Contracts</Link>
      </div>
    );
  }

  const client = contract.clientId as Record<string, unknown>;
  const freelancer = contract.freelancerId as Record<string, unknown>;
  const amount = contract.amount as Record<string, unknown>;
  const milestones = (contract.milestones as Record<string, unknown>[]) || [];
  const reports = (contract.reports as AdminContractReport[]) || [];

  return (
    <div className="space-y-5">
      {modal && (
        <ActionModal
          title={modal === 'release' ? '✅ Force Release Escrow' : modal === 'refund' ? '💸 Refund Client' : modal === 'hold' ? '⚠️ Hold Payment' : '🧊 Freeze Contract'}
          confirmLabel={modal === 'release' ? 'Release to Freelancer' : modal === 'refund' ? 'Refund Client' : modal === 'hold' ? 'Hold Payment' : 'Freeze Contract'}
          confirmClass={modal === 'release' ? 'bg-emerald-600 hover:bg-emerald-500' : modal === 'refund' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-red-600 hover:bg-red-500'}
          onConfirm={handleModalConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{contract.title as string}</h1>
          <p className="text-gray-600 text-xs">Contract ID: {id}</p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
      
          <div>
            <p className="text-gray-600 text-xs mb-1">Client</p>
            <Link to={`/admin/users/${client?._id}`} className="text-blue-600 hover:text-blue-700 text-sm">{client?.name as string}</Link>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Freelancer</p>
            <Link to={`/admin/users/${freelancer?._id}`} className="text-blue-600 hover:text-blue-700 text-sm">{freelancer?.name as string}</Link>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Created</p>
            <p className="text-gray-700 text-sm">{new Date(contract.createdAt as string).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Payment & Earnings */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <h2 className="text-gray-900 font-semibold text-sm">💰 Financial Details</h2>
        
        {/* Financial Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {earningsData?.earnings ? (
            <>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-gray-600 text-xs mb-1 font-medium">Job Price</p>
                <p className="text-gray-900 text-sm font-bold">{earningsData.earnings.currency} {earningsData.earnings.contractAmount?.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-gray-600 text-xs mb-1 font-medium">Charged to Client</p>
                <p className="text-gray-900 text-sm font-bold">{earningsData.earnings.currency} {earningsData.earnings.clientTotal?.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <p className="text-gray-600 text-xs mb-1 font-medium">Platform Fee</p>
                <div className='flex justify-between'>
                <p className="text-gray-900 text-sm font-bold">{earningsData.earnings.currency} {earningsData.earnings.platformFeeAmount?.toLocaleString()}</p>
                <p className="text-gray-900 text-sm font-bold">{earningsData.earnings.platformFeePercentage || 0}%</p>
             </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p className="text-gray-600 text-xs mb-1 font-medium">Freelancer Net</p>
                <p className="text-gray-900 text-sm font-bold">{earningsData.earnings.currency} {earningsData.earnings.freelancerNetAmount?.toLocaleString()}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-100 rounded-lg p-3 h-16 animate-pulse" />
              <div className="bg-gray-100 rounded-lg p-3 h-16 animate-pulse" />
              <div className="bg-gray-100 rounded-lg p-3 h-16 animate-pulse" />
              <div className="bg-gray-100 rounded-lg p-3 h-16 animate-pulse" />
            </>
          )}
        </div>

        {/* Detailed Breakdown */}
        {earningsData?.earnings && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-gray-700 text-xs font-semibold uppercase tracking-wide">Payment Breakdown</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Job Price:</span>
                <span className="text-gray-900 font-mono font-semibold">{earningsData.earnings.currency} {earningsData.earnings.contractAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Stripe Processing Fee:</span>
                <span className="text-red-600 font-mono font-semibold">- {earningsData.earnings.currency} {earningsData.earnings.stripeProcessingFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Platform Fee ({earningsData.earnings.platformFeePercentage}%):</span>
                <span className="text-emerald-600 font-mono font-semibold">- {earningsData.earnings.currency} {earningsData.earnings.platformFeeAmount?.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-gray-900">Freelancer Net:</span>
                <span className="text-emerald-700 font-mono text-base">{earningsData.earnings.currency} {earningsData.earnings.freelancerNetAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {earningsData?.earnings && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600 text-xs mb-1">Payment Status</p>
              <span className={`px-2 py-1 rounded text-xs font-semibold capitalize inline-block ${
                earningsData.earnings.paymentStatus === 'escrow' ? 'bg-blue-100 text-blue-700' :
                earningsData.earnings.paymentStatus === 'released' ? 'bg-emerald-100 text-emerald-700' :
                earningsData.earnings.paymentStatus === 'disputed' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>{earningsData.earnings.paymentStatus}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-600 text-xs mb-1">Transaction Status</p>
              <span className={`px-2 py-1 rounded text-xs font-semibold capitalize inline-block ${
                earningsData.earnings.transactionStatus === 'held' ? 'bg-amber-100 text-amber-700' :
                earningsData.earnings.transactionStatus === 'released' ? 'bg-emerald-100 text-emerald-700' :
                earningsData.earnings.transactionStatus === 'refunded' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>{earningsData.earnings.transactionStatus}</span>
            </div>
            {earningsData.earnings.stripeChargeId && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2 sm:col-span-1">
                <p className="text-gray-600 text-xs mb-1">Stripe ID</p>
                <a href={`https://dashboard.stripe.com/charges/${earningsData.earnings.stripeChargeId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-xs font-mono truncate block">
                  {earningsData.earnings.stripeChargeId.slice(0, 20)}...
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Alerts */}
      {(contract.isHeldByAdmin || contract.paymentStatus === 'disputed') && (
        <div className="space-y-3">
          {contract.isHeldByAdmin && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-900 font-semibold text-sm">⚠️ Payment Held by Admin</p>
                <p className="text-red-700 text-xs mt-1">{(contract as any).holdReason}</p>
              </div>
            </div>
          )}
          {contract.paymentStatus === 'disputed' && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-red-900 font-semibold text-sm">⚖️ Contract Under Dispute</p>
                  <p className="text-red-700 text-xs mt-1">Payment Location: <span className="font-bold text-red-700">🔒 Frozen in Escrow</span></p>
                  <p className="text-red-700 text-xs mt-1">Amount Frozen: {amount?.currency as string} {(amount?.total as number)?.toLocaleString()}</p>
                  <p className="text-red-700 text-xs mt-1">Status: Awaiting dispute resolution</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Escrow Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-gray-900 font-semibold text-sm mb-3">💳 Escrow Actions</h2>
        <div className="flex flex-wrap gap-2">
          {['escrow', 'pending'].includes(contract.paymentStatus as string) && (
            <>
              <button onClick={() => setModal('release')} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 border border-blue-300 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                <DollarSign size={14} /> Release to Freelancer
              </button>
              <button onClick={() => setModal('refund')} className="flex items-center gap-1.5 px-3 py-1.5 text-orange-600 border border-orange-300 rounded-lg text-sm hover:bg-orange-50 transition-colors">
                <DollarSign size={14} /> Refund Client
              </button>
            </>
          )}
          {contract.status === 'active' && contract.paymentStatus !== 'disputed' && (
            <button onClick={() => setModal('freeze')} className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 border border-red-300 rounded-lg text-sm hover:bg-red-50 transition-colors">
              🧊 Freeze Contract
            </button>
          )}
          
          {contract.isHeldByAdmin ? (
            <button onClick={() => unholdMut.mutate()} disabled={unholdMut.isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 border border-emerald-300 rounded-lg text-sm hover:bg-emerald-50 transition-colors disabled:opacity-50">
              ✅ Unhold Payment
            </button>
          ) : (
            contract.paymentStatus === 'escrow' && <button onClick={() => setModal('hold')} className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 border border-red-300 rounded-lg text-sm hover:bg-red-50 transition-colors">
              ⚠️ Hold Payment
            </button>
          )}
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Milestones ({milestones.length})</h2>
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={m._id as string || i} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{m.title as string}</p>
                  <p className="text-slate-400 text-xs capitalize">{m.status as string}</p>
                </div>
                <p className="text-white font-mono text-sm">{amount?.currency as string} {(m.amount as number)?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {reports.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-red-900 font-semibold text-sm mb-3 flex items-center gap-2">
            <Flag size={16} className="text-red-600" /> User Reports ({reports.length})
          </h2>
          <div className="space-y-3">
            {reports.map((rp, i) => (
              <div key={rp._id || i} className="bg-white rounded-lg p-4 border border-red-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${rp.reporterRole === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {rp.reporterRole}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {typeof rp.reporterId === 'string' ? rp.reporterId : rp.reporterId?.name || 'Unknown User'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(rp.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm font-bold text-red-700 mb-1">{rp.reason}</p>
                {rp.description && <p className="text-sm text-gray-700">{rp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {(contract.description as string) && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-2">Description</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{contract.description as string}</p>
        </div>
      )}
    </div>
  );
}
