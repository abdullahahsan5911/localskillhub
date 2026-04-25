import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminJobs, flagJob, unflagJob, featureJob, deleteJob } from '@/lib/adminApi';
import { Search, Flag, Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { JobStatusBadges } from '@/components/JobStatusBadges';
import { resolveAvatarSrc } from '@/lib/avatar';

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
          <button onClick={() => r.trim() && onConfirm(r)} disabled={!r.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function AllJobs({ flaggedOnly = false }: { flaggedOnly?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | { type: string; id: string; title: string }>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') || '1');
  const sp = (key: string, val: string) => { const p = new URLSearchParams(searchParams); val ? p.set(key, val) : p.delete(key); p.set('page', '1'); setSearchParams(p); };

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin-jobs', page, search, flaggedOnly],
    queryFn: () => fetchAdminJobs({ page, limit: 20, isFlagged: flaggedOnly ? 'true' : undefined, search: search || undefined }),
    placeholderData: (prev) => prev,
  });
  const data = queryData as { data: Record<string, unknown>[]; pagination: { total: number; pages: number } } | undefined;

  const opts = { 
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin-jobs'] }); 
      setModal(null); 
    } 
  };
  const flagMut = useMutation({ 
    mutationFn: ({ id, reason }: { id: string; reason: string }) => flagJob(id, reason), 
    onSuccess: () => {
      toast({ title: '🚩 Job Flagged', description: 'This job has been marked for review.' });
      opts.onSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to flag job', variant: 'destructive' });
    }
  });
  const unflagMut = useMutation({ 
    mutationFn: (id: string) => unflagJob(id), 
    onSuccess: () => {
      toast({ title: '✓ Flag Removed', description: 'The flag has been cleared.' });
      opts.onSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to unflag job', variant: 'destructive' });
    }
  });
  const featureMut = useMutation({ 
    mutationFn: ({ id, v }: { id: string; v: boolean }) => featureJob(id, v), 
    onSuccess: (_, { v }) => {
      toast({ 
        title: v ? '⭐ Job Featured' : '★ Feature Removed', 
        description: v ? 'Job is now featured.' : 'Job is no longer featured.' 
      });
      opts.onSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to update feature status', variant: 'destructive' });
    }
  });
  const deleteMut = useMutation({ 
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteJob(id, reason), 
    onSuccess: () => {
      toast({ title: '🗑 Job Deleted', description: 'Job has been removed from the platform.' });
      opts.onSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to delete job', variant: 'destructive' });
    }
  });

  const handleConfirm = (reason: string) => {
    if (!modal) return;
    if (modal.type === 'flag') flagMut.mutate({ id: modal.id, reason });
    if (modal.type === 'delete') deleteMut.mutate({ id: modal.id, reason });
  };

  const STATUS_COLORS: Record<string, string> = {
    open: 'text-blue-600', 'in-progress': 'text-blue-500', completed: 'text-gray-600',
    cancelled: 'text-red-600', closed: 'text-gray-500', draft: 'text-amber-600'
  };

  return (
    <div className="space-y-5">
      {modal && ['flag', 'delete'].includes(modal.type) && (
        <ReasonModal title={modal.type === 'flag' ? '🚩 Flag Job' : '🗑 Delete Job'} onConfirm={handleConfirm} onClose={() => setModal(null)} />
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">{flaggedOnly ? 'Flagged Jobs' : 'All Jobs'}</h1>
        <p className="text-gray-600 text-sm">Monitor and moderate marketplace listings</p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className="w-full max-w-sm pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Job</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Client</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Budget</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase px-4 py-3">Posted</th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>
              )) : (data?.data || []).map((job: Record<string, unknown>) => {
                const client = job.clientId as Record<string, unknown>;
                const budget = job.budget as Record<string, unknown>;
                return (
                  <tr key={job._id as string} className={`hover:bg-gray-50 transition-colors ${job.isFlagged ? 'border-l-2 border-l-red-500' : ''}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-900 text-sm font-medium line-clamp-1">{job.title as string}</p>
                        <p className="text-gray-600 text-xs">{job.category as string}</p>
                        <JobStatusBadges job={job} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={resolveAvatarSrc(client?.avatar as string)} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-gray-700 text-sm">{client?.name as string}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium capitalize ${STATUS_COLORS[job.status as string] || 'text-gray-600'}`}>{job.status as string}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{budget?.currency as string} {budget?.amount as number}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{new Date(job.createdAt as string).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {job.isFlagged ? (
                          <button 
                            onClick={() => unflagMut.mutate(job._id as string)} 
                            disabled={unflagMut.isPending}
                            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-300 disabled:opacity-50"
                          >
                            {unflagMut.isPending ? '...' : 'Unflag'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => setModal({ type: 'flag', id: job._id as string, title: job.title as string })} 
                            disabled={flagMut.isPending}
                            className="text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded border border-amber-300 disabled:opacity-50"
                          >
                            <Flag size={12} className="inline mr-1" />{flagMut.isPending ? '...' : 'Flag'}
                          </button>
                        )}
                        <button 
                          onClick={() => featureMut.mutate({ id: job._id as string, v: !job.isFeatured })} 
                          disabled={featureMut.isPending}
                          className="text-xs text-gray-600 hover:text-amber-600 px-2 py-1 rounded border border-gray-300 disabled:opacity-50"
                        >
                          <Star size={12} className="inline mr-1" />{featureMut.isPending ? '...' : (job.isFeatured ? 'Unfeature' : 'Feature')}
                        </button>
                        <button 
                          onClick={() => setModal({ type: 'delete', id: job._id as string, title: job.title as string })} 
                          disabled={deleteMut.isPending}
                          className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-300 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}\n            </tbody>
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
