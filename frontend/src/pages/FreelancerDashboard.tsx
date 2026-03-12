import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, FileCheck,
  MessageSquare, Settings, Plus, Eye, DollarSign,
  Star, TrendingUp, Clock, CheckCircle2, ExternalLink,
  Grid3X3, Search, X, Image as ImageIcon, Trophy, Target,
  Upload, Camera, Loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { buildPointLocation, resolveCurrentBrowserLocation } from "@/lib/location";
import { uploadToCloudinary } from "@/lib/cloudinary";
import DashboardLayout, { NavItem } from "@/components/dashboard/DashboardLayout";
import MessagesTab from "@/components/dashboard/MessagesTab";
import { CATEGORIES } from "@/constants/categories";

interface PortfolioItem {
  _id?: string;
  title: string;
  description: string;
  images: string[];
  link?: string;
  category: string;
  tags: string[];
  completedAt?: string;
}

interface FreelancerProfile {
  title?: string;
  bio?: string;
  skills?: Array<{ name: string; level: string }>;
  portfolio: PortfolioItem[];
  rates?: { minRate: number; maxRate: number; currency: string; rateType: string };
  totalEarnings?: number;
  completedJobs?: number;
  rating?: number;
  profileViews?: number;
  availability?: { status: string };
}

interface Analytics {
  profileViews: number;
  proposalsSent: number;
  proposalsAccepted: number;
  proposalSuccessRate: number;
  totalEarnings: number;
  currentMonthEarnings: number;
  averageRating: number;
  completedJobs: number;
  activeContracts: number;
  localRank?: { rank: number; city: string; totalFreelancers: number };
}

interface Proposal {
  _id: string;
  jobId: { _id: string; title: string; budget: { amount: number } };
  bidAmount: number;
  status: string;
  createdAt: string;
  coverLetter: string;
}

interface Contract {
  _id: string;
  jobId: { title: string };
  clientId: { name: string; avatar?: string };
  amount: number;
  status: string;
  startDate: string;
}

