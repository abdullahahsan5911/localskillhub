import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import LocationSelector from "@/components/LocationSelector";
import api from "@/lib/api";
import { buildPointLocation, resolveCurrentBrowserLocation } from "@/lib/location";
import { MainContent, ProfileHeader, ProfileSidebar } from "@/components/freelancer";
import { useNavigate, useSearchParams } from "react-router-dom";

type ClientSettingsTab = "profile" | "company" | "location";

const ClientSelfProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  if (!user) return null;

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [bannerUrl, setBannerUrl] = useState((user as any)?.bannerImage || "");
  const [activeTab, setActiveTab] = useState<ClientSettingsTab>("profile");

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "company" && user?.accountType !== "company") {
      setActiveTab("profile");
      return;
    }
    if (requestedTab === "location" && user?.accountType === "company") {
      setActiveTab("company");
      return;
    }
    if (requestedTab === "profile" || requestedTab === "company" || requestedTab === "location") {
      setActiveTab(requestedTab);
    }
  }, [searchParams, user?.accountType]);

  const locationText = user.location
    ? [user.location.city, user.location.state, user.location.country]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="bg-slate-50 min-h-screen">
      <ProfileHeader
        avatarUrl={avatarUrl}
        name={user?.name || ""}
        bannerUrl={bannerUrl}
        onAvatarUpdate={(url) => setAvatarUrl(url)}
        onBannerUpdate={(url) => setBannerUrl(url)}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 md:gap-8 pt-20 pb-12">
        <ProfileSidebar
          name={user?.name || ""}
          title="Client account"
          location={locationText || "Location not set"}
          email={user?.email || ""}
          onEditClick={() => {
            setActiveTab("profile");
          }}
          onCustomizeClick={() => {
            setActiveTab(user?.accountType === "company" ? "company" : "profile");
          }}
          availabilitySection={
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Client visibility</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Keep your location updated so freelancers can discover and trust your client profile.
              </p>
            </div>
          }
        />

        <MainContent>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 md:p-6">
            <ClientProfileSettings
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onRefreshUser={refreshUser}
              onNavigate={navigate}
            />
          </div>
        </MainContent>
      </div>
    </div>
  );
};

interface SettingsTabProps {
  user: any;
  activeTab: ClientSettingsTab;
  onTabChange: (tab: ClientSettingsTab) => void;
  onRefreshUser: () => Promise<void>;
  onNavigate: (path: string) => void;
}

