import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Palette, Search, ArrowRight, LocateFixed, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import { CategoryCard } from "@/components/CategoryCard";
import CategoryCarousel from "@/components/CategoryCarousel";
import LocationSelector from "@/components/LocationSelector";
import { buildPointLocation, resolveCurrentBrowserLocation } from "@/lib/location";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [step, setStep] = useState(1);

  // Safety: admins should never be here
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  const [userRole, setUserRole] = useState<"client" | "freelancer" | null>(null);
  const [accountType, setAccountType] = useState<"individual" | "company" | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [location, setLocation] = useState({ city: "", state: "", country: "" });
  const [resolvedCoords, setResolvedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: "client" | "freelancer") => {
    setUserRole(role);
    setStep(2);
  };

  const toggleInterest = (categoryId: string) => {
    setSelectedInterests(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setError("");
      const resolved = await resolveCurrentBrowserLocation();
      setLocation({
        city: resolved.city,
        state: resolved.state,
        country: resolved.country || "",
      });
      setResolvedCoords({ latitude: resolved.latitude, longitude: resolved.longitude });
    } catch (err: any) {
      setError(err.message || "Unable to get your current location");
    } finally {
      setLocating(false);
    }
  };

  const handleComplete = async () => {
    if (selectedInterests.length === 0) {
      setError("Please select at least one category to continue");
      return;
    }

    if (!location.city.trim() || !location.state.trim() || !location.country.trim()) {
      setError("Please add your city, state, and country or use your current location");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let locationPayload;
      if (resolvedCoords) {
        locationPayload = buildPointLocation({
          city: location.city.trim(),
          state: location.state.trim(),
          country: location.country.trim(),
          latitude: resolvedCoords.latitude,
          longitude: resolvedCoords.longitude,
        });
      } else {
        const geocode = await api.geocodeAddress([location.city, location.state, location.country].filter(Boolean).join(', '));
        const latitude = Number((geocode.data as any)?.latitude);
        const longitude = Number((geocode.data as any)?.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error("Unable to resolve your location coordinates");
        }

        locationPayload = buildPointLocation({
          city: location.city.trim(),
          state: location.state.trim(),
          country: location.country.trim(),
          latitude,
          longitude,
        });
      }

      // Update user profile with role, interests, and location
      const updatePayload: any = {
        role: userRole,
        interests: selectedInterests,
        location: locationPayload,
      };

      // For freelancers we can fully complete onboarding here
      if (userRole === "freelancer") {
        updatePayload.onboardingCompleted = true;
      }

      await api.updateProfile(updatePayload);

      // Update auth context
      updateUser({
        role: userRole || undefined,
        interests: selectedInterests,
        location: locationPayload,
        ...(userRole === "freelancer" ? { onboardingCompleted: true } : {}),
      });

      // Mark onboarding as complete in backend
      try {
        if (userRole === "freelancer") {
          await api.completeOnboarding();
        }
      } catch (err) {
        console.error('Failed to mark onboarding complete:', err);
        // Don't fail the flow if this fails
      }

      // Save onboarding data to localStorage
      const onboardingData = {
        role: userRole,
        interests: selectedInterests,
        completed: userRole === "freelancer",
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("onboarding", JSON.stringify(onboardingData));

      // Navigate or continue based on role
      if (userRole === "freelancer") {
        navigate("/dashboard/freelancer");
      } else if (userRole === "client") {
        // For clients, go to account type selection (solo vs company)
        setStep(3);
        setLoading(false);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Unable to save your preferences. Please try again.");
      setLoading(false);
    }
  };

  const handleSkipOnboarding = async () => {
    setLoading(true);
    setError("");

    try {
      // Save skip status to backend
      await api.skipOnboarding(step);

      // Update auth context
      updateUser({
        onboardingCompleted: false
      });

      // Navigate to dashboard anyway but show reminder
      if (userRole === "freelancer") {
        navigate("/dashboard/freelancer");
      } else if (userRole === "client") {
        navigate("/dashboard/client");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Unable to skip onboarding. Please try again.");
      setLoading(false);
    }
  };

  const handleAccountTypeSelect = async (type: "individual" | "company") => {
    setAccountType(type);
    setLoading(true);
    setError("");

    try {
      await api.updateProfile({
        accountType: type,
        onboardingCompleted: true,
      });

      updateUser({ accountType: type, onboardingCompleted: true });

      const prev = localStorage.getItem("onboarding");
      let prevData: any = {};
      try {
        prevData = prev ? JSON.parse(prev) : {};
      } catch {
        prevData = {};
      }

      const onboardingData = {
        ...prevData,
        accountType: type,
        completed: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("onboarding", JSON.stringify(onboardingData));

      if (type === "company") {
        navigate("/company-dashboard");
      } else {
        navigate("/dashboard/client");
      }
    } catch (err: any) {
      setError(err.message || "Unable to save your preferences. Please try again.");
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-3 sm:px-6 py-3 sm:py-4 border-b bg-white shadow-sm gap-2">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">LocalSkillHub</h1>
        <p className="text-xs sm:text-sm text-gray-600">Welcome, {useAuth().user?.name || 'there'}!</p>
      </div>

      {/* Step 1: Role Selection */}
      {step === 1 && (
        <div className="flex flex-col items-center justify-center text-center mt-8 sm:mt-16 px-3 sm:px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Welcome to LocalSkillHub!
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-xl mb-6 sm:mb-10 leading-relaxed">
            To help you get started, choose if you'd like to join LocalSkillHub
            as a creative professional or a client looking to hire.
          </p>

          {/* Cards */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-4xl">

            {/* Freelancer Card */}
            <div
              onClick={() => handleRoleSelect("freelancer")}
              className="w-full sm:w-1/2 group border border-gray-200 rounded-lg sm:rounded-xl p-6 sm:p-10 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-500"
            >
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Palette className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
                </div>
              </div>

              <h2 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3 text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                I'm a creative / freelancer
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Use LocalSkillHub to showcase and discover work,
                get exposure, and find local job opportunities.
              </p>
            </div>

            {/* Client Card */}
            <div
              onClick={() => handleRoleSelect("client")}
              className="w-full sm:w-1/2 group border border-gray-200 rounded-lg sm:rounded-xl p-6 sm:p-10 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-500"
            >
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Search className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
                </div>
              </div>

              <h2 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-3 text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                I'm looking to hire
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Use LocalSkillHub to post jobs, hire local freelancers,
                and collaborate on creative projects.
              </p>
            </div>

          </div>

          <div className="mt-4 sm:mt-8 text-center">
            <button
              onClick={() => handleSkipOnboarding()}
              disabled={loading}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
            >
              {loading ? "Processing..." : "Skip onboarding for now"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Interest Selection */}
      {step === 2 && (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-12">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
            <div className="text-center mb-6 sm:mb-10">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                Select Your Areas of Expertise
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
                Choose one or more categories that match your skills or interests, then add your working location
              </p>
            </div>

            <div className=""> 
              {/* Coverflow carousel for categories (keeps category data unchanged) */}
              <CategoryCarousel
                categories={CATEGORIES}
                selectedIds={selectedInterests}
                onToggle={(id) => toggleInterest(id)}
              />
            </div>

            <div className="mb-6 sm:mb-8 rounded-lg sm:rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 flex-shrink-0" />
                    Your Base Location
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    This is used for local discovery, maps, and nearby jobs.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={locating || loading}
                  className="rounded-lg sm:rounded-xl text-xs sm:text-sm whitespace-nowrap"
                >
                  {locating ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" /> : <LocateFixed className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                  {locating ? "Detecting..." : "Use my location"}
                </Button>
              </div>

              <LocationSelector
                layout="row"
                value={location}
                onChange={(next) => {
                  setLocation(next);
                  setResolvedCoords(null);
                }}
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
                You can enter a detailed location manually or let the browser fill it from your current position.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row justify-between items-stretch sm:items-center">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3"
              >
                ← Back
              </Button>
              <div className="flex gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
                <button
                  onClick={() => handleSkipOnboarding()}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl border border-gray-400 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Processing..." : "Skip"}
                </button>
                <Button
                  onClick={handleComplete}
                  disabled={selectedInterests.length === 0 || !location.city.trim() || !location.state.trim() || !location.country.trim() || loading}
                  className="bg-blue-600 text-white px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                >
                  {loading ? "Processing..." : "Complete"}
                </Button>
              </div>
            </div>

            {selectedInterests.length > 0 && (
              <p className="text-center text-xs sm:text-sm md:text-base text-blue-700 font-bold mt-3 sm:mt-4">
                {selectedInterests.length} {selectedInterests.length === 1 ? "category" : "categories"} selected
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Client account type (solo vs company) */}
      {step === 3 && userRole === "client" && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                How are you hiring on LocalSkillHub?
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
                Choose whether you're hiring as an individual or on behalf of a company or team. You can manage your company profile and jobs later in your dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              <button
                type="button"
                onClick={() => handleAccountTypeSelect("individual")}
                disabled={loading}
                className={`w-full sm:w-1/2 text-left border rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 transition-all ${accountType === "individual" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
              >
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1">
                  I'm hiring as an individual
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Use your personal profile to post jobs and hire freelancers for your own projects.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleAccountTypeSelect("company")}
                disabled={loading}
                className={`w-full sm:w-1/2 text-left border rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 transition-all ${accountType === "company" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
              >
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1">
                  I'm hiring for a company or team
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Create and manage jobs, collaborators, and activity from a shared company dashboard.
                </p>
              </button>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 justify-between items-stretch sm:items-center">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={loading}
                className="rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3"
              >
                ← Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
