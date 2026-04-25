import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminContracts, forceReleaseEscrow, refundClient, freezeContract } from '@/lib/adminApi';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function ActionModal({ title, desc, confirmLabel, confirmClass, onConfirm, onClose }: {
  title: string; desc: string; confirmLabel: string; confirmClass: string;
  onConfirm: (r: string) => void; onClose: () => void;
}) {
  const [r, setR] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-gray-900 font-bold mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-3">{desc}</p>
        <div className="flex items-start gap-2 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Lock size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-700 text-xs">This action is irreversible and will be logged in the audit trail.</p>
        </div>
        <textarea className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3} placeholder="Reason (required)..." value={r} onChange={e => setR(e.target.value)} />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Cancel</button>
          <button onClick={() => r.trim() && onConfirm(r)} disabled={!r.trim()} className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-blue-600 bg-blue-50', completed: 'text-gray-600 bg-gray-100',
  disputed: 'text-red-600 bg-red-50', cancelled: 'text-orange-600 bg-orange-50', draft: 'text-amber-600 bg-amber-50'
};
const PAY_COLORS: Record<string, string> = {
  escrow: 'text-blue-600', released: 'text-blue-600', refunded: 'text-orange-600',
  pending: 'text-amber-600', disputed: 'text-red-600'
};

interface AdminContractsProps {
  forceHiringOnly?: boolean;
  title?: string;
  subtitle?: string;
}