// ...existing dashboard content removed; main component defined later in file

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  accepted: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  active: "bg-blue-100 text-blue-700",
  shortlisted: "bg-purple-100 text-purple-700",
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ analytics, profile, loading }: any) => {
  const stats = [
    { label: "Profile Views", value: analytics?.profileViews ?? 0, icon: Eye, color: "bg-blue-50 text-blue-600" },
    { label: "Completed Jobs", value: analytics?.completedJobs ?? 0, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "Total Earnings", value: `₹${(analytics?.totalEarnings ?? 0).toLocaleString()}`, icon: DollarSign, color: "bg-orange-50 text-orange-600" },
    { label: "Avg Rating", value: analytics?.averageRating ? analytics.averageRating.toFixed(1) : "—", icon: Star, color: "bg-yellow-50 text-yellow-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Completeness */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-blue-600 w-[18px] h-[18px]" /> Profile Health
          </h3>
          <div className="space-y-3">
            {[
              { label: "Title set", done: !!profile?.title },
              { label: "Bio added", done: !!profile?.bio },
              { label: "Skills added", done: (profile?.skills?.length ?? 0) > 0 },
              { label: "Portfolio item", done: (profile?.portfolio?.length ?? 0) > 0 },
              { label: "Rate set", done: !!profile?.rates?.minRate },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-100" : "bg-gray-100"}`}>
                  {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                </div>
                <span className={`text-sm ${item.done ? "text-gray-900" : "text-gray-400"}`}>{item.label}</span>
              </div>
            ))}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Completeness</span>
                <span>{Math.round(([!!profile?.title, !!profile?.bio, (profile?.skills?.length ?? 0) > 0, (profile?.portfolio?.length ?? 0) > 0, !!profile?.rates?.minRate].filter(Boolean).length / 5) * 100)}%</span>
              </div>
              <Progress value={Math.round(([!!profile?.title, !!profile?.bio, (profile?.skills?.length ?? 0) > 0, (profile?.portfolio?.length ?? 0) > 0, !!profile?.rates?.minRate].filter(Boolean).length / 5) * 100)} className="h-2" />
            </div>
          </div>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-green-600" /> This Month
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">₹{(analytics?.currentMonthEarnings ?? 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-0.5">Monthly earnings</p>
            </div>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active contracts</span>
                <span className="font-semibold">{analytics?.activeContracts ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success rate</span>
                <span className="font-semibold">{analytics?.proposalSuccessRate?.toFixed(1) ?? 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Local Rank */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-[18px] h-[18px] text-yellow-500" /> Local Rank
          </h3>
          {analytics?.localRank ? (
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600">#{analytics.localRank.rank}</p>
              <p className="text-sm text-gray-600 mt-1">in {analytics.localRank.city}</p>
              <p className="text-xs text-gray-400 mt-0.5">of {analytics.localRank.totalFreelancers} freelancers</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Complete your profile to get ranked</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Portfolio Tab ─────────────────────────────────────────────────────────────
const PortfolioTab = ({ profile, onRefresh }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState<PortfolioItem>({
    title: "", description: "", images: [""], link: "", category: "", tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const portfolio: PortfolioItem[] = profile?.portfolio || [];

  const resetForm = () => {
    setForm({ title: "", description: "", images: [""], link: "", category: "", tags: [] });
    setTagInput("");
    setImageInput("");
    setEditItem(null);
    setShowForm(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadToCloudinary(f).then(r => r.url)));
      setForm(f => ({ ...f, images: [...f.images.filter(Boolean), ...urls] }));
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setImageUploading(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setForm({ ...item });
    setEditItem(item);
    setShowForm(true);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
      setTagInput("");
    }
  };

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setForm(f => ({ ...f, images: [...(f.images.filter(Boolean)), imageInput.trim()] }));
      setImageInput("");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, images: form.images.filter(Boolean) };
      if (editItem?._id) {
        await api.updatePortfolioItem(editItem._id, payload);
      } else {
        await api.addPortfolioItem(payload);
      }
      onRefresh();
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.deletePortfolioItem(id);
      onRefresh();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Portfolio</h2>
          <p className="text-sm text-gray-500">{portfolio.length} project{portfolio.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditItem(null); }}
          className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{editItem ? "Edit Project" : "Add New Project"}</h3>
            <button onClick={resetForm} className="p-1. rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Title *</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. E-commerce Website Redesign"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe what you built, challenges solved..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Link</label>
            <input
              type="url"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
              value={form.link}
              onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {form.images.filter(Boolean).map((img, i) => (
                <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => imageFileRef.current?.click()}
                disabled={imageUploading}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
              >
                {imageUploading
                  ? <Loader className="w-5 h-5 animate-spin" />
                  : <><Upload className="w-5 h-5" /><span className="text-xs">Upload</span></>
                }
              </button>
            </div>
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageFileUpload}
            />
            <p className="text-xs text-gray-400">Click the + tile to upload images from your device. Multiple files supported.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (press Enter)</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="React, Figma, Node.js..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.tags || []).map((tag, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                  {tag}
                  <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving || !form.title}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
            >
              {saving ? "Saving..." : editItem ? "Update Project" : "Add Project"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {/* Portfolio grid - Behance style */}
      {portfolio.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Grid3X3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No projects yet</p>
          <p className="text-sm text-gray-400 mt-1">Showcase your work to attract more clients</p>
          <Button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
          >
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {portfolio.map((item) => {
            const cat = CATEGORIES.find(c => c.id === item.category);
            const Icon = cat?.icon;
            return (
              <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
                {/* Cover image or gradient */}
                <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cat?.color || "#3B82F6"}22, ${cat?.lightColor || "#EFF6FF"})` }}>
                      {Icon ? <Icon className="w-12 h-12 opacity-30" style={{ color: cat?.color }} /> : <ImageIcon className="w-12 h-12 text-gray-300" />}
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                    </button>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors">
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(item._id!)}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    {cat && (
                      <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">{cat.name}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Proposals Tab ─────────────────────────────────────────────────────────────
const MyProposalsTab = ({ proposals, loading }: any) => {
  const [filter, setFilter] = useState("all");
  const filtered = proposals.filter((p: Proposal) => filter === "all" ? true : p.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "shortlisted", "accepted", "rejected"].map(s => (
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
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No proposals sent yet</p>
          <Link to="/jobs"><Button className="mt-4 bg-blue-600 text-white hover:bg-blue-700">Browse Jobs</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: Proposal) => (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.jobId?.title}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{p.coverLetter}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Bid: ₹{p.bidAmount?.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}>
                    {p.status}
                  </span>
                  <Link to={`/jobs/${p.jobId?._id}`}>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1">
                      <Eye className="w-3.5 h-3.5" /> View Job
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Contracts Tab ─────────────────────────────────────────────────────────────
const MyContractsTab = ({ contracts, loading }: any) => (
  <div className="space-y-3">
    {loading ? (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border h-24 animate-pulse" />)}
      </div>
    ) : contracts.length === 0 ? (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <FileCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500">No active contracts yet</p>
      </div>
    ) : (
      contracts.map((c: Contract) => (
        <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={c.clientId?.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                  {c.clientId?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">{c.jobId?.title}</p>
                <p className="text-sm text-gray-500">Client: {c.clientId?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">₹{c.amount?.toLocaleString()}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[c.status] || "bg-gray-100 text-gray-600"}`}>
                {c.status}
              </span>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);

// ─── Find Jobs Tab ─────────────────────────────────────────────────────────────
const FindJobsTab = () => {
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.getJobs({ page: 1 } as any);
        const d = res.data as any;
        setJobs(d.jobs || []);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filtered = jobs.filter(j => j.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search open jobs..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job: any) => {
            const cat = CATEGORIES.find(c => c.id === job.category);
            return (
              <div key={job._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />₹{job.budget?.amount?.toLocaleString()}</span>
                      {cat && <span>{cat.name}</span>}
                      {job.location?.city && <span>{job.location.city}</span>}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {job.skills?.slice(0, 4).map((s: string) => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>
                  <Link to={`/jobs/${job._id}`} className="flex-shrink-0">
                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl">Apply</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const SettingsTab = ({ user, profile, onRefresh }: any) => {
  const [name, setName] = useState(user?.name || "");
  const [title, setTitle] = useState(profile?.title || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [minRate, setMinRate] = useState(profile?.rates?.minRate?.toString() || "");
  const [maxRate, setMaxRate] = useState(profile?.rates?.maxRate?.toString() || "");
  const [availability, setAvailability] = useState(profile?.availability?.status || "available");
  const [city, setCity] = useState(user?.location?.city || "");
  const [state, setState] = useState(user?.location?.state || "");
  const [country, setCountry] = useState(user?.location?.country || "India");
  const [resolvedLocation, setResolvedLocation] = useState<{ latitude: number; longitude: number } | null>(() => {
    const coords = user?.location?.coordinates?.coordinates;
    return Array.isArray(coords) && coords.length >= 2
      ? { latitude: Number(coords[1]), longitude: Number(coords[0]) }
      : null;
  });
  const [locating, setLocating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
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
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
      if (avatarFileRef.current) avatarFileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaveError("");
      let latitude: number;
      let longitude: number;

      if (resolvedLocation) {
        latitude = resolvedLocation.latitude;
        longitude = resolvedLocation.longitude;
      } else {
        const geocode = await api.geocodeAddress([city, state, country].filter(Boolean).join(', '));
        latitude = Number((geocode.data as any)?.latitude);
        longitude = Number((geocode.data as any)?.longitude);
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Unable to resolve your location coordinates');
      }

      const profilePayload = {
        title, bio,
        rates: { minRate: Number(minRate), maxRate: Number(maxRate), currency: "INR", rateType: "hourly" },
        availability: { status: availability },
      };
      await api.updateProfile({
        name,
        location: buildPointLocation({ city, state, country, latitude, longitude }),
      });
      if (profile) {
        await api.updateFreelancerProfile(profilePayload);
      } else {
        await api.createFreelancerProfile(profilePayload);
      }
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message || 'Unable to save profile');
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setSaveError('');
      const resolved = await resolveCurrentBrowserLocation();
      setCity(resolved.city);
      setState(resolved.state);
      setCountry(resolved.country || 'India');
      setResolvedLocation({ latitude: resolved.latitude, longitude: resolved.longitude });
    } catch (error: any) {
      setSaveError(error.message || 'Unable to detect your current location');
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
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
        <h3 className="font-semibold text-gray-900">Basic Info</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Title</label>
          <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Full Stack Developer" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={bio} onChange={e => setBio(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={city} onChange={e => { setCity(e.target.value); setResolvedLocation(null); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={state} onChange={e => { setState(e.target.value); setResolvedLocation(null); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={country} onChange={e => { setCountry(e.target.value); setResolvedLocation(null); }} />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 -mt-1">Map coordinates are generated automatically from this location.</p>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={handleUseCurrentLocation} disabled={locating}>
            {locating ? "Detecting..." : "Use my current location"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Rate (₹/hr)</label>
            <input type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={minRate} onChange={e => setMinRate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Rate (₹/hr)</label>
            <input type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={maxRate} onChange={e => setMaxRate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
          <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={availability} onChange={e => setAvailability(e.target.value)}>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <Button
          className={`w-full rounded-xl ${saved ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"} text-white`}
          onClick={handleSave}
        >
          {saved ? "Saved!" : "Save Changes"}
        </Button>
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const FreelancerDashboard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
    // Show verify banner if not fully verified
    if (user && (!user.isEmailVerified || (user as any).verificationLevel === 'unverified' || (user as any).verificationLevel === 'basic')) {
      setShowVerify(true);
    } else {
      setShowVerify(false);
    }
  }, [isAuthenticated, isLoading, navigate, user]);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, profileRes, proposalsRes, contractsRes, convsRes] = await Promise.allSettled([
        api.getFreelancerAnalytics(),
        api.getFreelancer((user as any)?._id || ""),
        api.getProposals(),
        api.getContracts(),
        api.getConversations(),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        const d = analyticsRes.value.data as any;
        setAnalytics(d.data?.analytics || d.analytics || d);
      }
      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        const d = profileRes.value.data as any;
        setProfile(d.freelancer || d.data?.freelancer || null);
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
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "portfolio", label: "Portfolio", icon: Grid3X3, badge: profile?.portfolio?.length },
    { id: "find-jobs", label: "Find Jobs", icon: Search },
    { id: "proposals", label: "My Proposals", icon: FileText, badge: proposals.filter(p => p.status === "pending").length },
    { id: "contracts", label: "Contracts", icon: FileCheck, badge: contracts.filter(c => c.status === "active").length },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadMessages || undefined },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab analytics={analytics} profile={profile} loading={loading} />,
    portfolio: <PortfolioTab profile={profile} onRefresh={fetchData} />,
    "find-jobs": <FindJobsTab />,
    proposals: <MyProposalsTab proposals={proposals} loading={loading} />,
    contracts: <MyContractsTab contracts={contracts} loading={loading} />,
    messages: <MessagesTab onUnreadCount={setUnreadMessages} />,
    settings: <SettingsTab user={user} profile={profile} onRefresh={fetchData} />,
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
        <Link to="/jobs">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 hidden sm:flex border-blue-200 text-blue-600">
            <Search className="w-4 h-4" /> Find Work
          </Button>
        </Link>
      }
    >
      {tabContent[activeTab] || tabContent["overview"]}
    </DashboardLayout>
    </>
  );
};

export default FreelancerDashboard;
