import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, User } from "lucide-react";
import Layout from "@/components/layout/Layout";
import FreelancerDashboard from "./FreelancerDashboard";
import ClientDashboard from "./ClientDashboard";

const CombinedDashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  const [activeRole, setActiveRole] = useState<"freelancer" | "client">("freelancer");

  return (
    <div>
      {/* Role switcher bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="w-full px-4 sm:px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 mr-2">Viewing as:</span>
          <button
            onClick={() => setActiveRole("freelancer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeRole === "freelancer"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <User className="w-4 h-4" />
            Freelancer
          </button>
          <button
            onClick={() => setActiveRole("client")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeRole === "client"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Client
          </button>
        </div>
      </div>

      {/* Render the selected dashboard – each has its own Layout/Navbar already */}
      {activeRole === "freelancer" ? <FreelancerDashboard /> : <ClientDashboard />}
    </div>
  );
};

export default CombinedDashboard;
