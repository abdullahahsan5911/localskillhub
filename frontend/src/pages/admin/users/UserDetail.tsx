import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserDetail, banUser, unbanUser, suspendUser, removeSuspension, warnUser, removeWarning,
  setRiskLevel, addAdminNote, assignBadge
} from '@/lib/adminApi';
import {
  ChevronLeft, Shield, AlertTriangle, Ban, Award, StickyNote,
  ExternalLink, UserCheck, Clock, Mail, Phone, Github, Check,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FiGithub } from 'react-icons/fi';
import { resolveAvatarSrc } from '@/lib/avatar';

const RISK_COLORS = {
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  high: 'text-red-600 bg-red-50 border-red-200',
};
const ROLE_COLORS = {
  freelancer: 'text-blue-600 bg-blue-50',
  client: 'text-purple-600 bg-purple-50',
  admin: 'text-blue-600 bg-blue-50',
};

function ActionModal({ title, placeholder, onConfirm, onClose, confirmLabel = 'Confirm', confirmClass = 'bg-blue-600 hover:bg-blue-500', isLoading = false }: {
  title: string; placeholder: string; onConfirm: (val: string) => void; onClose: () => void;
  confirmLabel?: string; confirmClass?: string; isLoading?: boolean;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-gray-900 font-bold text-lg mb-3">{title}</h3>
        <textarea
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3} placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} disabled={isLoading}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
          <button
            onClick={() => val.trim() && onConfirm(val)}
            disabled={!val.trim() || isLoading}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 transition-opacity disabled:cursor-not-allowed ${confirmClass}`}
          >{isLoading ? 'Processing...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState<null | { type: string }>(null);
  const [noteText, setNoteText] = useState('');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => fetchUserDetail(id!),
    enabled: !!id,
  }) as { data: Record<string, unknown> | undefined; isLoading: boolean; error: unknown };

  const mutOpts = {
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', id] }); setModal(null); toast({ title: 'Done ✓' }); },
    onError: (e: unknown) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }),
  };

  const banMut = useMutation({ mutationFn: (reason: string) => banUser(id!, reason), ...mutOpts });
  const unbanMut = useMutation({ mutationFn: () => unbanUser(id!), ...mutOpts });
  const suspendMut = useMutation({ mutationFn: (reason: string) => suspendUser(id!, reason), ...mutOpts });
  const removeSuspendMut = useMutation({ mutationFn: () => removeSuspension(id!), ...mutOpts });
  const warnMut = useMutation({ mutationFn: (reason: string) => warnUser(id!, reason), ...mutOpts });
  const removeWarnMut = useMutation({ mutationFn: (warningIndex: number) => removeWarning(id!, warningIndex), ...mutOpts });
  const riskMut = useMutation({ mutationFn: ({ level, reason }: { level: string; reason: string }) => setRiskLevel(id!, level, reason), ...mutOpts });
  const noteMut = useMutation({ mutationFn: (note: string) => addAdminNote(id!, note), ...mutOpts });
  const badgeMut = useMutation({ mutationFn: ({ badgeType, action }: { badgeType: string; action: 'add' | 'remove' }) => assignBadge(id!, badgeType, action), ...mutOpts });

  const handleModalConfirm = (val: string) => {
    if (!modal) return;
    if (modal.type === 'ban') banMut.mutate(val);
    if (modal.type === 'suspend') suspendMut.mutate(val);
    if (modal.type === 'warn') warnMut.mutate(val);
    if (modal.type === 'risk-medium') riskMut.mutate({ level: 'medium', reason: val });
    if (modal.type === 'risk-high') riskMut.mutate({ level: 'high', reason: val });
    if (modal.type === 'risk-low') riskMut.mutate({ level: 'low', reason: val });
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900"><ChevronLeft size={18} /></button>
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p className="mb-4">User not found or failed to load.</p>
        <Link to="/admin/users" className="text-blue-600 hover:underline">← Back to Users</Link>
      </div>
    );
  }

  const isBanned = user.isBanned as boolean;
  const isSuspended = user.isSuspended as boolean;
  const role = user.role as string;
  const riskLevel = (user.riskLevel as string) || 'low';
  const adminBadges = (user.adminBadges as unknown[]) || [];
  const adminNotes = (user.adminNotes as { note: string; createdAt: string; addedBy: Record<string, unknown> }[]) || [];
  const featuredEligibility = (user.featuredVisualizationEligibility as {
    eligible?: boolean;
    requirements?: { minLocalScore?: number; minCompletedJobs?: number; minAverageRating?: number };
    metrics?: { localScore?: number; completedJobs?: number; averageRating?: number };
    reasons?: string[];
  } | undefined);

  const profileLink = role === 'freelancer'
    ? `/freelancers/${(user.freelancerProfile as Record<string, unknown>)?._id || id}`
    : `/clients/${id}`;

  return (
    <div className="space-y-5">
      {modal && (
        <ActionModal
          title={
            modal.type === 'ban' ? '🚫 Ban User' :
            modal.type === 'suspend' ? '⏸ Suspend User' :
            modal.type === 'warn' ? '⚠️ Issue Warning' :
            modal.type.startsWith('risk-') ? `⚠️ Set Risk: ${modal.type.replace('risk-', '')}` : ''
          }
          placeholder="Reason (required)..."
          confirmLabel={modal.type === 'ban' ? 'Ban User' : modal.type === 'suspend' ? 'Suspend' : modal.type === 'warn' ? 'Issue Warning' : 'Set Risk'}
          confirmClass={modal.type === 'ban' ? 'bg-red-600 hover:bg-red-500' : modal.type === 'warn' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}
          isLoading={
            modal.type === 'ban' ? banMut.isPending :
            modal.type === 'suspend' ? suspendMut.isPending :
            modal.type === 'warn' ? warnMut.isPending :
            modal.type.startsWith('risk-') ? riskMut.isPending :
            false
          }
          onConfirm={handleModalConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {/* Back header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.name as string}</h1>
          <p className="text-gray-600 text-xs">{user.email as string}</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <img
            src={resolveAvatarSrc(user.avatar as string)}
            alt=""
            className="w-16 h-16 rounded-full ring-2 ring-gray-200"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'text-gray-600 bg-gray-100'}`}>
                {role}
              </span>
              {(user.accountType as string) && (
                <span className="px-2 py-0.5 rounded text-xs text-gray-600 bg-gray-100 capitalize">{user.accountType as string}</span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || ''}`}>
                {riskLevel} risk
              </span>
              {isBanned && <span className="text-red-600 text-xs bg-red-50 px-2 py-0.5 rounded">🚫 Banned</span>}
              {isSuspended && !isBanned && <span className="text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded">⏸ Suspended</span>}
              {!isBanned && !isSuspended && <span className="text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded">✓ Active</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-gray-500 text-xs">Joined</p><p className="text-gray-700">{new Date(user.createdAt as string).toLocaleDateString()}</p></div>
              {(user.location as Record<string, unknown>)?.city && (
                <div><p className="text-gray-500 text-xs">Location</p><p className="text-gray-700">{(user.location as Record<string, unknown>).city as string}, {(user.location as Record<string, unknown>).state as string}</p></div>
              )}
              <div><p className="text-gray-500 text-xs">Email Verified</p><p className={user.isEmailVerified ? 'text-blue-600' : 'text-red-600'}>{user.isEmailVerified ? 'Yes' : 'No'}</p></div>
            </div>
          </div>
          <a href={profileLink} target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors">
            <ExternalLink size={13} /> View Public Profile
          </a>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-gray-900 font-semibold mb-3 text-sm flex items-center gap-2"><Shield size={15} className="text-blue-600" /> Verification Status</h2>
        <div className="space-y-3">
          {/* Email Verification */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
            <Mail size={16} className={user.isEmailVerified || user.provider === 'email' || user.provider === 'google' ? 'text-emerald-600' : 'text-gray-400'} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-xs text-gray-600">{user.email as string}</p>
            </div>
            {user.isEmailVerified || user.provider === 'email' || user.provider === 'google' ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-medium flex-shrink-0">
                <Check size={12} /> Verified
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs font-medium flex-shrink-0">Not Verified</span>
            )}
          </div>

          {/* Phone Verification */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
            <Phone size={16} className={user.isPhoneVerified ? 'text-emerald-600' : 'text-gray-400'} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Phone</p>
              <p className="text-xs text-gray-600">{(user.phone as string) || 'No phone number'}</p>
            </div>
            {user.isPhoneVerified ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-medium flex-shrink-0">
                <Check size={12} /> Verified
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs font-medium flex-shrink-0">Not Verified</span>
            )}
          </div>

          {/* GitHub Verification */}
           <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50"> 
            <FiGithub size={16} 
            className={(user.role === 'freelancer' && ((user.verifiedBadges as any[]) || []).some((b: any) => b.type === 'github')) || user.provider === 'github' ?
             'text-emerald-600' : 'text-gray-400'} />
         
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">GitHub</p>
            </div>
            {(user.role === 'freelancer' && ((user.verifiedBadges as any[]) || []).some((b: any) => b.type === 'github')) || user.provider === 'github'? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-medium flex-shrink-0">
                <Check size={12} /> Verified
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs font-medium flex-shrink-0">Not Verified</span>
            )}
          </div>

          {/* Verified Badges */}
          {((user.verifiedBadges as unknown[]) || []).length > 0  && (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
              <p className="text-sm font-medium text-gray-900 mb-2">Verified Badge</p>
              <div className="flex flex-wrap gap-2">
                {(user.verifiedBadges as { type: string; verifiedAt?: string; verifiedBy?: string }[]).map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-1 rounded bg-blue-50 text-blue-600 text-md font-medium">
                    {badge.type === 'verified' && (
                      <>
                      <span>Verified</span>                       
                       <ShieldCheck size={18} />
                        <span className="text-black text-[.7rem]">
                        {new Date(badge.verifiedAt).toLocaleDateString()}
                      </span>
                      </>
                    )} 
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-gray-900 font-semibold mb-3 text-sm">Admin Actions</h2>
        <div className="flex flex-wrap gap-2">
          {isBanned ? (
            <button onClick={() => unbanMut.mutate()} disabled={unbanMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <UserCheck size={14} /> {unbanMut.isPending ? 'Removing Ban...' : 'Unban'}
            </button>
          ) : isSuspended ? (
            <button onClick={() => removeSuspendMut.mutate()} disabled={removeSuspendMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <UserCheck size={14} /> {removeSuspendMut.isPending ? 'Removing...' : 'Remove Suspension'}
            </button>
          ) : (
            <>
              <button onClick={() => setModal({ type: 'warn' })}
                disabled={warnMut.isPending || suspendMut.isPending || banMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <AlertTriangle size={14} /> {warnMut.isPending ? 'Processing...' : 'Warn'}
              </button>
              <button onClick={() => setModal({ type: 'suspend' })}
                disabled={warnMut.isPending || suspendMut.isPending || banMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Clock size={14} /> {suspendMut.isPending ? 'Processing...' : 'Suspend'}
              </button>
              <button onClick={() => setModal({ type: 'ban' })}
                disabled={warnMut.isPending || suspendMut.isPending || banMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Ban size={14} /> {banMut.isPending ? 'Processing...' : 'Ban'}
              </button>
            </>
          )}
          <div className="border-l border-gray-200 mx-1" />
          <span className="text-gray-500 text-xs self-center">Risk:</span>
          {(['low', 'medium', 'high'] as const).map(level => (
            <button key={level} onClick={() => setModal({ type: `risk-${level}` })}
              disabled={riskLevel === level || riskMut.isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${RISK_COLORS[level]}`}>
              {riskMut.isPending ? '⏳ Updating...' : level}
            </button>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-gray-900 font-semibold mb-3 text-sm flex items-center gap-2"><Award size={15} className="text-amber-600" /> Badges</h2>
        
        {/* Currently Assigned Badges */}
        {adminBadges.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-600 font-medium mb-2">Assigned Admin Badges:</p>
            <div className="flex flex-wrap gap-2">
              {adminBadges.map((badge: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                  <span>✓ {badge.type.replace(/_/g, ' ')}</span>
                  <button
                    onClick={() => badgeMut.mutate({ badgeType: badge.type, action: 'remove' })}
                    disabled={badgeMut.isPending}
                    className="ml-1 hover:text-amber-900 transition-colors disabled:opacity-50"
                    title="Remove badge"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Badge Assignment Buttons */}
        <p className="text-xs text-gray-600 mb-2">Manage badges:</p>

        {role === 'freelancer' && featuredEligibility && (
          <div className={`mb-3 rounded-lg border px-3 py-2 text-xs ${featuredEligibility.eligible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            <p className="font-semibold mb-1">Featured Visualization Eligibility</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p>Local Score: {featuredEligibility.metrics?.localScore || 0} / {featuredEligibility.requirements?.minLocalScore || 80}</p>
              <p>Completed Jobs: {featuredEligibility.metrics?.completedJobs || 0} / {featuredEligibility.requirements?.minCompletedJobs || 10}</p>
              <p>Avg Rating: {(featuredEligibility.metrics?.averageRating || 0).toFixed(1)} / {featuredEligibility.requirements?.minAverageRating || 4.5}</p>
            </div>
            {!featuredEligibility.eligible && (featuredEligibility.reasons || []).length > 0 && (
              <p className="mt-1">{featuredEligibility.reasons?.join(' ')}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {['top_freelancer', 'rising_talent', 'local_verified', 'trusted_client', 'featured_visualization'].map(badge => {
            const has = adminBadges.some((b: any) => b.type === badge);
            const blockedByEligibility = badge === 'featured_visualization' && !has && role === 'freelancer' && featuredEligibility && !featuredEligibility.eligible;
            return (
              <button key={badge} onClick={() => badgeMut.mutate({ badgeType: badge, action: has ? 'remove' : 'add' })}
                disabled={badgeMut.isPending || !!blockedByEligibility}
                title={blockedByEligibility ? 'Freelancer does not meet featured visualization eligibility criteria' : ''}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all disabled:opacity-50 ${
                  has ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                }`}>
                {has ? '✓ ' : '+ '}{badge.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Notes */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-gray-900 font-semibold mb-3 text-sm flex items-center gap-2"><StickyNote size={15} className="text-blue-600" /> Admin Notes</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Add a private note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) { noteMut.mutate(noteText); setNoteText(''); } }}
          />
          <button
            onClick={() => { if (noteText.trim()) { noteMut.mutate(noteText); setNoteText(''); } }}
            disabled={!noteText.trim() || noteMut.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
          >Add</button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {adminNotes.length === 0 ? (
            <p className="text-gray-500 text-sm">No notes yet.</p>
          ) : (
            [...adminNotes].reverse().map((note, i) => (
              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-700 text-sm">{note.note}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {note.addedBy?.name as string} · {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Warnings */}
      {((user.warnings as unknown[]) || []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-amber-600 font-semibold mb-3 text-sm flex items-center gap-2"><AlertTriangle size={15} /> Warning History</h2>
          <div className="space-y-2">
            {(user.warnings as { reason: string; createdAt: string }[]).map((w, i) => (
              <div key={i} className="text-sm p-3 bg-white rounded-lg border border-amber-100 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700">{w.reason}</p>
                  <p className="text-gray-600 text-xs mt-1">{new Date(w.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => removeWarnMut.mutate(i)}
                  disabled={removeWarnMut.isPending}
                  className="flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removeWarnMut.isPending ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
