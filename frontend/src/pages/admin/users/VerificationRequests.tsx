import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVerifications, approveVerification, rejectVerification, requestReupload } from '@/lib/adminApi';
import { CheckCircle, XCircle, RefreshCw, Eye, FileText, Clock, ChevronDown, CrossIcon, Check, CheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FiCheck, FiCheckCircle, FiCheckSquare } from 'react-icons/fi';
import { resolveAvatarSrc } from '@/lib/avatar';

function ActionModal({ title, onConfirm, onClose, placeholder }: {
  title: string; onConfirm: (val: string) => void; onClose: () => void; placeholder: string;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-gray-900 font-bold mb-3">{title}</h3>
        <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3} placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:text-gray-900">Cancel</button>
          <button onClick={() => val.trim() && onConfirm(val)} disabled={!val.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-500">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function VerificationRequests() {
  const [status, setStatus] = useState('all');
  const [modal, setModal] = useState<null | { type: string; id: string }>(null);
  const [docModal, setDocModal] = useState<null | string[]>(null);
  const [expandedData, setExpandedData] = useState<Set<string>>(new Set());
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', status],
    queryFn: () => fetchVerifications({ status }),
  });

  const opts = {
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-verifications'] }); setModal(null); toast({ title: 'Done' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive' })
  };
  const approveMut = useMutation({ mutationFn: (id: string) => approveVerification(id), ...opts });
  const rejectMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVerification(id, reason), ...opts });
  const reuploadMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => requestReupload(id, reason), ...opts });

  const handleConfirm = (val: string) => {
    if (!modal) return;
    if (modal.type === 'reject') rejectMut.mutate({ id: modal.id, reason: val });
    if (modal.type === 'reupload') reuploadMut.mutate({ id: modal.id, reason: val });
  };

  const TYPE_LABELS: Record<string, string> = { 
    // identity: '🪪 ID Verification',
     freelancer: 'Freelancer', company: 'Company' };
  const STATUS_STYLES: Record<string, string> = {
    pending: 'text-amber-600 bg-amber-50',
    approved: 'text-blue-600 bg-blue-50',
    rejected: 'text-red-600 bg-red-50'
  };

  return (
    <div className="space-y-5">
      {modal && (
        <ActionModal
          title={modal.type === 'reject' ? '❌ Rejection Reason' : '🔄 Request Re-upload'}
          placeholder={modal.type === 'reject' ? 'Reason for rejection...' : 'What needs to be re-uploaded?'}
          onConfirm={handleConfirm} onClose={() => setModal(null)}
        />
      )}
      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDocModal(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-900 font-bold">Submitted Documents</h3>
              <button onClick={() => setDocModal(null)} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="space-y-3">
              {docModal.map((doc, i) => (
                <a key={i} href={doc} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-blue-600 hover:text-blue-700 text-sm">
                  <FileText size={16} /> Document {i + 1}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">Verification Requests</h1>
        <p className="text-gray-600 text-sm">Review ID, freelancer, and company verification submissions</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${status === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        )) : (data?.data || []).map((vr: Record<string, unknown>) => {
          const user = vr.userId as Record<string, unknown>;
          const docs = (vr.documents as string[]) || [];
          return (
            <div key={vr._id as string} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <img src={resolveAvatarSrc(user?.avatar as string)} alt="" className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-gray-900 font-semibold">{user?.name as string}</span>
                    <span className="text-gray-600 text-sm">{user?.email as string}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[vr.status as string]}`}>
                      {vr.status as string}
                    </span>
                    <span className="text-gray-600 text-xs">{TYPE_LABELS[vr.type as string] || vr.type as string}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Submitted: {new Date(vr.createdAt as string).toLocaleString()}
                  </p>
                  {(vr.rejectionReason as string) && (
                    <p className="text-red-600 text-sm mt-1">Rejection reason: {vr.rejectionReason as string}</p>
                  )}

                  {/* Submitted data expandable section */}
                  {vr.submittedData && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          const newSet = new Set(expandedData);
                          if (newSet.has(vr._id as string)) {
                            newSet.delete(vr._id as string);
                          } else {
                            newSet.add(vr._id as string);
                          }
                          setExpandedData(newSet);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 rounded hover:bg-blue-50 transition-colors"
                      >
                        <ChevronDown size={13} className={`transition-transform ${expandedData.has(vr._id as string) ? 'rotate-180' : ''}`} />
                        Submitted Data
                      </button>
                      {expandedData.has(vr._id as string) && (
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(vr.submittedData as Record<string, unknown>)?.role && (
                              <span className="px-2 py-1 text-black rounded text-xs font-medium">
                                Role: {(vr.submittedData as Record<string, unknown>).role as string}
                              </span>
                            )}
                            {(vr.submittedData as Record<string, unknown>)?.submittedAt && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {new Date((vr.submittedData as Record<string, unknown>).submittedAt as string).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {(vr.submittedData as Record<string, unknown>)?.verifications && (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries((vr.submittedData as Record<string, unknown>).verifications as Record<string, unknown>).map(([key, value]) => (
                                <span
                                  key={key}
                                  className={`px-2 py-1 flex justify-center items-center rounded text-xs font-medium capitalize ${
                                    value ? 'bg-gray-700 text-white gap-1' : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {key.replace(/([A-Z])/g, ' $1').trim()}: {value ? <FiCheckCircle /> : <CrossIcon />}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {docs.length > 0 && (
                    <button onClick={() => setDocModal(docs)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs transition-colors">
                      <Eye size={13} /> View Docs ({docs.length})
                    </button>
                  )}
                  {vr.status === 'pending' && (
                    <>
                      <button onClick={() => approveMut.mutate(vr._id as string)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors">
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button onClick={() => setModal({ type: 'reject', id: vr._id as string })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs transition-colors">
                        <XCircle size={13} /> Reject
                      </button>
                      <button onClick={() => setModal({ type: 'reupload', id: vr._id as string })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs transition-colors">
                        <RefreshCw size={13} /> Re-upload
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!isLoading && (data?.data || []).length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <CheckCircle size={32} className="mx-auto mb-2 text-blue-600" />
            No {status} verifications
          </div>
        )}
      </div>
    </div>
  );
}
