import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, banUser, unbanUser, suspendUser, warnUser, } from '@/lib/adminApi';
import { Search, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { UserPresenceColumn } from '@/components/UserPresenceColumn';
import { FiGithub } from 'react-icons/fi';
import { resolveAvatarSrc } from '@/lib/avatar';

const RISK_COLORS = { low: 'text-blue-600 bg-blue-50', medium: 'text-amber-600 bg-amber-50', high: 'text-red-600 bg-red-50' };
const ROLE_COLORS = { freelancer: 'text-blue-600 bg-blue-50', client: 'text-purple-600 bg-purple-50', admin: 'text-blue-600 bg-blue-50' };

function ConfirmModal({ title, description, confirmText, confirmClass, onConfirm, onClose, requireReason }: {
  title: string; description: string; confirmText: string; confirmClass: string;
  onConfirm: (reason: string) => void; onClose: () => void; requireReason?: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-gray-900 font-bold text-lg mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        {requireReason !== false && (
          <textarea
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={3} placeholder="Reason (required)..."
            value={reason} onChange={e => setReason(e.target.value)}
          />
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-sm">Cancel</button>
          <button
            onClick={() => { if (requireReason !== false && !reason.trim()) return; onConfirm(reason); }}
            disabled={requireReason !== false && !reason.trim()}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 transition-opacity ${confirmClass}`}
          >{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default function AllUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | { type: string; userId: string; userName: string }>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  // Auto-set isBanned filter if route is /admin/users/banned
  useEffect(() => {
    if (location.pathname === '/admin/users/banned' && !searchParams.get('isBanned')) {
      const params = new URLSearchParams(searchParams);
      params.set('isBanned', 'true');
      setSearchParams(params);
    }
  }, [location.pathname, searchParams, setSearchParams]);

  const page = parseInt(searchParams.get('page') || '1');
  const role = searchParams.get('role') || '';
  const riskLevel = searchParams.get('riskLevel') || '';
  const isBanned = searchParams.get('isBanned') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, role, riskLevel, isBanned, search],
    queryFn: () => fetchUsers({ page, limit: 20, role: role || undefined, riskLevel: riskLevel || undefined, isBanned: isBanned || undefined, search: search || undefined }),
    placeholderData: (prev) => prev,
  }) as { data: { data: Record<string, unknown>[]; pagination: { total: number; pages: number } } | undefined; isLoading: boolean };

  const mutOpts = {
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setModal(null); },
    onError: (e: unknown) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' })
  };
  const banMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => banUser(id, reason), ...mutOpts });
  const unbanMut = useMutation({ mutationFn: ({ id }: { id: string }) => unbanUser(id), ...mutOpts });
  const suspendMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendUser(id, reason), ...mutOpts });
  const warnMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => warnUser(id, reason), ...mutOpts });

  const handleAction = (reason: string) => {
    if (!modal) return;
    if (modal.type === 'ban') banMut.mutate({ id: modal.userId, reason });
    if (modal.type === 'unban') { unbanMut.mutate({ id: modal.userId }); setModal(null); }
    if (modal.type === 'suspend') suspendMut.mutate({ id: modal.userId, reason });
    if (modal.type === 'warn') warnMut.mutate({ id: modal.userId, reason });
  };

  const sp = (key: string, val: string) => { const p = new URLSearchParams(searchParams); val ? p.set(key, val) : p.delete(key); p.set('page', '1'); setSearchParams(p); };

  return (
    <div className="space-y-5">
      {modal && (
        <ConfirmModal
          title={modal.type === 'ban' ? '🚫 Ban User' : modal.type === 'suspend' ? '⏸ Suspend User' : modal.type === 'warn' ? '⚠️ Warn User' : '✅ Unban User'}
          description={`Action target: ${modal.userName}`}
          confirmText={modal.type === 'unban' ? 'Activate' : modal.type === 'ban' ? 'Ban User' : modal.type === 'suspend' ? 'Suspend' : 'Issue Warning'}
          confirmClass={modal.type === 'unban' ? 'bg-emerald-600 hover:bg-emerald-500' : modal.type === 'warn' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'}
          requireReason={modal.type !== 'unban'}
          onConfirm={handleAction}
          onClose={() => setModal(null)}
        />
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isBanned === 'true' ? 'Banned Users' : 'All Users'}
        </h1>
        <p className="text-gray-600 text-sm">
          {isBanned === 'true' ? 'Manage banned user accounts' : 'Manage and moderate platform users'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          value={role} onChange={e => sp('role', e.target.value)}>
          <option value="">All Roles</option>
          <option value="freelancer">Freelancers</option>
          <option value="client">Clients</option>
        </select>
        <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          value={riskLevel} onChange={e => sp('riskLevel', e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
        <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          value={isBanned} onChange={e => sp('isBanned', e.target.value)}>
          <option value="">All Status</option>
          <option value="true">Banned</option>
          <option value="false">Active</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">Risk</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">Verification</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">Presence</th>
                <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">Joined</th>
                <th className="text-right text-xs font-medium text-gray-600 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : (data?.data || []).map((user: Record<string, unknown>) => (
                <tr key={user._id as string} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={resolveAvatarSrc(user.avatar as string)} alt="" className="w-8 h-8 rounded-full" />
                      <div>
                        <Link to={`/admin/users/${user._id}`} className="text-gray-900 text-sm font-medium hover:text-blue-600">{user.name as string}</Link>
                        <p className="text-gray-600 text-xs">{user.email as string}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || 'text-gray-600 bg-gray-100'}`}>
                      {user.role as string}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${RISK_COLORS[user.riskLevel as keyof typeof RISK_COLORS] || ''}`}>
                      {(user.riskLevel as string) || 'low'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="text-red-600 text-xs font-medium">🚫 Banned</span>
                    ) : user.isSuspended ? (
                      <span className="text-amber-600 text-xs font-medium">⏸ Suspended</span>
                    ) : (
                      <span className="text-blue-600 text-xs font-medium">✓ Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {/* Email Verification */}
                      {user.isEmailVerified || user.provider === 'email' || user.provider === 'google' ? (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-xs" title="Email verified">
                          <Mail size={12} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 text-red-400 text-xs" title="Email not verified">
                          <Mail size={12} />
                        </div>
                      )}
                      
                      {/* Phone Verification */}
                      {user.isPhoneVerified ? (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-xs" title="Phone verified">
                          <Phone size={12} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 text-red-400 text-xs" title="Phone not verified">
                          <Phone size={12} />
                        </div>
                      )}
                      
                      {/* GitHub Verification - Only for Freelancers or GitHub OAuth Users */}
                      { user.role === 'freelancer' ?
                       ((user.verifiedBadges as any[]) || []).some((b: any) => b.type === 'github') || user.provider === 'github' ? 
                       (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-xs" title="GitHub verified">
                          <FiGithub size={12} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 text-red-400 text-xs" title="GitHub not verified">
                          <FiGithub size={12} />
                        </div>
                      ):null
                      }
                   
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UserPresenceColumn userId={user._id as string} showLabel={true} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {new Date(user.createdAt as string).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/users/${user._id}`} className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 hover:border-gray-400 transition-colors">View</Link>
                      {user.isBanned ? (
                        <button onClick={() => setModal({ type: 'unban', userId: user._id as string, userName: user.name as string })}
                          className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors">Activate</button>
                      ) : (
                        <>
                          <button onClick={() => setModal({ type: 'warn', userId: user._id as string, userName: user.name as string })}
                            className="text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded border border-amber-200 hover:border-amber-400 transition-colors">Warn</button>
                          <button onClick={() => setModal({ type: 'ban', userId: user._id as string, userName: user.name as string })}
                            className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-400 transition-colors">Ban</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => sp('page', String(page - 1))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button disabled={page >= data.pagination.pages} onClick={() => sp('page', String(page + 1))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
