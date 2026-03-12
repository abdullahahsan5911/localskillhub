import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { CATEGORIES } from "@/constants/categories";
import api from "@/lib/api";
import { buildPointLocation, resolveCurrentBrowserLocation } from "@/lib/location";
import {
  Briefcase, FileText, DollarSign, MapPin, Tag, Clock,
  ChevronRight, ChevronLeft, CheckCircle2, X, Plus, Zap,
  Globe, Users, Star
} from "lucide-react";

type BudgetType = "fixed" | "hourly";
type Duration = "short" | "medium" | "long";
type ExperienceLevel = "beginner" | "intermediate" | "expert";

interface Milestone {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
}

interface JobForm {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetType: BudgetType;
  budgetAmount: number;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  duration: Duration;
  experienceLevel: ExperienceLevel;
  city: string;
  state: string;
  country: string;
  remoteAllowed: boolean;
  milestones: Milestone[];
  attachments: string[];
}

const STEP_TITLES = ["Job Basics", "Requirements", "Budget & Timeline", "Review & Post"];

const PostJob = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login", { replace: true });
      } else if (user && user.role !== "client" && user.role !== "both") {
        navigate("/dashboard/freelancer", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);
  // ...existing code...
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get('jobId');
  const [step, setStep] = useState(() => {
    // Load saved step from localStorage
    if (!editJobId) {
      const saved = localStorage.getItem('postJobStep');
      return saved ? Number(saved) : 1;
    }
    return 1;
  });
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<{ latitude: number; longitude: number } | null>(() => {
    // Load resolved location from localStorage
    if (!editJobId) {
      const saved = localStorage.getItem('postJobResolvedLocation');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [error, setError] = useState("");

  const [form, setForm] = useState<JobForm>(() => {
    // Load saved form from localStorage
    if (!editJobId) {
      const saved = localStorage.getItem('postJobForm');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
    }
    return {
      title: "",
      description: "",
      category: "",
      skills: [],
      budgetType: "fixed",
      budgetAmount: 0,
      budgetMin: 0,
      budgetMax: 0,
      currency: "INR",
      duration: "medium",
      experienceLevel: "intermediate",
      city: "",
      state: "",
      country: "",
      remoteAllowed: false,
      milestones: [],
      attachments: [],
    };
  });

  const update = (key: keyof JobForm, value: any) => setForm(f => ({ ...f, [key]: value }));
  const updateLocationField = (key: 'city' | 'state' | 'country', value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setResolvedLocation(null);
  };

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!editJobId) {
      localStorage.setItem('postJobForm', JSON.stringify(form));
    }
  }, [form, editJobId]);

  // Save step to localStorage whenever it changes
  useEffect(() => {
    if (!editJobId) {
      localStorage.setItem('postJobStep', String(step));
    }
  }, [step, editJobId]);

  // Save resolved location to localStorage whenever it changes
  useEffect(() => {
    if (!editJobId) {
      if (resolvedLocation) {
        localStorage.setItem('postJobResolvedLocation', JSON.stringify(resolvedLocation));
      } else {
        localStorage.removeItem('postJobResolvedLocation');
      }
    }
  }, [resolvedLocation, editJobId]);

  useEffect(() => {
    const loadExistingJob = async () => {
      if (!editJobId) return;

      try {
        setLoadingJob(true);
        const response = await api.getJob(editJobId);
        const job = (response.data as any)?.job || response.data;
        if (!job) return;

        setForm({
          title: job.title || "",
          description: job.description || "",
          category: job.category || "",
          skills: job.skills || [],
          budgetType: job.budget?.type || "fixed",
          budgetAmount: job.budget?.amount || 0,
          budgetMin: job.budget?.min || 0,
          budgetMax: job.budget?.max || 0,
          currency: job.budget?.currency || "INR",
          duration: job.duration || "medium",
          experienceLevel: job.experienceLevel || "intermediate",
          city: job.location?.city || "",
          state: job.location?.state || "",
          country: job.location?.country || "India",
          remoteAllowed: Boolean(job.remoteAllowed),
          milestones: (job.milestones || []).map((milestone: any) => ({
            title: milestone.title || "",
            description: milestone.description || "",
            amount: milestone.amount || 0,
            dueDate: milestone.dueDate ? String(milestone.dueDate).slice(0, 10) : "",
          })),
          attachments: [],
        });

        const jobCoords = job.location?.coordinates?.coordinates;
        if (Array.isArray(jobCoords) && jobCoords.length >= 2) {
          setResolvedLocation({ latitude: Number(jobCoords[1]), longitude: Number(jobCoords[0]) });
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load job for editing');
      } finally {
        setLoadingJob(false);
      }
    };

    loadExistingJob();
  }, [editJobId]);

  const addSkill = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (e) e.preventDefault();
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill)) {
      update("skills", [...form.skills, skill]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => update("skills", form.skills.filter(s => s !== skill));

  const addMilestone = () => update("milestones", [...form.milestones, { title: "", description: "", amount: 0, dueDate: "" }]);

  const updateMilestone = (i: number, key: keyof Milestone, val: any) => {
    const updated = [...form.milestones];
    updated[i] = { ...updated[i], [key]: val };
    update("milestones", updated);
  };

  const removeMilestone = (i: number) => update("milestones", form.milestones.filter((_, j) => j !== i));

  const canProceed = () => {
    if (step === 1) {
      const titleValid = form.title.trim().length > 5;
      const descValid = form.description.trim().length > 20;
      const cityValid = form.city.trim().length > 0;
      const stateValid = form.state.trim().length > 0;
      console.log('Step 1 validation:', { titleValid, descValid, cityValid, stateValid });
      return titleValid && descValid && cityValid && stateValid;
    }
    if (step === 2) {
      const categoryValid = form.category.length > 0;
      const skillsValid = form.skills.length > 0;
      console.log('Step 2 validation:', { categoryValid, skillsValid, category: form.category, skills: form.skills });
      return categoryValid && skillsValid;
    }
    if (step === 3) {
      const valid = form.budgetType === "fixed" ? form.budgetAmount > 0 : (form.budgetMin > 0 && form.budgetMax >= form.budgetMin);
      console.log('Step 3 validation:', { budgetType: form.budgetType, budgetAmount: form.budgetAmount, budgetMin: form.budgetMin, budgetMax: form.budgetMax, valid });
      return valid;
    }
    return true;
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setError("");
      const resolved = await resolveCurrentBrowserLocation();
      setForm(f => ({
        ...f,
        city: resolved.city,
        state: resolved.state,
        country: resolved.country || 'India',
      }));
      setResolvedLocation({ latitude: resolved.latitude, longitude: resolved.longitude });
    } catch (e: any) {
      setError(e.message || 'Unable to detect current location');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      let latitude: number;
      let longitude: number;

      if (resolvedLocation) {
        latitude = resolvedLocation.latitude;
        longitude = resolvedLocation.longitude;
      } else {
        const geocode = await api.geocodeAddress([form.city, form.state, form.country].filter(Boolean).join(', '));
        latitude = Number((geocode.data as any)?.latitude);
        longitude = Number((geocode.data as any)?.longitude);
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Unable to resolve job location coordinates');
      }

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        skills: form.skills,
        budget: {
          type: form.budgetType,
          amount: form.budgetType === "fixed" ? form.budgetAmount : form.budgetMax,
          currency: form.currency,
          min: form.budgetMin || undefined,
          max: form.budgetMax || undefined,
        },
        duration: form.duration,
        experienceLevel: form.experienceLevel,
        location: buildPointLocation({
          city: form.city,
          state: form.state,
          country: form.country,
          latitude,
          longitude,
        }),
        remoteAllowed: form.remoteAllowed,
        milestones: form.milestones.filter(m => m.title.trim()),
        status: "open",
      };
      if (editJobId) {
        await api.updateJob(editJobId, payload);
      } else {
        await api.createJob(payload);
      }
      
      // Clear localStorage after successful submission
      if (!editJobId) {
        localStorage.removeItem('postJobForm');
        localStorage.removeItem('postJobStep');
        localStorage.removeItem('postJobResolvedLocation');
      }
      
      navigate("/dashboard/client");
    } catch (e: any) {
      setError(e.message || "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.id === form.category);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{editJobId ? 'Edit Job' : 'Post a Job'}</h1>
            <p className="text-gray-500 mt-1">{editJobId ? 'Update this job so it appears correctly on maps' : 'Find the perfect freelancer for your project'}</p>
            {!editJobId && (
              <p className="text-xs text-green-600 mt-2">✓ Your progress is automatically saved</p>
            )}
          </div>

          {loadingJob && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Loading job details...
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEP_TITLES.map((title, i) => {
                const num = i + 1;
                const done = step > num;
                const active = step === num;
                return (
                  <div key={title} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : num}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${active ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"}`}>
                      {title}
                    </span>
                    {i < STEP_TITLES.length - 1 && (
                      <div className={`h-0.5 w-6 sm:w-12 mx-1 rounded-full ${done ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Tell us about your project</h2>
                    <p className="text-sm text-gray-500">Start with a clear title and description</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Job Title *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="e.g. Build a React Native Mobile App for Food Delivery"
                    value={form.title}
                    onChange={e => update("title", e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/100</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description *</label>
                  <textarea
                    rows={7}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                    placeholder="Describe your project in detail:&#10;&#10;• What needs to be built&#10;• Features required&#10;• Any specific requirements&#10;• Expected deliverables"
                    value={form.description}
                    onChange={e => update("description", e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.description.length} characters (min. 20)</p>
                </div>

                {/* Location */}
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-800">Location</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                    >
                      {locating ? 'Detecting...' : 'Use my current location'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City (e.g. Mumbai)"
                        value={form.city}
                        onChange={e => updateLocationField("city", e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="State"
                      value={form.state}
                      onChange={e => updateLocationField("state", e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Country"
                      value={form.country}
                      onChange={e => updateLocationField("country", e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Coordinates are generated automatically from this location for map visibility, or you can fill from your current device location.</p>
                </div>

                <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={form.remoteAllowed}
                    onChange={e => update("remoteAllowed", e.target.checked)}
                  />
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Remote work is acceptable</span>
                  </div>
                </label>
              </div>
            )}

            {/* Step 2: Requirements */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Skills & Requirements</h2>
                    <p className="text-sm text-gray-500">Help freelancers understand what you need</p>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Category *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.slice(0, 12).map(cat => {
                      const Icon = cat.icon;
                      const selected = form.category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => update("category", cat.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                            selected
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: selected ? undefined : cat.color }} />
                          <span className="truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {CATEGORIES.length > 12 && (
                    <div className="mt-2">
                      <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={form.category}
                        onChange={e => update("category", e.target.value)}
                      >
                        <option value="">Or select from all categories...</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Required Skills * (press Enter to add)</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. React.js, Node.js, MongoDB..."
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={addSkill}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.skills.map(skill => (
                      <span key={skill} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Experience Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "beginner", label: "Beginner", desc: "Entry-level", icon: "🌱" },
                      { value: "intermediate", label: "Intermediate", desc: "Some experience", icon: "⚡" },
                      { value: "expert", label: "Expert", desc: "Highly experienced", icon: "🏆" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => update("experienceLevel", opt.value)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          form.experienceLevel === opt.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-2xl mb-1">{opt.icon}</div>
                        <p className={`text-sm font-semibold ${form.experienceLevel === opt.value ? "text-blue-700" : "text-gray-900"}`}>{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Budget */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Budget & Timeline</h2>
                    <p className="text-sm text-gray-500">Set your budget expectations</p>
                  </div>
                </div>

                {/* Budget type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Payment Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "fixed", label: "Fixed Price", desc: "One-time payment", icon: Zap },
                      { value: "hourly", label: "Hourly Rate", desc: "Pay per hour", icon: Clock },
                    ].map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => update("budgetType", opt.value)}
                          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                            form.budgetType === opt.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${form.budgetType === opt.value ? "text-blue-600" : "text-gray-500"}`} />
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${form.budgetType === opt.value ? "text-blue-700" : "text-gray-900"}`}>{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget amount */}
                {form.budgetType === "fixed" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Budget Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="25000"
                        value={form.budgetAmount || ""}
                        onChange={e => update("budgetAmount", Number(e.target.value))}
                        min="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Hourly Rate Range (₹/hr) *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Min ₹</span>
                        <input
                          type="number"
                          className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="500"
                          value={form.budgetMin || ""}
                          onChange={e => update("budgetMin", Number(e.target.value))}
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Max ₹</span>
                        <input
                          type="number"
                          className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="2000"
                          value={form.budgetMax || ""}
                          onChange={e => update("budgetMax", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Project Duration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "short", label: "Short", desc: "< 1 month" },
                      { value: "medium", label: "Medium", desc: "1–3 months" },
                      { value: "long", label: "Long", desc: "> 3 months" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => update("duration", opt.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          form.duration === opt.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${form.duration === opt.value ? "text-blue-700" : "text-gray-900"}`}>{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-800">Milestones (optional)</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addMilestone}
                      className="rounded-xl gap-1 text-blue-600 border-blue-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {form.milestones.map((m, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Milestone {i + 1}</span>
                          <button onClick={() => removeMilestone(i)} className="text-gray-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Milestone title"
                            value={m.title}
                            onChange={e => updateMilestone(i, "title", e.target.value)}
                          />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                            <input
                              type="number"
                              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Amount"
                              value={m.amount || ""}
                              onChange={e => updateMilestone(i, "amount", Number(e.target.value))}
                            />
                          </div>
                        </div>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={m.dueDate}
                          onChange={e => updateMilestone(i, "dueDate", e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Review Your Job</h2>
                    <p className="text-sm text-gray-500">Double-check before posting</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Title", value: form.title },
                    { label: "Category", value: selectedCat?.name || form.category },
                    { label: "Experience", value: form.experienceLevel },
                    { label: "Budget", value: form.budgetType === "fixed"
                      ? `₹${form.budgetAmount.toLocaleString()} (fixed)`
                      : `₹${form.budgetMin} – ₹${form.budgetMax}/hr` },
                    { label: "Duration", value: { short: "< 1 month", medium: "1–3 months", long: "> 3 months" }[form.duration] },
                    { label: "Location", value: [form.city, form.state].filter(Boolean).join(", ") || (form.remoteAllowed ? "Remote" : "Not specified") },
                  ].map(item => (
                    <div key={item.label} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900 text-right max-w-56">{item.value}</span>
                    </div>
                  ))}

                  <div className="py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500 block mb-2">Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {form.skills.map(s => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm text-gray-500 block mb-2">Description</span>
                    <p className="text-sm text-gray-800 line-clamp-4">{form.description}</p>
                  </div>

                  {form.milestones.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 block mb-2">Milestones ({form.milestones.length})</span>
                      <div className="space-y-2">
                        {form.milestones.filter(m => m.title).map((m, i) => (
                          <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-800">{m.title}</span>
                            <span className="font-medium">₹{m.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className={`flex gap-3 mt-8 ${step > 1 ? "justify-between" : "justify-end"}`}>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(s => s - 1)}
                  className="rounded-xl gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              )}
              {step < 4 ? (
                <div className="flex flex-col items-end gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      console.log('Continue button clicked', { step, canProceed: canProceed() });
                      setStep(s => s + 1);
                    }}
                    disabled={!canProceed()}
                    className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                  {!canProceed() && (
                    <p className="text-xs text-red-500">
                      {step === 1 && "Please fill in title (6+ chars), description (20+ chars), city, and state"}
                      {step === 2 && "Please select a category and add at least one skill"}
                      {step === 3 && "Please enter a valid budget amount"}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-2 px-8"
                >
                  {submitting ? "Posting..." : "Post Job"}
                  {!submitting && <CheckCircle2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostJob;
