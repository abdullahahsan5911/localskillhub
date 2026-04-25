import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminCommunities, deleteCommunity, suspendCommunity, restoreCommunity, type AdminCommunitiesResponse, type AdminCommunity } from '@/lib/adminApi';
import { Globe, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function ReasonModal({ title, onConfirm, onClose }: { title: string; onConfirm: (r: string) => void; onClose: () => void }) {
  const [r, setR] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-gray-900 font-bold mb-3">{title}</h3>
        <textarea className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3} placeholder="Reason..." value={r} onChange={e => setR(e.target.value)} />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Cancel</button>
          <button onClick={() => r.trim() && onConfirm(r)} disabled={!r.trim()} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCommunities() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | { type: string; id: string; name: string }>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<AdminCommunitiesResponse>({
    queryKey: ['admin-communities', search],
    queryFn: () => fetchAdminCommunities({ search: search || undefined }),
  });

  const opts = { onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-communities'] }); setModal(null); toast({ title: 'Done' }); } };
  const deleteMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteCommunity(id, reason), ...opts });
  const suspendMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendCommunity(id, reason), ...opts });
  const restoreMut = useMutation({ mutationFn: (id: string) => restoreCommunity(id), ...opts });

  const handleConfirm = (reason: string) => {
    if (!modal) return;
    if (modal.type === 'delete') deleteMut.mutate({ id: modal.id, reason });
    if (modal.type === 'suspend') suspendMut.mutate({ id: modal.id, reason });
  };

  return (
    <div className="space-y-5">
      {modal && ['delete', 'suspend'].includes(modal.type) && (
        <ReasonModal title={modal.type === 'delete' ? `🗑 Delete "${modal.name}"` : `⏸ Suspend "${modal.name}"`} onConfirm={handleConfirm} onClose={() => setModal(null)} />
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">Communities</h1>
        <p className="text-gray-600 text-sm">Full control over all platform communities</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="Search communities..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />) :
          (data?.data || []).map((c: AdminCommunity) => {
            const owner = c.ownerId;
            const members = c.members || [];
            return (
              <div key={c._id} className={`bg-gray-50 border rounded-xl p-5 ${c.isSuspended ? 'border-red-300 opacity-70' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3 mb-3">
                  {c.logo ? (
                    <img src={c.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                      <Globe size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-gray-900 font-semibold">{c.name}</p>
                    <p className="text-gray-600 text-xs">{c.category}</p>
                    {c.isSuspended && <span className="text-red-600 text-xs">⏸ Suspended</span>}
                  </div>
                </div>
                <p className="text-gray-600 text-xs line-clamp-2 mb-3">{c.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-600">
                    <span className="text-gray-900 font-medium">{members?.length || 0}</span> members
                  </div>
                  <div className="text-xs text-gray-600">
                    Owner: <span className="text-gray-700">{owner?.name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {c.isSuspended ? (
                    <button onClick={() => restoreMut.mutate(c._id)} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">Restore</button>
                  ) : (
                    <button onClick={() => setModal({ type: 'suspend', id: c._id, name: c.name })} className="flex-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs hover:bg-amber-100">Suspend</button>
                  )}
                  <button onClick={() => setModal({ type: 'delete', id: c._id, name: c.name })} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
