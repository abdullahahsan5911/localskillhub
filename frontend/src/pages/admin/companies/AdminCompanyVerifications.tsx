import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPendingCompanies, fetchCompanyReviewDetails, approveCompany, rejectCompany } from '@/lib/adminApi';
import type { AdminCompany } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';

export default function AdminCompanyVerifications() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch pending companies
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin:pending-companies'],
    queryFn: () => fetchPendingCompanies({ page: 1, limit: 20 }),
  });

  // Fetch details of selected company
  const { data: companyDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin:company-review', selectedCompanyId],
    queryFn: () => (selectedCompanyId ? fetchCompanyReviewDetails(selectedCompanyId) : null),
    enabled: !!selectedCompanyId,
  });

  const handleApprove = async () => {
    if (!selectedCompanyId) return;

    try {
      setProcessing(true);
      await approveCompany(selectedCompanyId);
      setSelectedCompanyId(null);
      refetch();
    } catch (err) {
      console.error('Failed to approve company:', err);
      alert('Failed to approve company');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCompanyId || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await rejectCompany(selectedCompanyId, rejectionReason);
      setSelectedCompanyId(null);
      setRejectionReason('');
      refetch();
    } catch (err) {
      console.error('Failed to reject company:', err);
      alert('Failed to reject company');
    } finally {
      setProcessing(false);
    }
  };

  const companies = data?.companies || [];
  const selected = selectedCompanyId ? companies.find(c => c._id === selectedCompanyId) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Companies List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Pending Verifications
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {companies.length} {companies.length === 1 ? 'company' : 'companies'} awaiting review
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600 flex gap-2">
              <AlertCircle size={16} />
              Failed to load companies
            </div>
          ) : companies.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No pending verifications
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {companies.map((company) => (
                <button
                  key={company._id}
                  onClick={() => setSelectedCompanyId(company._id)}
                  className={`w-full text-left px-6 py-4 transition-colors hover:bg-slate-50 ${
                    selectedCompanyId === company._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{company.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{company.industry || 'N/A'}</p>
                      {company.businessPhone && (
                        <p className="text-xs text-slate-500 mt-0.5">Phone: {company.businessPhone}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedCompanyId === company._id && (
                      <ChevronRight size={18} className="text-slate-400 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      <div className="lg:col-span-2">
        {selectedCompanyId && selected ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader size={24} className="animate-spin text-slate-400" />
              </div>
            ) : companyDetails ? (
              <div className="divide-y divide-slate-200">
                {/* Company Info */}
                <div className="px-6 py-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">{selected.name}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Owner</p>
                      <p className="text-sm text-slate-900 mt-1">{selected.ownerId.name}</p>
                      <p className="text-xs text-slate-600">{selected.ownerId.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Industry</p>
                      <p className="text-sm text-slate-900 mt-1">{selected.industry || 'Not specified'}</p>
                    </div>
                  </div>

                  {companyDetails?.company?.businessPhone && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 font-medium mb-1">Business Phone</p>
                      <p className="text-sm text-slate-900">{companyDetails.company.businessPhone}</p>
                    </div>
                  )}

                  {selected.location && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 font-medium mb-1">Location</p>
                      <p className="text-sm text-slate-900">
                        {[selected.location.city, selected.location.state, selected.location.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}

                  {selected.website && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 font-medium mb-1">Website</p>
                      <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {selected.website}
                      </a>
                    </div>
                  )}

                  {selected.description && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">About</p>
                      <p className="text-sm text-slate-900 whitespace-pre-wrap">{selected.description}</p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {companyDetails.documents && companyDetails.documents.length > 0 && (
                  <div className="px-6 py-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Verification Documents</h4>
                    <div className="space-y-3">
                      {companyDetails.documents.map((doc) => (
                        <div key={doc._id} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-medium text-sm text-slate-900">{doc.documentType}</p>
                              <p className="text-xs text-slate-600">{doc.fileName}</p>
                            </div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                            >
                              View →
                            </a>
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-6 py-6 bg-slate-50">
                  <div className="mb-6">
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why the company verification is being rejected..."
                      rows={4}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      {processing ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle size={16} className="mr-2" />
                      {processing ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                Failed to load company details
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-12 text-center">
            <p className="text-slate-500">Select a company to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
