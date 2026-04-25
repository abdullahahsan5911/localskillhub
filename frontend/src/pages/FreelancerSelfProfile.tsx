import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { PortfolioTab, AssetsTab } from "./FreelancerDashboard";
import type { FreelancerProfile, AssetItem } from "./freelancer-dashboard/types";
import { Button } from "@/components/ui/button";
import LocationSelector from "@/components/LocationSelector";
import { Camera, Loader, CheckCircle, MapPin, X, Plus, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { buildPointLocation, resolveCurrentBrowserLocation } from "@/lib/location";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { PayoutManager } from "@/components/payouts";
import { TabBar, ProfileHeader, ProfileSidebar, MainContent, Panel, ToolBadgeList } from "@/components/freelancer";
import { TOOL_OPTIONS, getToolIconColorClass } from "@/constants/tools";
import { SKILL_OPTIONS, getSkillIcon } from "@/constants/skills";

// Tab configuration
interface ProfileAndSkillsPanelProps {
  profile: FreelancerProfile | null;
  name: string;
  setName: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  locating: boolean;
  handleUseCurrentLocation: () => void;
  minRate: string;
  setMinRate: (v: string) => void;
  maxRate: string;
  setMaxRate: (v: string) => void;
  handleSave: () => void;
  saved: boolean;
  saveError: string;
  resetResolvedLocation: () => void;
}

// Tab configuration
const TABS = [
  { id: "profile", label: "Profile" },
  { id: "skills", label: "Skills & Social Links" },
  { id: "education", label: "Education" },
  { id: "certificates", label: "Certificates" },
  { id: "portfolio", label: "Showcase Your Work" },
  { id: "assets", label: "Assets" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const FirstAddCard = ({
  title,
  description,
  buttonText,
  onAdd,
}: {
  title: string;
  description: string;
  buttonText: string;
  onAdd: () => void;
}) => (
  <div className="rounded-2xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center bg-white shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
      <Plus className="w-7 h-7 text-blue-500" />
    </div>
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
    <button
      onClick={onAdd}
      className="mt-5 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
    >
      <Plus className="w-4 h-4" /> {buttonText}
    </button>
  </div>
);

const blueFieldCls = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition";
const bluePrimaryBtnCls = "bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl px-3 sm:px-4 text-xs sm:text-sm";

// Main component
const FreelancerSelfProfile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [bannerUrl, setBannerUrl] = useState((user as any)?.bannerImage || "");
  const [availability, setAvailability] = useState("available");
  const [sidebarTools, setSidebarTools] = useState<string[]>([]);
  const [savingSidebarTools, setSavingSidebarTools] = useState(false);
  const [sidebarToolsPage, setSidebarToolsPage] = useState(0);

  const loadFreelancerData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, assetsRes] = await Promise.allSettled([
        api.getFreelancer((user as any)?._id || ""),
        api.getMyAssets(),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        const d = profileRes.value.data as any;
        setProfile(d.freelancer || d.data?.freelancer || null);
      }
      if (assetsRes.status === "fulfilled" && assetsRes.value?.data) {
        const d = assetsRes.value.data as any;
        setAssets(d.assets || d.data?.assets || d || []);
      }
    } catch (err) {
      console.error("Failed to load freelancer self profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "freelancer") {
      loadFreelancerData();
    }
  }, [user?._id, user?.role]);

  useEffect(() => {
    // Update avatar and banner when user changes
    setAvatarUrl(user?.avatar || "");
    setBannerUrl((user as any)?.bannerImage || "");
  }, [user?.avatar, (user as any)?.bannerImage]);

  useEffect(() => {
    if (location.hash === "#freelancer-portfolio-section") {
      setActiveTab("portfolio");
    } else if (location.hash === "#freelancer-assets-section") {
      setActiveTab("assets");
    } else if (location.hash === "#freelancer-skills-section") {
      setActiveTab("skills");
    } else if (location.hash === "#freelancer-education-section") {
      setActiveTab("education");
    } else if (location.hash === "#freelancer-certificates-section") {
      setActiveTab("certificates");
    }
  }, [location.hash]);

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.replace("#", "");
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, loading, activeTab]);

  useEffect(() => {
    setAvailability(profile?.availability?.status || "unavailable");
  }, [profile?.availability?.status]);

  useEffect(() => {
    setSidebarTools(Array.isArray(profile?.tools) ? profile.tools.filter(Boolean) : []);
  }, [profile?.tools]);

  const ensureFreelancerProfile = async (seedData: Partial<FreelancerProfile> = {}) => {
    if (profile) return profile;

    const fallbackTitle = String(seedData.title || user?.name || "Freelancer").trim() || "Freelancer";

    const fallbackPayload = {
      title: fallbackTitle,
      bio: (seedData.bio || "") as string,
      skills: Array.isArray(seedData.skills) ? seedData.skills : [],
      tools: Array.isArray(seedData.tools) ? seedData.tools : [],
      education: Array.isArray(seedData.education) ? seedData.education : [],
      certifications: Array.isArray(seedData.certifications) ? seedData.certifications : [],
      rates: {
        minRate: Number((seedData as any)?.rates?.minRate ?? 0),
        maxRate: Number((seedData as any)?.rates?.maxRate ?? 0),
        currency: (seedData as any)?.rates?.currency || DEFAULT_CURRENCY,
        rateType: (seedData as any)?.rates?.rateType || "hourly",
      },
      availability: {
        status: (seedData as any)?.availability?.status || availability || "available",
      },
    };

    const response = await api.createFreelancerProfile(fallbackPayload);
    const created = (response as any)?.data?.data?.profile || (response as any)?.data?.profile || null;

    if (created) {
      setProfile(created as FreelancerProfile);
    }

    await loadFreelancerData();
    return created;
  };

  if (!user) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <FreelancerProfileSettings
            user={user}
            profile={profile}
            onRefresh={loadFreelancerData}
            availability={availability}
          />
        );
      case "skills":
        return <FreelancerSkillsSettings user={user} profile={profile} onRefresh={loadFreelancerData} ensureProfile={ensureFreelancerProfile} />;
      case "education":
        return <FreelancerEducationSettings profile={profile} onRefresh={loadFreelancerData} ensureProfile={ensureFreelancerProfile} />;
      case "certificates":
        return <FreelancerCertificatesSettings profile={profile} onRefresh={loadFreelancerData} ensureProfile={ensureFreelancerProfile} />;
      case "portfolio":
        return (
          <div id="freelancer-portfolio-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <PortfolioTab profile={profile} onRefresh={loadFreelancerData} />
          </div>
        );
      case "assets":
        return (
          <div id="freelancer-assets-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <AssetsTab assets={assets} onRefresh={loadFreelancerData} />
          </div>
        );
    }
  };

  const locationString = [user?.location?.city, user?.location?.state, user?.location?.country]
    .filter(Boolean)
    .join(", ") || "Location not set";

  const handleAvailabilityChange = async (nextStatus: string) => {
    setAvailability(nextStatus);
    if (!profile) return;
    try {
      await api.updateFreelancerProfile({ availability: { status: nextStatus } });
      loadFreelancerData();
    } catch (error) {
      console.error("Failed to update availability", error);
    }
  };

  const persistSidebarTools = async (nextTools: string[]) => {
    try {
      setSavingSidebarTools(true);
      if (profile) {
        await api.updateFreelancerProfile({ tools: nextTools });
        setProfile((prev) => (prev ? { ...prev, tools: nextTools } : prev));
      } else {
        await ensureFreelancerProfile({ tools: nextTools });
      }
      await loadFreelancerData();
    } catch (error) {
      console.error("Failed to update tools", error);
      setSidebarTools(Array.isArray(profile?.tools) ? profile.tools.filter(Boolean) : []);
    } finally {
      setSavingSidebarTools(false);
    }
  };

  const handleToggleSidebarTool = (toolLabel: string) => {
    const exists = sidebarTools.some((t) => t.toLowerCase() === toolLabel.toLowerCase());
    const nextTools = exists
      ? sidebarTools.filter((t) => t.toLowerCase() !== toolLabel.toLowerCase())
      : [...sidebarTools, toolLabel];

    setSidebarTools(nextTools);
    void persistSidebarTools(nextTools);
  };

  const SIDEBAR_TOOLS_PAGE_SIZE = 9;
  const sidebarToolsTotalPages = Math.max(1, Math.ceil(TOOL_OPTIONS.length / SIDEBAR_TOOLS_PAGE_SIZE));
  const sidebarToolsStartIndex = sidebarToolsPage * SIDEBAR_TOOLS_PAGE_SIZE;
  const visibleSidebarToolOptions = TOOL_OPTIONS.slice(
    sidebarToolsStartIndex,
    sidebarToolsStartIndex + SIDEBAR_TOOLS_PAGE_SIZE,
  );

  return (
    <div className=" bg-slate-50 ">
      {/* Profile Header with Banner */}
      <ProfileHeader
        avatarUrl={avatarUrl}
        name={user?.name || ""}
        bannerUrl={bannerUrl}
        onAvatarUpdate={(url) => {
          setAvatarUrl(url);
          loadFreelancerData();
        }}
        onBannerUpdate={(url) => {
          setBannerUrl(url);
          loadFreelancerData();
        }}
      />

      {/* Main Layout - Sidebar + Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 md:gap-8 pt-20 pb-12">
        {/* Left Sidebar */}
        <ProfileSidebar
          name={user?.name || ""}
          title={profile?.title || "Freelancer"}
          location={locationString}
          email={user?.email || ""}
          onEditClick={() => setActiveTab("profile")}
          onCustomizeClick={() => setActiveTab("portfolio")}
          availabilitySection={
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Showcase Your Availability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Activate your hiring availability to receive inquiries, send proposals, and connect with brands seeking your skills.
              </p>
              <div className="mt-3">
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  value={availability}
                  onChange={(e) => {
                    void handleAvailabilityChange(e.target.value);
                  }}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          }
          children={
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Tools</h3>
              <p className="text-xs text-slate-500 mb-3">Select tools from icons below.</p>

              <div className="grid grid-cols-3 gap-2">
                {visibleSidebarToolOptions.map((tool) => {
                  const selected = sidebarTools.some((t) => t.toLowerCase() === tool.label.toLowerCase());
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.value}
                      type="button"
                      onClick={() => handleToggleSidebarTool(tool.label)}
                      className={`group relative h-14 rounded-xl border transition-all ${
                        selected
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                      aria-label={tool.label}
                      title={tool.label}
                    >
                      <Icon className={`mx-auto h-7 w-7 ${selected ? "text-blue-700" : getToolIconColorClass(tool.value)}`} />
                      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 whitespace-nowrap">
                        {tool.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {sidebarToolsTotalPages > 1 && (
                <div className="mt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg px-2"
                    disabled={sidebarToolsPage === 0}
                    onClick={() => setSidebarToolsPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-[11px] text-slate-500">
                    {sidebarToolsPage + 1} / {sidebarToolsTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg px-2"
                    disabled={sidebarToolsPage >= sidebarToolsTotalPages - 1}
                    onClick={() => setSidebarToolsPage((p) => Math.min(sidebarToolsTotalPages - 1, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {sidebarTools.length > 0 ? (
                <ToolBadgeList
                  tools={sidebarTools}
                  limit={8}
                  className="flex flex-wrap gap-1.5 mt-3"
                  itemClassName="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] border border-slate-200"
                  iconClassName="w-3 h-3 text-slate-500"
                  labelClassName="font-medium"
                />
              ) : (
                <p className="text-xs text-slate-500 mt-3">No tools added yet.</p>
              )}

              {savingSidebarTools && <p className="text-[11px] text-slate-400 mt-2">Saving tools...</p>}

            </div>
          }
        />

        {/* Right Content Area */}
        <MainContent>
          <div className="space-y-6">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} loading={loading} />
            {renderTabContent()}
          </div>
        </MainContent>
      </div>
    </div>
  );
};

// Profile Settings Component
interface FreelancerProfileSettingsProps {
  user: any;
  profile: FreelancerProfile | null;
  onRefresh: () => void;
  availability: string;
}

const FreelancerProfileSettings: React.FC<FreelancerProfileSettingsProps> = ({
  user,
  profile,
  onRefresh,
  availability,
}) => {
  // Basic profile state
  const [name, setName] = useState(user?.name || "");
  const [title, setTitle] = useState(profile?.title || "");
  const [bio, setBio] = useState(profile?.bio || "");

  // Location state
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

  // Rates state
  const [minRate, setMinRate] = useState(profile?.rates?.minRate?.toString() || "");
  const [maxRate, setMaxRate] = useState(profile?.rates?.maxRate?.toString() || "");

  // Form submission state
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Sync local state when profile updates
  useEffect(() => {
    if (profile) {
      setTitle(profile.title || "");
      setBio(profile.bio || "");
      setMinRate(profile.rates?.minRate?.toString() || "");
      setMaxRate(profile.rates?.maxRate?.toString() || "");
    }
  }, [profile]);

  useEffect(() => {
    const hasExistingData = Boolean(
      profile?.title ||
      profile?.bio ||
      profile?.rates?.minRate ||
      profile?.rates?.maxRate ||
      user?.location?.city ||
      user?.location?.state ||
      user?.location?.country
    );
    setShowForm(hasExistingData);
  }, [profile, user?.location]);

  // Sync user data when user updates
  useEffect(() => {
    setName(user?.name || "");
    setCity(user?.location?.city || "");
    setState(user?.location?.state || "");
    setCountry(user?.location?.country || "India");
    const coords = user?.location?.coordinates?.coordinates;
    setResolvedLocation(
      Array.isArray(coords) && coords.length >= 2
        ? { latitude: Number(coords[1]), longitude: Number(coords[0]) }
        : null
    );
  }, [user?.name, user?.location]);
  // Location handlers
  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setSaveError("");
      const resolved = await resolveCurrentBrowserLocation();
      setCity(resolved.city);
      setState(resolved.state);
      setCountry(resolved.country || "India");
      setResolvedLocation({ latitude: resolved.latitude, longitude: resolved.longitude });
    } catch (error: any) {
      setSaveError(error.message || "Unable to detect your current location");
    } finally {
      setLocating(false);
    }
  };

  const resetResolvedLocation = () => {
    setResolvedLocation(null);
  };

  // Save profile changes
  const handleSave = async () => {
    try {
      setSaveError("");

      let latitude: number;
      let longitude: number;

      if (resolvedLocation) {
        latitude = resolvedLocation.latitude;
        longitude = resolvedLocation.longitude;
      } else {
        const geocode = await api.geocodeAddress([city, state, country].filter(Boolean).join(", "));
        latitude = Number((geocode.data as any)?.latitude);
        longitude = Number((geocode.data as any)?.longitude);
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Unable to resolve your location coordinates");
      }

      const profilePayload: Partial<FreelancerProfile> & { rates: any; availability: any } = {
        title,
        bio,
        rates: { minRate: Number(minRate), maxRate: Number(maxRate), currency: DEFAULT_CURRENCY, rateType: "hourly" },
        availability: { status: availability },
      };

      await api.updateProfile({
        name,
        location: buildPointLocation({ city, state, country, latitude, longitude }),
      });
      if (profile) await api.updateFreelancerProfile(profilePayload);
      else await api.createFreelancerProfile(profilePayload);

      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message || "Unable to save profile");
    }
  };

  // Payout functionality moved to PayoutManager component



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">Basic information, rates, and location</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Add Profile Details
          </button>
        )}
      </div>

      {!showForm ? (
        <FirstAddCard
          title="Profile details not added yet"
          description="Add your profile basics to help clients quickly understand your expertise and rates."
          buttonText="Add Profile Details"
          onAdd={() => setShowForm(true)}
        />
      ) : (
        <>
          <ProfileAndSkillsPanel
            {...{
              name, setName, title, setTitle, bio, setBio,
              city,
              setCity, state, setState, country, setCountry,
              locating, handleUseCurrentLocation, minRate, setMinRate,
              maxRate, setMaxRate,
              handleSave, saved, saveError, resetResolvedLocation
            }}
            profile={profile}
          />

          <PayoutManager
            profile={profile}
            onPayoutUpdate={() => { }}
            onWithdrawalSubmitted={() => { }}
          />
        </>
      )}
    </div>
  );
};

interface FreelancerEducationSettingsProps {
  profile: FreelancerProfile | null;
  onRefresh: () => void;
  ensureProfile: (seedData?: Partial<FreelancerProfile>) => Promise<any>;
}

const FreelancerEducationSettings: React.FC<FreelancerEducationSettingsProps> = ({ profile, onRefresh, ensureProfile }) => {
  const [education, setEducation] = useState<Array<{ institution: string; degree: string; field: string; startYear: string; endYear: string }>>(
    Array.isArray(profile?.education)
      ? profile.education.map((e: any) => ({
        institution: e.institution || "",
        degree: e.degree || "",
        field: e.field || "",
        startYear: e.startYear?.toString() || "",
        endYear: e.endYear?.toString() || "",
      }))
      : []
  );
  const [newInstitution, setNewInstitution] = useState("");
  const [newDegree, setNewDegree] = useState("");
  const [newField, setNewField] = useState("");
  const [newStartYear, setNewStartYear] = useState("");
  const [newEndYear, setNewEndYear] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setEducation(
      Array.isArray(profile?.education)
        ? profile.education.map((e: any) => ({
          institution: e.institution || "",
          degree: e.degree || "",
          field: e.field || "",
          startYear: e.startYear?.toString() || "",
          endYear: e.endYear?.toString() || "",
        }))
        : []
    );
  }, [profile]);

  useEffect(() => {
    setShowForm((profile?.education?.length || 0) > 0);
  }, [profile?.education]);

  const handleAddEducation = () => {
    const institution = newInstitution.trim();
    const degree = newDegree.trim();
    const field = newField.trim();
    const startYear = newStartYear.trim();
    const endYear = newEndYear.trim();
    if (!institution && !degree && !field) return;
    setEducation([...education, { institution, degree, field, startYear, endYear }]);
    setNewInstitution("");
    setNewDegree("");
    setNewField("");
    setNewStartYear("");
    setNewEndYear("");
  };

  const handleSaveEducation = async () => {
    try {
      setSaveError("");
      const cleanedEducation = education
        .map((e) => ({
          institution: e.institution.trim(),
          degree: e.degree.trim(),
          field: e.field.trim(),
          ...(e.startYear ? { startYear: Number(e.startYear) } : {}),
          ...(e.endYear ? { endYear: Number(e.endYear) } : {}),
        }))
        .filter((e) => e.institution || e.degree || e.field);

      await ensureProfile({ education: cleanedEducation });
      await api.updateFreelancerProfile({ education: cleanedEducation });
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message || "Unable to save education");
    }
  };

  return (
    <div id="freelancer-education-section" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Education</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add your degrees and formal learning background</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Add Education
          </button>
        )}
      </div>

      {!showForm ? (
        <FirstAddCard
          title="No education added yet"
          description="Show your academic background to strengthen trust and credibility."
          buttonText="Add Education"
          onAdd={() => setShowForm(true)}
        />
      ) : (
        <Panel title="Education" icon={<Briefcase size={16} />}>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Education</label>
        <p className="text-[10px] sm:text-[11px] text-slate-400 mb-2 sm:mb-3">Add your degrees, diplomas, or formal training.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input type="text" placeholder="Institution" className={blueFieldCls} value={newInstitution} onChange={(e) => setNewInstitution(e.target.value)} />
          <input type="text" placeholder="Degree" className={blueFieldCls} value={newDegree} onChange={(e) => setNewDegree(e.target.value)} />
          <input type="text" placeholder="Field of study" className={blueFieldCls} value={newField} onChange={(e) => setNewField(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Start year" className={blueFieldCls} value={newStartYear} onChange={(e) => setNewStartYear(e.target.value)} />
            <input type="number" placeholder="End year" className={blueFieldCls} value={newEndYear} onChange={(e) => setNewEndYear(e.target.value)} />
          </div>
        </div>
        <Button type="button" size="sm" className={bluePrimaryBtnCls} onClick={handleAddEducation}>
          <Plus size={14} className="mr-1" /> Add Education
        </Button>
        {education.length > 0 && (
          <div className="mt-3 space-y-2">
            {education.map((item, index) => (
              <div key={`${item.institution}-${item.degree}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.degree || "Education"}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {[item.institution, item.field].filter(Boolean).join(" • ")}
                    {(item.startYear || item.endYear) ? ` (${[item.startYear || "?", item.endYear || "Present"].join(" - ")})` : ""}
                  </p>
                </div>
                <button type="button" className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-colors shrink-0" onClick={() => setEducation(education.filter((_, i) => i !== index))}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pt-1">
        <Button className="w-full rounded-lg sm:rounded-xl font-semibold shadow-sm transition-all text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveEducation}>
          {saved ? "Saved!" : "Save Education"}
        </Button>
        {saveError && (
          <div className="mt-2.5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <p className="text-xs text-red-600">{saveError}</p>
          </div>
        )}
      </div>
        </Panel>
      )}
    </div>
  );
};

