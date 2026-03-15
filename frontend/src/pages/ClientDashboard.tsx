import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, FileCheck,
  MessageSquare, Settings, Plus, Eye,
  Clock, CheckCircle2, XCircle, DollarSign,
  Tag, Trash2, Search, Camera, Loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import DashboardLayout, { NavItem } from "@/components/dashboard/DashboardLayout";
import MessagesTab from "@/components/dashboard/MessagesTab";
import { CATEGORIES } from "@/constants/categories";

interface Job {
  _id: string;
  title: string;
  status: string;
  category: string;
  budget: { type: string; amount: number; currency: string };
  createdAt: string;
  proposals?: any[];
  skills: string[];
  clientId?: any;
}

interface Proposal {
  _id: string;
  jobId: { _id: string; title: string };
  freelancerId: { _id: string; name: string; avatar?: string };
  coverLetter: string;
  proposedRate?: { amount?: number; type?: string; currency?: string };
  estimatedDuration?: { value?: number; unit?: string };
  status: string;
  createdAt: string;
}

interface Contract {
  _id: string;
  jobId: { _id: string; title: string };
  freelancerId: { _id: string; name: string; avatar?: string };
  clientId?: { _id: string; name: string; avatar?: string };
  amount: { total: number; type: string; currency: string };
  milestones?: Array<{
    _id: string;
    title: string;
    amount: number;
    status: string;
    feedback?: string;
  }>;
  signatures?: {
    client?: { signed?: boolean };
    freelancer?: { signed?: boolean };
  };
  status: string;
  startDate: string;
}

interface Analytics {
  jobsPosted: number;
  openJobs: number;
  activeContracts: number;
  completedJobs: number;
  totalSpent: number;
  totalProposalsReceived: number;
  hireRate: number;
  avgJobValue: number;
}

// ...existing code removed; main `ClientDashboard` component defined later in file

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-100 text-gray-600",
  accepted: "bg-green-100 text-green-700",
  sent: "bg-yellow-100 text-yellow-700",
  viewed: "bg-blue-100 text-blue-700",
  shortlisted: "bg-purple-100 text-purple-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  active: "bg-blue-100 text-blue-700",
  submitted: "bg-indigo-100 text-indigo-700",
  "revision-requested": "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
};

