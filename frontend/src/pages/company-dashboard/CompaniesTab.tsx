import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationSelector from "@/components/LocationSelector";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Company {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  verificationStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
}

interface CompanyDocument {
  _id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  adminComment?: string;
  rejectionReason?: string;
}

const DOCUMENT_TYPES = [
  'Articles of Incorporation',
  'Business License',
  'Company Liability Insurance',
  'Office Utility Bill',
  'Lease or Franchise Agreement',
  'Tax Permit',
  'Annual Registration',
  'Certificate of Insurance',
  'Company Vehicle Insurance',
  'Certificate of Amendment (eg. Name Change)',
  'Certificate of Assumed Name (or Fictitious Name Certificate/ Doing Business As)',
  'Certificate of Authority',
  'Certificate of Change',
  'Certificate of Existence / Cert. of Occupancy',
  'Certificate of Filing / Cert. of Use',
  'Certificate of Competency',
  'Seller\'s Permit / Cert. of Compliance',
  'Certificado de Registro Comerciante (Merchant Registration Certificate, Puerto Rico)',
  'Health/ Food Inspection Report',
  'Application Approval from US Dept. of Transportation - Unified Carrier Registration (UCR)',
  'Motor Vehicle Registration',
  'Real Estate Broker License',
  'A letter of employment from the staffing agency showing that you are employed by that agency',
  'Any document that shows that you are receiving a salary/pay as a recruiter employed by the agency',
  'Bank Statement',
];

const VERIFICATION_STATUS_CONFIG = {
  unverified: { badge: '❌', label: 'Not Verified', color: 'bg-gray-100 text-gray-700' },
  pending: { badge: '⏳', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
  approved: { badge: '✅', label: 'Verified', color: 'bg-green-100 text-green-700' },
  rejected: { badge: '❌', label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const CompaniesTab = () => {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
    city: "",
    state: "",
    country: "India",
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
  
  // Document upload state
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const myRes: any = await api.getMyCompanies();
        const payload = (myRes?.data as any) || myRes;
        const companies = (payload?.companies || payload?.data?.companies || []) as Company[];
        const primary = companies[0] || null;

        if (primary) {
          setCompanyId(primary._id || "");
          setForm({
            name: primary.name || "",
            description: primary.description || "",
            industry: primary.industry || "",
            website: primary.website || "",
            city: primary.location?.city || "",
            state: primary.location?.state || "",
            country: primary.location?.country || "India",
          });
          setVerificationStatus(primary.verificationStatus || 'unverified');

          // Load documents
          if (primary._id) {
            const docsRes: any = await api.getCompanyDocuments(primary._id);
            const docsPayload = (docsRes?.data as any) || docsRes;
            setDocuments(docsPayload?.documents || docsPayload?.data?.documents || []);
          }
        }
      } catch (err) {
        console.error("Failed to load companies", err);
        setError("Unable to load your company details.");
        toast({
          title: "Unable to load company",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setError("");
      setSaved(false);
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        industry: form.industry.trim() || undefined,
        website: form.website.trim() || undefined,
        location:
          form.city.trim() || form.state.trim() || form.country.trim()
            ? {
                city: form.city.trim() || undefined,
                state: form.state.trim() || undefined,
                country: form.country.trim() || undefined,
              }
            : undefined,
      };

      if (companyId) {
        await api.updateCompany(companyId, payload);
        toast({
          title: "Company updated",
          description: "Your company profile has been saved.",
        });
      } else {
        const res: any = await api.createCompany(payload);
        const createdCompany = (res?.data as any)?.company || (res?.data as any)?.data?.company;
        if (createdCompany?._id) {
          setCompanyId(createdCompany._id);
          setVerificationStatus('unverified');
          
          // Refresh user data to update accountType to 'company'
          try {
            await refreshUser();
          } catch (refreshErr) {
            console.error('Failed to refresh user data after company creation:', refreshErr);
          }
        }
        toast({
          title: "Company created",
          description: "Your company profile has been created.",
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to create company", err);
      setError("Unable to save company details.");
      toast({
        title: "Unable to save company",
        description: "Please check details and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId || !selectedDocType) {
      setUploadError("Please select a document type");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const res: any = await api.uploadCompanyDocument(companyId, file, selectedDocType);
      const newDoc = res?.data?.document;

      if (newDoc) {
        setDocuments((prev) => [newDoc, ...prev]);
        setSelectedDocType("");
        (e.target as HTMLInputElement).value = "";
        toast({
          title: "Document uploaded",
          description: "Your verification document has been uploaded successfully.",
        });

        // Update status to pending if it was unverified
        if (verificationStatus === 'unverified') {
          setVerificationStatus('pending');
        }
      }
    } catch (err: any) {
      console.error("Failed to upload document", err);
      setUploadError(err.message || "Failed to upload document");
      toast({
        title: "Upload failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!companyId) return;

    const confirmed = window.confirm("Delete this document? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await api.deleteCompanyDocument(companyId, docId);
      setDocuments((prev) => prev.filter((doc) => doc._id !== docId));
      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      });
    } catch (err: any) {
      console.error("Failed to delete document", err);
      toast({
        title: "Failed to delete",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const statusConfig = VERIFICATION_STATUS_CONFIG[verificationStatus];

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Company Management</h1>
          {companyId && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color}`}>
              {statusConfig.badge} {statusConfig.label}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Company Details Form */}
          <section className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-base sm:text-lg md:text-lg font-semibold mb-4">
              {companyId ? "Company Details" : "Create Company"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Company Name *</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Acme Studios"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Industry</label>
                <Input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Design, Development, Marketing"
                  className="text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Website</label>
                <Input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                  className="text-xs sm:text-sm"
                  type="url"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">About / Hiring Brief</label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell freelancers what your company builds and what kind of talent you hire."
                  rows={4}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Company Location</label>
                <LocationSelector
                  value={{
                    city: form.city,
                    state: form.state,
                    country: form.country,
                  }}
                  onChange={(next) =>
                    setForm((prev) => ({
                      ...prev,
                      city: next.city,
                      state: next.state,
                      country: next.country,
                    }))
                  }
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving..." : saved ? "Saved!" : companyId ? "Update Company" : "Create Company"}
              </Button>

              {error && <p className="text-xs text-red-600">{error}</p>}
            </form>
          </section>

          {/* RIGHT COLUMN: Document Upload & List */}
          {companyId && (
            <section className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-4">Verification Documents</h2>
              <p className="text-xs text-gray-600 mb-4">
                Upload documents to verify your company. Only verified companies can post jobs.
              </p>

              {/* Upload Form */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Document Type *</label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select a document type...</option>
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Upload File (PDF, PNG, JPG - Max 25MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={uploading || !selectedDocType}
                      className="w-full text-xs"
                    />
                  </div>

                  {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                  {uploading && <p className="text-xs text-blue-600">Uploading...</p>}
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Uploaded Documents</h3>
                {documents.length === 0 ? (
                  <p className="text-xs text-gray-500">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc._id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 truncate">{doc.documentType}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                                doc.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : doc.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {doc.status === 'pending' ? '⏳ Pending' : doc.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{doc.fileName}</p>
                          {doc.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">Reason: {doc.rejectionReason}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="ml-2 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {verificationStatus === 'pending' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-900">
                    ⏳ Your company is under review. We'll notify you once verification is complete.
                  </p>
                </div>
              )}

              {verificationStatus === 'rejected' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-900">
                    ❌ Your company verification was rejected. Please review the feedback and resubmit.
                  </p>
                </div>
              )}

              {verificationStatus === 'approved' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-green-900">
                    ✅ Your company is verified! You can now post jobs to the platform.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;