interface FreelancerCertificatesSettingsProps {
  profile: FreelancerProfile | null;
  onRefresh: () => void;
  ensureProfile: (seedData?: Partial<FreelancerProfile>) => Promise<any>;
}

const FreelancerCertificatesSettings: React.FC<FreelancerCertificatesSettingsProps> = ({ profile, onRefresh, ensureProfile }) => {
  const [certifications, setCertifications] = useState<Array<{ name: string; issuedBy: string; issuedDate: string; expiryDate: string; credentialId: string; verificationUrl: string }>>(
    Array.isArray(profile?.certifications)
      ? profile.certifications.map((c: any) => ({
        name: c.name || "",
        issuedBy: c.issuedBy || "",
        issuedDate: c.issuedDate ? String(c.issuedDate).slice(0, 10) : "",
        expiryDate: c.expiryDate ? String(c.expiryDate).slice(0, 10) : "",
        credentialId: c.credentialId || "",
        verificationUrl: c.verificationUrl || "",
      }))
      : []
  );
  const [newCert, setNewCert] = useState({ name: "", issuedBy: "", issuedDate: "", expiryDate: "", credentialId: "", verificationUrl: "" });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setCertifications(
      Array.isArray(profile?.certifications)
        ? profile.certifications.map((c: any) => ({
          name: c.name || "",
          issuedBy: c.issuedBy || "",
          issuedDate: c.issuedDate ? String(c.issuedDate).slice(0, 10) : "",
          expiryDate: c.expiryDate ? String(c.expiryDate).slice(0, 10) : "",
          credentialId: c.credentialId || "",
          verificationUrl: c.verificationUrl || "",
        }))
        : []
    );
  }, [profile]);

  useEffect(() => {
    setShowForm((profile?.certifications?.length || 0) > 0);
  }, [profile?.certifications]);

  const handleSaveCertificates = async () => {
    try {
      setSaveError("");
      const cleaned = certifications
        .map((c) => ({
          name: c.name.trim(),
          issuedBy: c.issuedBy.trim(),
          ...(c.issuedDate ? { issuedDate: c.issuedDate } : {}),
          ...(c.expiryDate ? { expiryDate: c.expiryDate } : {}),
          credentialId: c.credentialId.trim(),
          verificationUrl: c.verificationUrl.trim(),
        }))
        .filter((c) => c.name.length > 0);

      await ensureProfile({ certifications: cleaned });
      await api.updateFreelancerProfile({ certifications: cleaned });
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message || "Unable to save certificates");
    }
  };

  return (
    <div id="freelancer-certificates-section" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Certificates</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add certifications and credentials clients can verify</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Add Certificate
          </button>
        )}
      </div>

      {!showForm ? (
        <FirstAddCard
          title="No certificates added yet"
          description="Add credentials that prove your expertise and improve hiring confidence."
          buttonText="Add Certificate"
          onAdd={() => setShowForm(true)}
        />
      ) : (
        <Panel title="Certificates" icon={<Briefcase size={16} />}>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Certificates</label>
        <p className="text-[10px] sm:text-[11px] text-slate-400 mb-2 sm:mb-3">Add your certifications and credentials.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input type="text" placeholder="Certificate name" className={blueFieldCls} value={newCert.name} onChange={(e) => setNewCert((p) => ({ ...p, name: e.target.value }))} />
          <input type="text" placeholder="Issued by" className={blueFieldCls} value={newCert.issuedBy} onChange={(e) => setNewCert((p) => ({ ...p, issuedBy: e.target.value }))} />
          <input type="date" className={blueFieldCls} value={newCert.issuedDate} onChange={(e) => setNewCert((p) => ({ ...p, issuedDate: e.target.value }))} />
          <input type="date" className={blueFieldCls} value={newCert.expiryDate} onChange={(e) => setNewCert((p) => ({ ...p, expiryDate: e.target.value }))} />
          <input type="text" placeholder="Credential ID" className={blueFieldCls} value={newCert.credentialId} onChange={(e) => setNewCert((p) => ({ ...p, credentialId: e.target.value }))} />
          <input type="url" placeholder="Verification URL" className={blueFieldCls} value={newCert.verificationUrl} onChange={(e) => setNewCert((p) => ({ ...p, verificationUrl: e.target.value }))} />
        </div>
        <Button type="button" size="sm" className={bluePrimaryBtnCls} onClick={() => {
          if (!newCert.name.trim()) return;
          setCertifications([...certifications, { ...newCert, name: newCert.name.trim(), issuedBy: newCert.issuedBy.trim(), credentialId: newCert.credentialId.trim(), verificationUrl: newCert.verificationUrl.trim() }]);
          setNewCert({ name: "", issuedBy: "", issuedDate: "", expiryDate: "", credentialId: "", verificationUrl: "" });
        }}>
          <Plus size={14} className="mr-1" /> Add Certificate
        </Button>
        {certifications.length > 0 && (
          <div className="mt-3 space-y-2">
            {certifications.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 truncate">{[item.issuedBy, item.issuedDate].filter(Boolean).join(" • ")}</p>
                </div>
                <button type="button" className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-colors shrink-0" onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pt-1">
        <Button className="w-full rounded-lg sm:rounded-xl font-semibold shadow-sm transition-all text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveCertificates}>
          {saved ? "Saved!" : "Save Certificates"}
        </Button>
        {saveError && (
          <div className="mt-2.5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <p className="text-xs text-red-600">{saveError}</p>
          </div>
        )}
      </div>
        </Panel>
      )}
    </div>
  );
};

interface FreelancerSkillsSettingsProps {
  user: any;
  profile: FreelancerProfile | null;
  onRefresh: () => void;
  ensureProfile: (seedData?: Partial<FreelancerProfile>) => Promise<any>;
}

const FreelancerSkillsSettings: React.FC<FreelancerSkillsSettingsProps> = ({ user, profile, onRefresh, ensureProfile }) => {
  const normalizeSkillLevel = (level?: string) => {
    return ["beginner", "intermediate", "expert"].includes(level || "")
      ? (level as string)
      : "intermediate";
  };

  const [skills, setSkills] = useState<{ name: string; level: string }[]>(
    Array.isArray(profile?.skills)
      ? profile.skills.map((s: any) => ({ name: s.name || "", level: normalizeSkillLevel(s.level) }))
      : []
  );
  const [selectedSkill, setSelectedSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("intermediate");
  const [portfolioWebsite, setPortfolioWebsite] = useState(user?.socialLinks?.portfolio || "");
  const [githubLink, setGithubLink] = useState(user?.socialLinks?.github || "");
  const [instagramLink, setInstagramLink] = useState(user?.socialLinks?.instagram || "");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setSkills(
      Array.isArray(profile?.skills)
        ? profile.skills.map((s: any) => ({ name: s.name || "", level: normalizeSkillLevel(s.level) }))
        : []
    );
  }, [profile]);

  useEffect(() => {
    setShowForm(
      (profile?.skills?.length || 0) > 0 ||
      Boolean(user?.socialLinks?.portfolio || user?.socialLinks?.github || user?.socialLinks?.instagram)
    );
  }, [profile?.skills, user?.socialLinks?.portfolio, user?.socialLinks?.github, user?.socialLinks?.instagram]);

  useEffect(() => {
    setPortfolioWebsite(user?.socialLinks?.portfolio || "");
    setGithubLink(user?.socialLinks?.github || "");
    setInstagramLink(user?.socialLinks?.instagram || "");
  }, [user?.socialLinks?.portfolio, user?.socialLinks?.github, user?.socialLinks?.instagram]);

  const handleAddSkill = () => {
    if (!selectedSkill) {
      return;
    }
    const option = SKILL_OPTIONS.find((skill) => skill.value === selectedSkill);
    if (!option) {
      return;
    }
    if (skills.some((s) => s.name.toLowerCase() === option.label.toLowerCase())) {
      setSelectedSkill("");
      return;
    }
    setSkills([...skills, { name: option.label, level: newSkillLevel }]);
    setSelectedSkill("");
  };

  const handleSaveSkills = async () => {
    try {
      setSaveError("");
      const cleanedSkills = skills
        .map((s) => ({ name: s.name.trim(), level: normalizeSkillLevel(s.level) }))
        .filter((s) => s.name.length > 0);

      await ensureProfile({ skills: cleanedSkills });
      await api.updateFreelancerProfile({
        skills: cleanedSkills,
      });

      await api.updateProfile({
        socialLinks: {
          ...(user?.socialLinks || {}),
          portfolio: portfolioWebsite.trim(),
          github: githubLink.trim(),
          instagram: instagramLink.trim(),
        },
      });
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message || "Unable to save skills");
    }
  };

  return (
    <div id="freelancer-skills-section" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Skills & Social Links</h2>
          <p className="text-xs text-slate-500 mt-0.5">Curate your strengths and keep your public links updated</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Add Skills
          </button>
        )}
      </div>

      {!showForm ? (
        <FirstAddCard
          title="No skills added yet"
          description="Add your skills and social links so clients can discover and verify your work faster."
          buttonText="Add Skills"
          onAdd={() => setShowForm(true)}
        />
      ) : (
        <Panel title="Skills & Social Links" icon={<Briefcase size={16} />}>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Skills</label>
        <p className="text-[10px] sm:text-[11px] text-slate-400 mb-2 sm:mb-3">Select skills from the approved list to keep names consistent.</p>

        <div className="flex flex-col gap-2 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="">Select a skill</option>
              {SKILL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              className="w-full sm:w-32 md:w-40 px-2.5 sm:px-3 py-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            <Button type="button" size="sm" className={`${bluePrimaryBtnCls} shrink-0 w-full sm:w-auto`} onClick={handleAddSkill}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div key={`${skill.name}-${index}`} className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1 sm:py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs sm:text-sm">
                {React.createElement(getSkillIcon(skill.name), { className: "w-3.5 h-3.5 text-slate-500" })}
                <span className="font-semibold text-slate-800 truncate">{skill.name}</span>
                <select className="bg-transparent text-[10px] sm:text-[11px] text-slate-500 focus:outline-none" value={skill.level || "intermediate"} onChange={(e) => setSkills(skills.map((s, i) => (i === index ? { ...s, level: e.target.value } : s)))}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
                <button type="button" className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-colors shrink-0" onClick={() => setSkills(skills.filter((_, i) => i !== index))}>
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Social Links</label>
        <p className="text-[10px] sm:text-[11px] text-slate-400 mb-2 sm:mb-3">Show verified links so clients can view your external work.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <input
              type="url"
              placeholder="Portfolio Website (https://yourportfolio.com)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              value={portfolioWebsite}
              onChange={(e) => setPortfolioWebsite(e.target.value)}
            />
          </div>
          <div>
            <input
              type="url"
              placeholder="GitHub (https://github.com/username)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
            />
          </div>
          <div>
            <input
              type="url"
              placeholder="Instagram (https://instagram.com/username)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pt-1">
        <Button className="w-full rounded-lg sm:rounded-xl font-semibold shadow-sm transition-all text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveSkills}>
          {saved ? "Saved!" : "Save Skills"}
        </Button>
        {saveError && (
          <div className="mt-2.5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <p className="text-xs text-red-600">{saveError}</p>
          </div>
        )}
      </div>
        </Panel>
      )}
    </div>
  );
};