const OverviewTab = ({ analytics, jobs, proposals, loading }: any) => {
  const stats = [
    { label: "Jobs Posted", value: analytics?.jobsPosted ?? 0, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
    { label: "Active Contracts", value: analytics?.activeContracts ?? 0, icon: FileCheck, color: "bg-green-50 text-green-600" },
    { label: "Total Proposals", value: analytics?.totalProposalsReceived ?? 0, icon: FileText, color: "bg-purple-50 text-purple-600" },
    { label: "Total Spent", value: `₹${((analytics?.totalSpent ?? 0)).toLocaleString()}`, icon: DollarSign, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Jobs</h3>
            <Badge variant="secondary">{jobs.length}</Badge>
          </div>
          <div className="divide-y divide-gray-50">
            {jobs.slice(0, 5).map((job: Job) => (
              <div key={job._id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ₹{job.budget.amount.toLocaleString()} · {job.proposals?.length ?? 0} proposals
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusColors[job.status] || "bg-gray-100 text-gray-600"}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
            {jobs.length === 0 && !loading && (
              <div className="px-5 py-8 text-center">
                <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No jobs posted yet</p>
                <Link to="/post-job">
                  <Button size="sm" className="mt-3 bg-blue-600 text-white hover:bg-blue-700">Post Your First Job</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Latest Proposals</h3>
            <Badge variant="secondary">{proposals.length}</Badge>
          </div>
          <div className="divide-y divide-gray-50">
            {proposals.slice(0, 5).map((p: Proposal) => (
              <div key={p._id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={p.freelancerId?.avatar} />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                      {p.freelancerId?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.freelancerId?.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {p.jobId?.title} · ₹{(p.proposedRate?.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
            {proposals.length === 0 && !loading && (
              <div className="px-5 py-8 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No proposals yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MyJobsTab = ({ jobs, loading, onRefresh }: any) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = jobs.filter((j: Job) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    try {
      await api.deleteJob(id);
      onRefresh();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
        </select>
        <Link to="/post-job">
          <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Post Job
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No jobs found</p>
          <Link to="/post-job">
            <Button className="mt-4 bg-blue-600 text-white hover:bg-blue-700">Post a Job</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job: Job) => {
            const cat = CATEGORIES.find(c => c.id === job.category);
            return (
              <div key={job._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[job.status] || "bg-gray-100 text-gray-600"}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        ₹{job.budget.amount.toLocaleString()} ({job.budget.type})
                      </span>
                      {cat && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{cat.name}</span>}
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {job.proposals?.length ?? 0} proposals
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {job.skills?.slice(0, 4).map(s => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/jobs/${job._id}`}>
                      <Button variant="outline" size="sm" className="rounded-xl gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ProposalsTab = ({ proposals, loading, onAction }: any) => {
  const [filter, setFilter] = useState("all");

  const filtered = proposals.filter((p: Proposal) =>
    filter === "all" ? true : p.status === filter
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "sent", "viewed", "shortlisted", "accepted", "rejected"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              filter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No proposals yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: Proposal) => (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <Avatar className="w-11 h-11 flex-shrink-0">
                  <AvatarImage src={p.freelancerId?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                    {p.freelancerId?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-900">{p.freelancerId?.name}</p>
                      <p className="text-sm text-gray-500">For: {p.jobId?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">₹{(p.proposedRate?.amount ?? 0).toLocaleString()}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.coverLetter}</p>
                    {["sent", "viewed", "shortlisted"].includes(p.status) && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-1"
                          onClick={() => onAction(p, "accepted")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => onAction(p, "rejected")}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </Button>
                      <Link to={`/profile/${p.freelancerId?._id}`}>
                        <Button size="sm" variant="outline" className="rounded-xl gap-1">
                          <Eye className="w-3.5 h-3.5" /> Profile
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ContractsTab = ({ contracts, loading, onRefresh }: any) => {
  const [acting, setActing] = useState<string | null>(null);

  const act = async (key: string, fn: () => Promise<any>) => {
    try {
      setActing(key);
      await fn();
      onRefresh();
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border h-24 animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No contracts yet</p>
        </div>
      ) : (
        contracts.map((c: Contract) => (
          <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={c.freelancerId?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                    {c.freelancerId?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{c.jobId?.title}</p>
                  <p className="text-sm text-gray-500">with {c.freelancerId?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₹{(c.amount?.total ?? 0).toLocaleString()}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[c.status] || "bg-gray-100 text-gray-600"}`}>
                  {c.status}
                </span>
              </div>
            </div>

            {!c.signatures?.client?.signed && (
              <div>
                <Button
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
                  disabled={acting === `sign-${c._id}`}
                  onClick={() => act(`sign-${c._id}`, () => api.signContract(c._id))}
                >
                  {acting === `sign-${c._id}` ? "Signing..." : "Sign Contract"}
                </Button>
              </div>
            )}

            {(c.milestones || []).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-800">Milestones</p>
                {c.milestones!.map((m) => (
                  <div key={m._id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.title}</p>
                        <p className="text-xs text-gray-500">₹{m.amount.toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[m.status] || "bg-gray-100 text-gray-600"}`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {m.status === "submitted" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700 rounded-xl"
                            disabled={acting === `approve-${c._id}-${m._id}`}
                            onClick={() => act(`approve-${c._id}-${m._id}`, () => api.approveMilestone(c._id, m._id))}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            disabled={acting === `rev-${c._id}-${m._id}`}
                            onClick={() => {
                              const feedback = prompt("Revision feedback for freelancer:") || "Please revise and resubmit.";
                              act(`rev-${c._id}-${m._id}`, () => api.requestMilestoneRevision(c._id, m._id, feedback));
                            }}
                          >
                            Request Revision
                          </Button>
                        </>
                      )}
                      {m.status === "approved" && (
                        <Button
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
                          disabled={acting === `pay-${c._id}-${m._id}`}
                          onClick={() => act(`pay-${c._id}-${m._id}`, () => api.releaseMilestonePayment(c._id, m._id))}
                        >
                          Release Payment
                        </Button>
                      )}
                      {m.feedback && <p className="text-xs text-amber-700">Feedback: {m.feedback}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const SettingsTab = ({ user }: any) => {
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setAvatarUrl(result.url);
      await api.updateProfile({ avatar: result.url });
    } catch (err: any) {
      alert(err.message || "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
      if (avatarFileRef.current) avatarFileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      await api.updateProfile({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Profile Photo</h3>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">{name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => avatarFileRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {avatarUploading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Upload a new photo</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WEBP — max 5MB</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl text-xs"
              onClick={() => avatarFileRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? "Uploading…" : "Choose File"}
            </Button>
          </div>
        </div>
        <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Profile Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50"
            value={user?.email || ""}
            disabled
          />
        </div>
        <Button
          className={`w-full rounded-xl ${saved ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"} text-white`}
          onClick={handleSave}
        >
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showVerify, setShowVerify] = useState(false);
  useEffect(() => {
    if (user && (!user.isEmailVerified || (user as any).verificationLevel === 'unverified' || (user as any).verificationLevel === 'basic')) {
      setShowVerify(true);
    } else {
      setShowVerify(false);
    }
  }, [user]);
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, jobsRes, proposalsRes, contractsRes, convsRes] = await Promise.allSettled([
        api.getClientAnalytics(),
        api.getMyJobs(),
        api.getProposals(),
        api.getContracts(),
        api.getConversations(),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        const d = analyticsRes.value.data as any;
        setAnalytics(d.data?.analytics || d.analytics || d);
      }
      if (jobsRes.status === "fulfilled" && jobsRes.value?.data) {
        const d = jobsRes.value.data as any;
        setJobs(d.jobs || []);
      }
      if (proposalsRes.status === "fulfilled" && proposalsRes.value?.data) {
        const d = proposalsRes.value.data as any;
        setProposals(d.proposals || d.data || []);
      }
      if (contractsRes.status === "fulfilled" && contractsRes.value?.data) {
        const d = contractsRes.value.data as any;
        setContracts(d.contracts || []);
      }
      if (convsRes.status === "fulfilled" && convsRes.value?.data) {
        const convs: any[] = (convsRes.value.data as any).conversations || [];
        setUnreadMessages(convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [(user as any)?._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleProposalAction = async (proposal: Proposal, status: string) => {
    try {
      if (status === "accepted") {
        await api.acceptProposal(proposal._id);

        const alreadyHasContract = contracts.some((c: Contract) => c.jobId?._id === proposal.jobId?._id && c.freelancerId?._id === proposal.freelancerId?._id);
        if (!alreadyHasContract) {
          const totalAmount = proposal.proposedRate?.amount ?? 0;
          await api.createContract({
            jobId: proposal.jobId?._id,
            proposalId: proposal._id,
            clientId: (user as any)?._id,
            freelancerId: proposal.freelancerId?._id,
            title: `Contract for ${proposal.jobId?.title}`,
            description: proposal.coverLetter,
            amount: {
              total: totalAmount,
              type: proposal.proposedRate?.type || "fixed",
              currency: proposal.proposedRate?.currency || "INR",
            },
            milestones: [
              {
                title: "Project Delivery",
                amount: totalAmount,
                status: "pending",
              },
            ],
            paymentStatus: "escrow",
            status: "active",
          });
        }
      } else if (status === "rejected") {
        await api.rejectProposal(proposal._id);
      }
      fetchData();
    } catch { /* ignore */ }
  };

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "my-jobs", label: "My Jobs", icon: Briefcase, badge: jobs.filter(j => j.status === "open").length },
    { id: "proposals", label: "Proposals", icon: FileText, badge: proposals.filter(p => ["sent", "viewed", "shortlisted"].includes(p.status)).length },
    { id: "contracts", label: "Contracts", icon: FileCheck, badge: contracts.filter(c => c.status === "active").length },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadMessages || undefined },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab analytics={analytics} jobs={jobs} proposals={proposals} loading={loading} />,
    "my-jobs": <MyJobsTab jobs={jobs} loading={loading} onRefresh={fetchData} />,
    proposals: <ProposalsTab proposals={proposals} loading={loading} onAction={handleProposalAction} />,
    contracts: <ContractsTab contracts={contracts} loading={loading} onRefresh={fetchData} />,
    messages: (
      <MessagesTab
        onUnreadCount={setUnreadMessages}
        initialTargetUserId={searchParams.get("userId") || undefined}
      />
    ),
    settings: <SettingsTab user={user} />,
  };

  return (
    <>
      {showVerify && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-100 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">✔</span>
            <div>
              <div className="font-semibold text-blue-900">Verify your account to unlock all features</div>
              <div className="text-xs text-blue-700">Complete identity and profile verification for more trust and visibility.</div>
            </div>
          </div>
          <Link to="/verification">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 py-2 text-base font-semibold">Verify Account</Button>
          </Link>
        </div>
      )}
      <DashboardLayout
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        headerActions={
          <Link to="/post-job">
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-1.5 hidden sm:flex">
              <Plus className="w-4 h-4" /> Post Job
            </Button>
          </Link>
        }
      >
        {tabContent[activeTab] || tabContent["overview"]}
      </DashboardLayout>
    </>
  );
};

export default ClientDashboard;
