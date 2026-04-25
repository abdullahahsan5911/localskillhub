import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationSelector from "@/components/LocationSelector";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiUploadCloud,
  FiTrash2,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiShield,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiBriefcase,
  FiGlobe,
  FiMapPin,
  FiEdit3,
  FiPlus,
  FiExternalLink,
} from "react-icons/fi";

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
  verificationStatus?: "unverified" | "pending" | "approved" | "rejected";
}

interface CompanyDocument {
  _id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  adminComment?: string;
  rejectionReason?: string;
}

// ─── Categorised document list ───────────────────────────────────────────────
const DOCUMENT_CATEGORIES: { category: string; icon: React.ReactNode; description: string; types: string[] }[] = [
  {
    category: "Business Formation",
    icon: <FiBriefcase className="w-4 h-4" />,
    description: "Documents proving your company's legal formation and existence.",
    types: [
      "Articles of Incorporation",
      "Certificate of Amendment (eg. Name Change)",
      "Certificate of Assumed Name (or Fictitious Name Certificate/ Doing Business As)",
      "Certificate of Authority",
      "Certificate of Change",
      "Certificate of Existence / Cert. of Occupancy",
      "Certificate of Filing / Cert. of Use",
      "Annual Registration",
    ],
  },
  {
    category: "Licenses & Permits",
    icon: <FiShield className="w-4 h-4" />,
    description: "Regulatory approvals, permits, and professional licenses.",
    types: [
      "Business License",
      "Tax Permit",
      "Seller's Permit / Cert. of Compliance",
      "Certificate of Competency",
      "Real Estate Broker License",
      "Health/ Food Inspection Report",
      "Application Approval from US Dept. of Transportation - Unified Carrier Registration (UCR)",
      "Certificado de Registro Comerciante (Merchant Registration Certificate, Puerto Rico)",
    ],
  },
  {
    category: "Insurance",
    icon: <FiCheckCircle className="w-4 h-4" />,
    description: "Insurance certificates demonstrating coverage and liability protection.",
    types: [
      "Company Liability Insurance",
      "Certificate of Insurance",
      "Company Vehicle Insurance",
    ],
  },
  {
    category: "Property & Assets",
    icon: <FiMapPin className="w-4 h-4" />,
    description: "Documents showing physical location, property, or vehicle ownership.",
    types: [
      "Office Utility Bill",
      "Lease or Franchise Agreement",
      "Motor Vehicle Registration",
    ],
  },
  {
    category: "Financial",
    icon: <FiGlobe className="w-4 h-4" />,
    description: "Financial records that validate your business activity.",
    types: ["Bank Statement"],
  },
  {
    category: "Employment / Staffing",
    icon: <FiEdit3 className="w-4 h-4" />,
    description: "Documents for staffing agencies proving recruiter employment status.",
    types: [
      "A letter of employment from the staffing agency showing that you are employed by that agency",
      "Any document that shows that you are receiving a salary/pay as a recruiter employed by the agency",
    ],
  },
];

// Flat list for the select dropdown (keeping original order)
const DOCUMENT_TYPES = DOCUMENT_CATEGORIES.flatMap((c) => c.types);

const VERIFICATION_STATUS_CONFIG = {
  unverified: {
    badge: <FiXCircle className="w-3.5 h-3.5" />,
    label: "Not Verified",
    color: "bg-gray-100 text-gray-700",
  },
  pending: {
    badge: <FiClock className="w-3.5 h-3.5" />,
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-700",
  },
  approved: {
    badge: <FiCheckCircle className="w-3.5 h-3.5" />,
    label: "Verified",
    color: "bg-green-100 text-green-700",
  },
  rejected: {
    badge: <FiXCircle className="w-3.5 h-3.5" />,
    label: "Rejected",
    color: "bg-red-100 text-red-700",
  },
};

