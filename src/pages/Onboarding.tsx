import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiTool, FiUsers, FiCode, FiImage, FiVideo, FiTrendingUp, FiCamera, FiFileText, FiSmartphone } from "react-icons/fi";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "web-dev", name: "Web Development", icon: FiCode },
  { id: "graphic-design", name: "Graphic Design", icon: FiImage },
  { id: "video-production", name: "Video Production", icon: FiVideo },
  { id: "digital-marketing", name: "Digital Marketing", icon: FiTrendingUp },
  { id: "photography", name: "Photography", icon: FiCamera },
  { id: "content-writing", name: "Content Writing", icon: FiFileText },
  { id: "mobile-apps", name: "Mobile Apps", icon: FiSmartphone },
  { id: "ui-ux", name: "UI/UX Design", icon: FiUsers },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<"hire" | "work" | "both" | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleRoleSelect = (role: "hire" | "work" | "both") => {
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

  const handleComplete = () => {
    // Save onboarding data to localStorage
    const onboardingData = {
      role: userRole,
      interests: selectedInterests,
      completed: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("onboarding", JSON.stringify(onboardingData));

    // Navigate based on role
    if (userRole === "hire") {
      navigate("/dashboard/client");
    } else if (userRole === "work") {
      navigate("/dashboard/freelancer");
    } else {
      navigate("/"); // Both - go to home to explore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-300"}`} />
          <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-300"}`} />
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Welcome to LocalSkillHub! 👋
              </h1>
              <p className="text-lg text-gray-600">
                What brings you here today?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Hire Talent */}
              <button
                onClick={() => handleRoleSelect("hire")}
                className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                    <FiBriefcase className="h-10 w-10 text-blue-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Hire Talent</h3>
                  <p className="text-sm text-gray-600">
                    I'm looking to hire skilled freelancers for my projects
                  </p>
                </div>
              </button>

              {/* Find Work */}
              <button
                onClick={() => handleRoleSelect("work")}
                className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                    <FiTool className="h-10 w-10 text-green-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Find Work</h3>
                  <p className="text-sm text-gray-600">
                    I'm a freelancer looking for local opportunities
                  </p>
                </div>
              </button>

              {/* Both */}
              <button
                onClick={() => handleRoleSelect("both")}
                className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                    <FiUsers className="h-10 w-10 text-purple-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Both</h3>
                  <p className="text-sm text-gray-600">
                    I want to hire and offer my services
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Interest Selection */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                What are your areas of interest?
              </h1>
              <p className="text-lg text-gray-600">
                Select all that apply - you can change this later
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {categories.map((category) => {
                const isSelected = selectedInterests.includes(category.id);
                const Icon = category.icon;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleInterest(category.id)}
                    className={`relative border-2 rounded-xl p-6 transition-all duration-300 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-blue-600" : "bg-gray-100"
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          isSelected ? "text-white" : "text-gray-600"
                        }`} />
                      </div>
                      <span className={`text-sm font-medium ${
                        isSelected ? "text-blue-900" : "text-gray-700"
                      }`}>
                        {category.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="px-6 py-6 text-base"
              >
                Back
              </Button>
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  onClick={handleComplete}
                  className="px-6 py-6 text-base text-gray-600 hover:text-gray-900"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={selectedInterests.length === 0}
                  className="bg-blue-600 text-white px-8 py-6 text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Setup
                </Button>
              </div>
            </div>

            {selectedInterests.length > 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                {selectedInterests.length} {selectedInterests.length === 1 ? "category" : "categories"} selected
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? <a href="#" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