const ProfileAndSkillsPanel: React.FC<ProfileAndSkillsPanelProps> = (props) => (
  <Panel id="freelancer-work-section" title="Profile & Rates" icon={<Briefcase size={16}  />}>
    {/* Basic Info */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
        <input type="text" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition" value={props.name} onChange={(e) => props.setName(e.target.value)} />
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Professional Title</label>
        <input
          type="text"
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
          placeholder="e.g. Full Stack Developer"
          value={props.title}
          onChange={(e) => props.setTitle(e.target.value)}
        />
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Bio</label>
      <textarea
        rows={3}
        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition resize-none"
        value={props.bio}
        onChange={(e) => props.setBio(e.target.value)}
      />
    </div>

    <div className="h-px bg-slate-100" />

    {/* Location */}
    <div>
      <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
        <MapPin size={14} className="sm:w-[16px] sm:h-[16px]" /> Location
      </label>
      <LocationSelector
        className="mb-2 sm:mb-3"
        value={{
          city: props.city,
          state: props.state,
          country: props.country,
        }}
        onChange={(next) => {
          props.setCity(next.city);
          props.setState(next.state);
          props.setCountry(next.country);
          props.resetResolvedLocation();
        }}
        layout="row"
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <p className="text-[10px] sm:text-[11px] text-slate-400">Map coordinates are generated automatically from this location.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg sm:rounded-xl text-xs border-slate-200 shrink-0 w-full sm:w-auto"
          onClick={props.handleUseCurrentLocation}
          disabled={props.locating}
        >
          <MapPin size={12} className="mr-1" />
          {props.locating ? "Detecting…" : "Use current location"}
        </Button>
      </div>
    </div>

    <div className="h-px bg-slate-100" />

    {/* Rates */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Min Rate ({DEFAULT_CURRENCY}/hr)</label>
        <input
          type="number"
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition tabular-nums"
          value={props.minRate}
          onChange={(e) => props.setMinRate(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Max Rate ({DEFAULT_CURRENCY}/hr)</label>
        <input
          type="number"
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition tabular-nums"
          value={props.maxRate}
          onChange={(e) => props.setMaxRate(e.target.value)}
        />
      </div>
    </div>

    {/* Save Button */}
    <div className="pt-1">
      <Button className="w-full rounded-lg sm:rounded-xl font-semibold shadow-sm transition-all text-xs sm:text-sm py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={props.handleSave}>
        {props.saved ? (
          <span className="flex items-center justify-center gap-1.5 sm:gap-2">
            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> Saved!
          </span>
        ) : (
          "Save Changes"
        )}
      </Button>
      {props.saveError && (
        <div className="mt-2.5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-600">{props.saveError}</p>
        </div>
      )}
    </div>
  </Panel>
);

export default FreelancerSelfProfile;