const ClientProfileSettings = ({ user, activeTab, onTabChange, onRefreshUser, onNavigate }: SettingsTabProps) => {
  const isCompanyAccount = user?.accountType === "company";
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);
  const [city, setCity] = useState(user?.location?.city || "");
  const [stateName, setStateName] = useState(user?.location?.state || "");
  const [country, setCountry] = useState(user?.location?.country || "India");
  const [locating, setLocating] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saveError, setSaveError] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyCountry, setCompanyCountry] = useState("India");
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [switchingAccountType, setSwitchingAccountType] = useState(false);
  const [switchError, setSwitchError] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const res: any = await api.getMyCompanies();
        const payload = (res?.data as any) || res;
        const companies = (payload?.companies || payload?.data?.companies || []) as Array<any>;
        const primary = companies[0];
        if (!primary) return;

        setCompanyId(primary._id || "");
        setCompanyName(primary.name || "");
        setCompanyDescription(primary.description || "");
        setCompanyIndustry(primary.industry || "");
        setCompanyWebsite(primary.website || "");
        setCompanyCity(primary.location?.city || "");
        setCompanyState(primary.location?.state || "");
        setCompanyCountry(primary.location?.country || "India");
      } catch {
        // Keep form empty if client has no company yet.
      }
    };

    loadCompany();
  }, []);

  const handleSave = async () => {
    try {
      setSaveError("");

      const hasLocationInput = city.trim() && stateName.trim() && country.trim();

      if (!hasLocationInput && !resolvedLocation) {
        await api.updateProfile({ name });
      } else {
        let latitude: number;
        let longitude: number;

        if (resolvedLocation) {
          latitude = resolvedLocation.latitude;
          longitude = resolvedLocation.longitude;
        } else {
          const geocode = await api.geocodeAddress([
            city,
            stateName,
            country,
          ]
            .filter(Boolean)
            .join(", "));
          latitude = Number((geocode.data as any)?.latitude);
          longitude = Number((geocode.data as any)?.longitude);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            throw new Error("Unable to resolve your location coordinates");
          }
        }

        const locationPayload = buildPointLocation({
          city: city.trim(),
          state: stateName.trim(),
          country: country.trim() || "India",
          latitude,
          longitude,
        });

        await api.updateProfile({
          name,
          location: locationPayload,
        });
      }
      await onRefreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err.message || "Unable to save settings");
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setSaveError("");
      const resolved = await resolveCurrentBrowserLocation();
      setCity(resolved.city);
      setStateName(resolved.state);
      setCountry(resolved.country || "India");
      setResolvedLocation({ latitude: resolved.latitude, longitude: resolved.longitude });
    } catch (err: any) {
      setSaveError(err.message || "Unable to detect your current location");
    } finally {
      setLocating(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyName.trim()) {
      setCompanyError("Company name is required.");
      return;
    }

    setCompanySaving(true);
    setCompanyError("");
    try {
      const payload = {
        name: companyName.trim(),
        description: companyDescription.trim() || undefined,
        industry: companyIndustry.trim() || undefined,
        website: companyWebsite.trim() || undefined,
        location:
          companyCity.trim() || companyState.trim() || companyCountry.trim()
            ? {
                city: companyCity.trim() || undefined,
                state: companyState.trim() || undefined,
                country: companyCountry.trim() || undefined,
              }
            : undefined,
      };

      if (companyId) {
        await api.updateCompany(companyId, payload);
      } else {
        const created: any = await api.createCompany(payload);
        const createdCompany = (created?.data as any)?.company || (created?.data as any)?.data?.company;
        if (createdCompany?._id) {
          setCompanyId(createdCompany._id);
        }
      }

      await onRefreshUser();
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 2000);
    } catch (err: any) {
      setCompanyError(err?.message || "Unable to save company details");
    } finally {
      setCompanySaving(false);
    }
  };

  const handleSwitchToCompany = async () => {
    setSwitchingAccountType(true);
    setSwitchError("");
    try {
      await api.updateProfile({ accountType: "company" });
      await onRefreshUser();
      onNavigate("/company-dashboard");
    } catch (err: any) {
      setSwitchError(err?.message || "Unable to switch to company account");
    } finally {
      setSwitchingAccountType(false);
    }
  };

  const handleSwitchToIndividual = async () => {
    setSwitchingAccountType(true);
    setSwitchError("");
    try {
      await api.updateProfile({ accountType: "individual" });
      await onRefreshUser();
      onNavigate("/dashboard/client");
    } catch (err: any) {
      setSwitchError(err?.message || "Unable to switch to individual account");
    } finally {
      setSwitchingAccountType(false);
    }
  };

  return (
    <div className="font-sans">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">Settings</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Manage your client profile, contact details and location preferences.</p>
      </div>

      <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "profile", label: "Profile" },
              ...(isCompanyAccount ? [{ id: "company", label: "Company" }] : []),
              ...(!isCompanyAccount ? [{ id: "location", label: "Location" }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id as ClientSettingsTab)}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 md:space-y-5">
        {activeTab === "profile" && (
          <section
            id="settings-profile-section"
            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 shadow-sm md:shadow-[0_10px_25px_rgba(15,23,42,0.06)] p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5"
          >
            <div>
              <h3 className="text-sm md:text-base font-semibold text-slate-900">Profile details</h3>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">Keep your basic account information accurate for better trust and communication.</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Full name</label>
                <input
                  type="text"
                  className="w-full px-2.5 sm:px-3.5 md:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg md:rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-2.5 sm:px-3.5 md:px-4 py-2 sm:py-2.5 border border-slate-200 rounded-lg md:rounded-xl text-xs sm:text-sm bg-slate-50 text-slate-600"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <Button
                className={`w-full rounded-lg md:rounded-xl text-xs sm:text-sm py-2 sm:py-2.5 ${saved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"} text-white shadow-sm ${saved ? "shadow-emerald-600/20" : "shadow-blue-600/20"}`}
                onClick={handleSave}
              >
                {saved ? "Saved!" : "Save profile"}
              </Button>
              {saveError && (
                <p className="text-xs text-red-600 mt-1">{saveError}</p>
              )}

              {!isCompanyAccount && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs sm:text-sm font-medium text-blue-900">Need a company workspace?</p>
                  <p className="text-xs text-blue-700 mt-1">Switch account type explicitly to access the company dashboard and company posting tools.</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSwitchToCompany}
                    disabled={switchingAccountType}
                  >
                    {switchingAccountType ? "Switching..." : "Switch to Company Account"}
                  </Button>
                  {switchError && <p className="text-xs text-red-600 mt-2">{switchError}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {isCompanyAccount && activeTab === "company" && (
          <section
            id="settings-company-section"
            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 shadow-sm md:shadow-[0_10px_25px_rgba(15,23,42,0.06)] p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5"
          >
            <div>
              <h3 className="text-sm md:text-base font-semibold text-slate-900">Company profile</h3>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">Behance-style client details: company name, industry, website, and what you are hiring for.</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Company name</label>
                <input
                  type="text"
                  className="w-full px-2.5 sm:px-3.5 md:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg md:rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Studio Nova"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Industry</label>
                <input
                  type="text"
                  className="w-full px-2.5 sm:px-3.5 md:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg md:rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={companyIndustry}
                  onChange={(e) => setCompanyIndustry(e.target.value)}
                  placeholder="Design, SaaS, E-commerce"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Company website</label>
                <input
                  type="text"
                  className="w-full px-2.5 sm:px-3.5 md:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg md:rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">About / Hiring brief</label>
                <textarea
                  rows={4}
                  className="w-full px-2.5 sm:px-3.5 md:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg md:rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Tell freelancers what your company builds and what kind of talent you hire."
                />
              </div>
              {isCompanyAccount && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Company location</label>
                  <LocationSelector
                    value={{
                      city: companyCity,
                      state: companyState,
                      country: companyCountry,
                    }}
                    onChange={(next) => {
                      setCompanyCity(next.city);
                      setCompanyState(next.state);
                      setCompanyCountry(next.country);
                    }}
                  />
                </div>
              )}
              <Button
                type="button"
                className={`w-full rounded-lg md:rounded-xl text-xs sm:text-sm py-2 sm:py-2.5 ${companySaved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"} text-white shadow-sm ${companySaved ? "shadow-emerald-600/20" : "shadow-blue-600/20"}`}
                onClick={handleSaveCompany}
                disabled={companySaving}
              >
                {companySaving ? "Saving..." : companySaved ? "Company saved!" : companyId ? "Update company" : "Create company"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg md:rounded-xl text-xs sm:text-sm py-2 sm:py-2.5"
                onClick={handleSwitchToIndividual}
                disabled={switchingAccountType}
              >
                {switchingAccountType ? "Switching..." : "Switch to Individual Account"}
              </Button>
              {companyError && <p className="text-xs text-red-600 mt-1">{companyError}</p>}
              {switchError && <p className="text-xs text-red-600 mt-1">{switchError}</p>}
            </div>
          </section>
        )}

        {!isCompanyAccount && activeTab === "location" && (
          <section
            id="settings-location-section"
            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 shadow-sm md:shadow-[0_10px_25px_rgba(15,23,42,0.06)] p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5"
          >
            <div>
              <h3 className="text-sm md:text-base font-semibold text-slate-900">Location & visibility</h3>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">Set your location so local freelancers can discover your hiring opportunities.</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <LocationSelector
                className="pt-0.5 sm:pt-1"
                value={{
                  city,
                  state: stateName,
                  country,
                }}
                onChange={(next) => {
                  setCity(next.city);
                  setStateName(next.state);
                  setCountry(next.country);
                  setResolvedLocation(null);
                }}
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 pt-0.5">
                <p>Your base location helps local freelancers discover your jobs on the map.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg md:rounded-xl text-xs w-full sm:w-auto"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                >
                  {locating ? "Detecting..." : "Use my current location"}
                </Button>
              </div>
              <Button
                className={`w-full rounded-lg md:rounded-xl text-xs sm:text-sm py-2 sm:py-2.5 ${saved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"} text-white shadow-sm ${saved ? "shadow-emerald-600/20" : "shadow-blue-600/20"}`}
                onClick={handleSave}
              >
                {saved ? "Saved!" : "Save changes"}
              </Button>
              {saveError && (
                <p className="text-xs text-red-600 mt-1">{saveError}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ClientSelfProfile;
