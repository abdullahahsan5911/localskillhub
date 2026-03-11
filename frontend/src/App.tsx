import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import BrowseFreelancers from "./pages/BrowseFreelancers";
import FreelancerProfile from "./pages/FreelancerProfile";
import PostJob from "./pages/PostJob";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import CombinedDashboard from "./pages/CombinedDashboard";
import Messages from "./pages/Messages";
import Contracts from "./pages/Contracts";
import Community from "./pages/Community";
import VerificationDashboard from "./pages/VerificationDashboard";
import MapPage from "./pages/MapPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowseFreelancers />} />
            <Route path="/profile/:id" element={<FreelancerProfile />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard/freelancer" element={<FreelancerDashboard />} />
            <Route path="/dashboard/client" element={<ClientDashboard />} />
            <Route path="/dashboard/both" element={<CombinedDashboard />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/community" element={<Community />} />
            <Route path="/verification" element={<VerificationDashboard />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