export default function AdminContracts({
  forceHiringOnly = false,
  title = 'Contracts',
  subtitle = 'Monitor all platform contracts and payment status',
}: AdminContractsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState<null | { type: string; id: string; amount: number }>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const offerStatus = searchParams.get('offerStatus') || '';
  const hiringOnly = forceHiringOnly ? true : searchParams.get('hiringOnly') === 'true';
  const targetContractId = searchParams.get('contractId') || '';
  const sp = (key: string, val: string) => { const p = new URLSearchParams(searchParams); val ? p.set(key, val) : p.delete(key); p.set('page', '1'); setSearchParams(p); };

  useEffect(() => {
    if (!forceHiringOnly) return;
    if (searchParams.get('hiringOnly') === 'true') return;
    const p = new URLSearchParams(searchParams);
    p.set('hiringOnly', 'true');
    p.set('page', '1');
    setSearchParams(p);
  }, [forceHiringOnly, searchParams, setSearchParams]);

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin-contracts', page, status, offerStatus, hiringOnly],
    queryFn: () => fetchAdminContracts({
      page,
      limit: 20,
      status: status || undefined,
      offerStatus: offerStatus || undefined,
      hiringOnly: hiringOnly ? 'true' : undefined,
    }),
    placeholderData: (prev) => prev,
  });
  const data = queryData as { data: Record<string, unknown>[]; pagination: { total: number; pages: number } } | undefined;

  useEffect(() => {
    if (!targetContractId) return;
    const el = document.getElementById(`admin-contract-${targetContractId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [targetContractId, data?.data]);

  const opts = { onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-contracts'] }); setModal(null); toast({ title: 'Done' }); } };
  const releaseMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => forceReleaseEscrow(id, reason), ...opts });
  const refundMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => refundClient(id, reason), ...opts });
  const freezeMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => freezeContract(id, reason), ...opts });

  const handleConfirm = (reason: string) => {
    if (!modal) return;
    if (modal.type === 'release') releaseMut.mutate({ id: modal.id, reason });
    if (modal.type === 'refund') refundMut.mutate({ id: modal.id, reason });
    if (modal.type === 'freeze') freezeMut.mutate({ id: modal.id, reason });
  };

  const modalConfig: Record<string, { title: string; desc: string; confirmLabel: string; confirmClass: string }> = {
    release: { title: '✅ Force Release Escrow', desc: 'Payment will be released to the freelancer immediately.', confirmLabel: 'Release to Freelancer', confirmClass: 'bg-blue-600 hover:bg-blue-500' },
    refund: { title: '💸 Refund Client', desc: 'Payment will be returned to the client.', confirmLabel: 'Refund Client', confirmClass: 'bg-orange-600 hover:bg-orange-500' },
    freeze: { title: '🧊 Freeze Contract', desc: 'Contract will be frozen and marked as disputed.', confirmLabel: 'Freeze Contract', confirmClass: 'bg-red-600 hover:bg-red-500' },
  };

  return (
    <div className="space-y-5">
      {modal && (
        <ActionModal {...modalConfig[modal.type]} onConfirm={handleConfirm} onClose={() => setModal(null)} />
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 text-sm">{subtitle}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'active', 'completed', 'disputed', 'cancelled'].map(s => (
          <button key={s} onClick={() => sp('status', s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${status === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'pending_freelancer', 'accepted', 'rejected'].map(s => (
          <button key={s} onClick={() => sp('offerStatus', s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${offerStatus === s ? 'bg-violet-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-violet-50'}`}>
            {s ? `Offer: ${s.replace('_', ' ')}` : 'All Offer States'}
          </button>
        ))}
        {!forceHiringOnly && (
          <button
            onClick={() => sp('hiringOnly', hiringOnly ? '' : 'true')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${hiringOnly ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-emerald-50'}`}
          >
            {hiringOnly ? 'Hiring Requests Only' : 'Show All Contract Types'}
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Contract</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Parties</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Payment</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Amount</th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>
              )) : (data?.data || []).map((c: Record<string, unknown>) => {
                const client = c.clientId as Record<string, unknown>;
                const freelancer = c.freelancerId as Record<string, unknown>;
                const amount = c.amount as Record<string, unknown>;
                const isDisputed = c.paymentStatus === 'disputed';
                const currentOfferStatus = c.offerStatus as string | undefined;
                const isHiringRequest = c.isHiringRequest === true;
                return (
                  <tr
                    id={`admin-contract-${c._id as string}`}
                    key={c._id as string}
                    className={`${isDisputed ? 'bg-red-50' : 'hover:bg-gray-50'} ${targetContractId === (c._id as string) ? 'ring-2 ring-violet-300 ring-inset' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link to={`/admin/contracts/${c._id}`} className="text-gray-900 text-sm font-medium hover:text-blue-600 line-clamp-1">{c.title as string}</Link>
                      <p className="text-gray-500 text-xs">{new Date(c.createdAt as string).toLocaleDateString()}</p>
                      {isHiringRequest && (
                        <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Hiring Request</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">
                        <span className="text-blue-600">{client?.name as string}</span>
                        <span className="mx-1 text-gray-400">→</span>
                        <span className="text-blue-600">{freelancer?.name as string}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[c.status as string] || ''}`}>{c.status as string}</span>
                        {currentOfferStatus && (
                          <div className="text-[11px] text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded capitalize inline-block">
                            offer: {currentOfferStatus.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`text-xs capitalize ${PAY_COLORS[c.paymentStatus as string] || 'text-slate-400'}`}>
                          {c.paymentStatus as string}
                        </span>
                        {c.paymentStatus === 'disputed' && (
                          <div className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 font-medium">
                            💰 Frozen in Escrow
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-mono text-sm">{amount?.currency as string} {(amount?.total as number)?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/contracts/${c._id}`} className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded border border-gray-300">View</Link>
                        {['escrow', 'pending'].includes(c.paymentStatus as string) && (
                          <>
                            <button onClick={() => setModal({ type: 'release', id: c._id as string, amount: amount?.total as number })} className="text-xs text-blue-600 px-2 py-1 rounded border border-blue-300">Release</button>
                            <button onClick={() => setModal({ type: 'refund', id: c._id as string, amount: amount?.total as number })} className="text-xs text-orange-600 px-2 py-1 rounded border border-orange-300">Refund</button>
                          </>
                        )}
                        {c.status === 'active' && (
                          <button onClick={() => setModal({ type: 'freeze', id: c._id as string, amount: 0 })} className="text-xs text-red-600 px-2 py-1 rounded border border-red-300">Freeze</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data?.pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-gray-600 text-sm">Total: {data.pagination.total}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => sp('page', String(page - 1))} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={page >= data.pagination.pages} onClick={() => sp('page', String(page + 1))} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
