import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import BrowseFreelancers from "./pages/BrowseFreelancers";
import FreelancerProfile from "./pages/FreelancerProfile";
import ClientProfile from "./pages/ClientProfile";
import PostJob from "./pages/PostJob";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import CombinedDashboard from "./pages/CombinedDashboard";
import Contracts from "./pages/Contracts";
import Community from "./pages/Community";
import VerificationDashboard from "./pages/VerificationDashboard";
import MapPage from "./pages/MapPage";
import FooterContentPage from "./pages/FooterContentPage";
import { footerPages } from "@/data/footerContent";
import NotFound from "./pages/NotFound";
import people from "./pages/People";
import Assets from "./pages/Assets";
import Images from "./pages/Images";
import People from "./pages/People";

const queryClient = new QueryClient();

type AllowedRole = "client" | "freelancer" | "both";

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <p className="text-sm text-muted-foreground">Loading...</p>
  </div>
);

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return children;
  }

  if (user?.role === "freelancer") {
    return <Navigate to="/dashboard/freelancer" replace />;
  }

  if (user?.role === "client") {
    return <Navigate to="/dashboard/client" replace />;
  }

  if (user?.role === "both") {
    return <Navigate to="/dashboard/both" replace />;
  }

  return <Navigate to="/" replace />;
};

const RoleRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: AllowedRole[];
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return children;
};

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
            <Route path="/client/:id" element={<ClientProfile />} />
            <Route path="/people" element={<People />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/images" element={<Images />} />
            <Route
              path="/post-job"
              element={
                <RoleRoute allowedRoles={["client", "both"]}>
                  <PostJob />
                </RoleRoute>
              }
            />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <SignUp />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/freelancer"
              element={
                <RoleRoute allowedRoles={["freelancer"]}>
                  <FreelancerDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/client"
              element={
                <RoleRoute allowedRoles={["client"]}>
                  <ClientDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/both"
              element={
                <RoleRoute allowedRoles={["both"]}>
                  <CombinedDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/contracts"
              element={
                <ProtectedRoute>
                  <Contracts />
                </ProtectedRoute>
              }
            />
            <Route path="/community" element={<Community />} />
            <Route
              path="/verification"
              element={
                <ProtectedRoute>
                  <VerificationDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/map" element={<MapPage />} />
            {footerPages.map((page) => (
              <Route
                key={page.path}
                path={page.path}
                element={<FooterContentPage page={page} />}
              />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