// ─── Sub-component: Illustrated accepted-documents panel (matches reference UI) ─
const AcceptedDocsPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="bg-[#f7f5f0] border border-gray-200 rounded-xl p-5 mt-3">
    <div className="flex items-start gap-4">
      {/* Illustration — SVG replica of the document badge icon in the reference */}
      <div className="flex-shrink-0 hidden sm:block">
        <svg width="72" height="80" viewBox="0 0 72 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* back page */}
          <rect x="14" y="10" width="44" height="58" rx="4" fill="#e8c99a" />
          {/* front page */}
          <rect x="8" y="4" width="44" height="58" rx="4" fill="#ffffff" stroke="#d4b483" strokeWidth="1.5" />
          {/* lines */}
          <rect x="16" y="22" width="28" height="3" rx="1.5" fill="#d4b483" />
          <rect x="16" y="30" width="22" height="3" rx="1.5" fill="#e8d5b8" />
          <rect x="16" y="38" width="25" height="3" rx="1.5" fill="#e8d5b8" />
          <rect x="16" y="46" width="19" height="3" rx="1.5" fill="#e8d5b8" />
          {/* badge circle */}
          <circle cx="40" cy="14" r="12" fill="#c8963e" />
          <circle cx="40" cy="14" r="9" fill="#e8b84b" />
          {/* star in badge */}
          <path d="M40 8l1.5 4.5H46l-3.7 2.7 1.4 4.3L40 17l-3.7 2.5 1.4-4.3L34 12.5h4.5z" fill="#fff" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="text-sm font-semibold text-gray-900">Some acceptable documents include:</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <FiXCircle className="w-4 h-4" />
          </button>
        </div>

        <ul className="space-y-1.5 mb-4">
          {DOCUMENT_TYPES.map((type) => (
            <li key={type} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
              {type}
            </li>
          ))}
        </ul>

        <a
          href="https://support.example.com/verification-documents"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
        >
          Learn about the types of documents accepted
          <FiExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
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
  const [verificationStatus, setVerificationStatus] = useState<
    "unverified" | "pending" | "approved" | "rejected"
  >("unverified");

  // Document upload state
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Toggle for the "accepted documents" reference panel
  const [showDocReference, setShowDocReference] = useState(false);

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
          setVerificationStatus(primary.verificationStatus || "unverified");

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
        toast({ title: "Company updated", description: "Your company profile has been saved." });
      } else {
        const res: any = await api.createCompany(payload);
        const createdCompany = (res?.data as any)?.company || (res?.data as any)?.data?.company;
        if (createdCompany?._id) {
          setCompanyId(createdCompany._id);
          setVerificationStatus("unverified");
          try {
            await refreshUser();
          } catch (refreshErr) {
            console.error("Failed to refresh user data after company creation:", refreshErr);
          }
        }
        toast({ title: "Company created", description: "Your company profile has been created." });
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
        if (verificationStatus === "unverified") {
          setVerificationStatus("pending");
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
      toast({ title: "Document deleted", description: "The document has been removed." });
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
      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Company Management</h1>
          {companyId && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color}`}
            >
              {statusConfig.badge}
              {statusConfig.label}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Company Details Form ── */}
          <section className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiBriefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-semibold">
                {companyId ? "Company Details" : "Create Company"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Acme Studios"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Industry</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    placeholder="Design, Development, Marketing"
                    className="text-xs sm:text-sm pl-9"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">Website</label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://yourcompany.com"
                    className="text-xs sm:text-sm pl-9"
                    type="url"
                  />
                </div>
              </div>

              {/* Description */}
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

              {/* Location */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <FiMapPin className="w-3.5 h-3.5 text-gray-500" />
                    Company Location
                  </span>
                </label>
                <LocationSelector
                  value={{ city: form.city, state: form.state, country: form.country }}
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
                {submitting ? (
                  "Saving..."
                ) : saved ? (
                  <span className="flex items-center justify-center gap-2">
                    <FiCheckCircle className="w-4 h-4" /> Saved!
                  </span>
                ) : companyId ? (
                  <span className="flex items-center justify-center gap-2">
                    <FiEdit3 className="w-4 h-4" /> Update Company
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiPlus className="w-4 h-4" /> Create Company
                  </span>
                )}
              </Button>

              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </p>
              )}
            </form>
          </section>

          {/* ── RIGHT: Verification Documents ── */}
          {companyId && (
            <section className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <FiShield className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-semibold">Verification Documents</h2>
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FiInfo className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 leading-relaxed">
                  Upload official document to verify your company. Only{" "}
                  <strong>verified companies</strong> can post jobs on the platform.
                  Documents must be in <strong>PDF, PNG, or JPG</strong> format (max 25 MB each).
                </p>
              </div>

              {/* Accepted documents reference panel */}
              <div>
                {!showDocReference ? (
                  <button
                    type="button"
                    onClick={() => setShowDocReference(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
                  >
                    <FiFileText className="w-3.5 h-3.5" />
                    View accepted document types ({DOCUMENT_TYPES.length})
                    <FiChevronDown className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <AcceptedDocsPanel onClose={() => setShowDocReference(false)} />
                )}
              </div>

              {/* Upload Form */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiUploadCloud className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Upload a Document</span>
                </div>

                <div className="space-y-3">
                  {/* Document type select */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">
                      Document Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">Select a document type…</option>
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.types.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* File input */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">
                      File{" "}
                      <span className="font-normal text-gray-500">(PDF, PNG, JPG — Max 25 MB)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={uploading || !selectedDocType}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {uploadError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600">
                      <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {uploadError}
                    </p>
                  )}
                  {uploading && (
                    <p className="flex items-center gap-1.5 text-xs text-blue-600">
                      <FiUploadCloud className="w-3.5 h-3.5 animate-bounce" />
                      Uploading…
                    </p>
                  )}
                </div>
              </div>

              {/* Uploaded document list */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <FiFileText className="w-4 h-4 text-gray-500" />
                  Uploaded Documents
                  {documents.length > 0 && (
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 ml-1">
                      {documents.length}
                    </span>
                  )}
                </h3>

                {documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-gray-200 rounded-lg text-gray-400">
                    <FiFileText className="w-8 h-8 mb-2" />
                    <p className="text-xs">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const isPending = doc.status === "pending";
                      const isApproved = doc.status === "approved";
                      const isRejected = doc.status === "rejected";

                      return (
                        <div
                          key={doc._id}
                          className="flex items-start justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Status icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              {isApproved && <FiCheckCircle className="w-4 h-4 text-green-600" />}
                              {isRejected && <FiXCircle className="w-4 h-4 text-red-500" />}
                              {isPending && <FiClock className="w-4 h-4 text-yellow-500" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-xs">
                                  {doc.documentType}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${
                                    isApproved
                                      ? "bg-green-100 text-green-700"
                                      : isRejected
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {isPending ? "Pending" : isApproved ? "Approved" : "Rejected"}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.fileName}</p>

                              {doc.rejectionReason && (
                                <p className="flex items-start gap-1 text-xs text-red-600 mt-1">
                                  <FiAlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  {doc.rejectionReason}
                                </p>
                              )}

                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="flex-shrink-0 flex items-center gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status banners */}
              {verificationStatus === "pending" && (
                <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <FiClock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-blue-900">
                    Your company is <strong>under review</strong>. We'll notify you once verification is
                    complete. This usually takes 1–3 business days.
                  </p>
                </div>
              )}

              {verificationStatus === "rejected" && (
                <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <FiXCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-900">
                    Your company verification was <strong>rejected</strong>. Please review the feedback on
                    your documents and resubmit with the correct files.
                  </p>
                </div>
              )}

              {verificationStatus === "approved" && (
                <div className="flex items-start gap-2.5 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <FiCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-green-900">
                    Your company is <strong>verified</strong>! You can now post jobs to the platform.
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