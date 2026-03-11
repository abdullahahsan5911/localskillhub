import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Palette, Search, ArrowRight, LocateFixed, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import { CategoryCard } from "@/components/CategoryCard";
import { buildPointLocation, resolveCurrentBrowserLocation } from "@/lib/location";

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<"client" | "freelancer" | "both" | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [location, setLocation] = useState({ city: "", state: "", country: "India" });
  const [resolvedCoords, setResolvedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: "client" | "freelancer" | "both") => {
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

  const updateLocationField = (field: "city" | "state" | "country", value: string) => {
    setLocation(prev => ({ ...prev, [field]: value }));
    setResolvedCoords(null);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setError("");
      const resolved = await resolveCurrentBrowserLocation();
      setLocation({
        city: resolved.city,
        state: resolved.state,
        country: resolved.country || "India",
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

      // Update user profile with role and interests
      await api.updateProfile({
        role: userRole,
        interests: selectedInterests,
        location: locationPayload,
        onboardingCompleted: true,
      });

      // Update auth context
      updateUser({ role: userRole, interests: selectedInterests, location: locationPayload, onboardingCompleted: true });

      // Save onboarding data to localStorage
      const onboardingData = {
        role: userRole,
        interests: selectedInterests,
        completed: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("onboarding", JSON.stringify(onboardingData));

      // Navigate based on role
      if (userRole === "client") {
        navigate("/dashboard/client");
      } else if (userRole === "freelancer") {
        navigate("/dashboard/freelancer");
      } else {
        navigate("/dashboard/both");
      }
    } catch (err: any) {
      setError(err.message || "Unable to save your preferences. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">LocalSkillHub</h1>
        <p className="text-sm text-gray-600">Welcome, {useAuth().user?.name || 'there'}!</p>
      </div>

      {/* Step 1: Role Selection */}
      {step === 1 && (
        <div className="flex flex-col items-center justify-center text-center mt-16 px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to LocalSkillHub!
          </h1>

          <p className="text-gray-600 max-w-xl mb-10 text-lg">
            To help you get started, choose if you'd like to join LocalSkillHub
            as a creative professional or a client looking to hire.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            
            {/* Freelancer Card */}
            <div 
              onClick={() => handleRoleSelect("freelancer")}
              className="group border border-gray-200 rounded-xl p-10 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-500"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Palette className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                I'm a creative / freelancer
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>

              <p className="text-gray-600 text-sm leading-relaxed">
                Use LocalSkillHub to showcase and discover work,
                get exposure, and find local job opportunities.
              </p>
            </div>

            {/* Client Card */}
            <div 
              onClick={() => handleRoleSelect("client")}
              className="group border border-gray-200 rounded-xl p-10 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-500"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                I'm looking to hire
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>

              <p className="text-gray-600 text-sm leading-relaxed">
                Use LocalSkillHub to post jobs, hire local freelancers,
                and collaborate on creative projects.
              </p>
            </div>

          </div>

          {/* Bottom Link */}
          <button 
            onClick={() => handleRoleSelect("both")}
            className="mt-12 text-blue-600 font-medium hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
          >
            I'm planning to use LocalSkillHub for both
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Interest Selection */}
      {step === 2 && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Select Your Areas of Expertise
              </h1>
              <p className="text-lg text-gray-600">
                Choose one or more categories that match your skills or interests, then add your working location
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedInterests.includes(category.id)}
                  onClick={() => toggleInterest(category.id)}
                  variant="compact"
                  showImage={false}
                />
              ))}
            </div>

            <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Your Base Location
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    This is used for local discovery, maps, and nearby jobs.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={locating || loading}
                  className="rounded-xl"
                >
                  {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}
                  {locating ? "Detecting..." : "Use my current location"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                  value={location.city}
                  onChange={(e) => updateLocationField("city", e.target.value)}
                />
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State"
                  value={location.state}
                  onChange={(e) => updateLocationField("state", e.target.value)}
                />
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Country"
                  value={location.country}
                  onChange={(e) => updateLocationField("country", e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                You can enter a detailed location manually or let the browser fill it from your current position.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="flex gap-4 justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="px-6 py-6 text-base rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={selectedInterests.length === 0 || !location.city.trim() || !location.state.trim() || !location.country.trim() || loading}
                className="bg-blue-600 text-white px-8 py-6 text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                {loading ? "Processing..." : "Continue"}
              </Button>
            </div>

            {selectedInterests.length > 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                {selectedInterests.length} {selectedInterests.length === 1 ? "category" : "categories"} selected
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
