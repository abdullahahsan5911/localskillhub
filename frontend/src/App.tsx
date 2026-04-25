import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePresenceTracking, useUpdatePresence } from "@/hooks/usePresence";
import { useSocketNotifications } from "@/hooks/useSocketNotifications";
import { AccountStatusAlert } from "@/components/AccountStatusAlert";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Index from "./pages/Index";
import BrowseFreelancers from "./pages/BrowseFreelancers";
import FreelancerProfile from "./pages/FreelancerProfile";
import ClientProfile from "./pages/ClientProfile";
import PostJob from "./pages/PostJob";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import Communities from "./pages/Communities";
import CommunitiesManage from "./pages/CommunitiesManage";
import CommunityDetail from "./pages/CommunityDetail";
import MessagesPage from "./pages/MessagesPage";
import MapPage from "./pages/MapPage";
import FooterContentPage from "./pages/FooterContentPage";
import { footerPages } from "@/data/footerContent";
import NotFound from "./pages/NotFound";
import Assets from "./pages/Assets";
import Images from "./pages/Images";
import People from "./pages/People";
// Admin Panel
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllUsers from "./pages/admin/users/AllUsers";
import VerificationRequests from "./pages/admin/users/VerificationRequests";
import { AppealsList } from "./pages/admin/AppealsList";
import AllJobs from "./pages/admin/jobs/AllJobs";
import AdminContracts from "./pages/admin/contracts/AdminContracts";
import AdminHiringRequests from "./pages/admin/contracts/AdminHiringRequests";
import DisputeResolution from "./pages/admin/contracts/DisputeResolution";
import ReviewModeration from "./pages/admin/reputation/ReviewModeration";
import AdminCommunities from "./pages/admin/community/AdminCommunities";
import AdminCompanyVerifications from "./pages/admin/companies/AdminCompanyVerifications";
import AdminSettings from "./pages/admin/settings/AdminSettings";
import AuditLogs from "./pages/admin/logs/AuditLogs";
import EscrowMonitor from "./pages/admin/payments/EscrowMonitor";
import Transactions from "./pages/admin/payments/Transactions";
import WithdrawalRequests from "./pages/admin/payments/WithdrawalRequests";
import ReputationScores from "./pages/admin/reputation/ReputationScores";
import UserDetail from "./pages/admin/users/UserDetail";
import ContractDetail from "./pages/admin/contracts/ContractDetail";
import DisputeDetail from "./pages/admin/contracts/DisputeDetail";
import { BannedAccountPage } from "@/components/BannedAccountPage";
import Navbar from "@/components/layout/Navbar";
import ClientSelfProfile from "./pages/ClientSelfProfile";
import FreelancerSelfProfile from "./pages/FreelancerSelfProfile";
import AccountSettings from "./pages/AccountSettings";
import PayoutOnboardingComplete from "./pages/freelancer-dashboard/PayoutOnboardingComplete";
import api from "@/lib/api";

const queryClient = new QueryClient();

type AllowedRole = "client" | "freelancer" | "admin";

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

const CompanyProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || user.role === "freelancer" || user.accountType !== "company") {
    return <Navigate to="/client-dashboard" replace />;
  }

  // Check onboarding for company dashboard access
  const isOnboardingComplete = user.onboardingCompleted;
  const isOnboardingSkipped = (user as any).onboarding?.skipped;

  if (!isOnboardingComplete && !isOnboardingSkipped) {
    return <Navigate to="/onboarding" replace />;
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
    if (user.accountType === "company") {
      return <Navigate to="/company-dashboard" replace />;
    }
    return <Navigate to="/dashboard/client" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/" replace />;
};

const RoleRoute = ({
  children,
  allowedRoles,
  requireOnboarding = true, // Enforce onboarding for non-admin users
}: {
  children: JSX.Element;
  allowedRoles: AllowedRole[];
  requireOnboarding?: boolean;
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

  // Check onboarding for non-admin users trying to access protected routes
  if (requireOnboarding && user.role !== "admin") {
    const isOnboardingComplete = user.onboardingCompleted;
    const isOnboardingSkipped = (user as any).onboarding?.skipped;

    // If not complete and not skipped, redirect to onboarding
    if (!isOnboardingComplete && !isOnboardingSkipped) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return children;
};

// Socket.IO initialization wrapper
const SocketIOInitializer = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    try {
      // Socket.IO is not available on the current Vercel backend runtime.
      // Keep it enabled locally, or explicitly enable via env for a dedicated realtime server.
      const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const shouldEnableSocket =
        import.meta.env.VITE_ENABLE_SOCKET === 'true' || isLocalhost;

      if (!shouldEnableSocket) {
        return;
      }

      // Use dedicated socket URL when provided; otherwise derive from API URL.
      const socketUrl = import.meta.env.VITE_SOCKET_URL
        ? import.meta.env.VITE_SOCKET_URL
        : (import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace('/api', '')
            : `${window.location.protocol}//${window.location.hostname}:5000`);

      // Initialize Socket.IO connection
      const socket: Socket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token')
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        console.log('Socket.IO connected');
        // Emit user online after connection
        socket.emit('userOnline', user._id);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      // Store socket instance globally for use in hooks and components
      (window as any).__socket = socket;

      // Handle page unload - explicitly notify server about offline status
      const handlePageUnload = () => {
        console.log('Page unloading - notifying server of offline status');
        // Emit explicit offline event using socket's authenticated ID
        socket.emit('userOffline', socket.id);
        // Disconnect socket
        socket.disconnect();
      };

      // Listen for page unload events (tab close, navigation, refresh)
      window.addEventListener('beforeunload', handlePageUnload);
      window.addEventListener('unload', handlePageUnload);

      return () => {
        // Remove unload listeners
        window.removeEventListener('beforeunload', handlePageUnload);
        window.removeEventListener('unload', handlePageUnload);
        
        if (socket) {
          socket.disconnect();
        }
      };
    } catch (error) {
      console.error('Error initializing Socket.IO:', error);
    }
  }, [user, isAuthenticated]);

  return children;
};

// Presence tracking component
const PresenceTracker = ({ children }: { children: JSX.Element }) => {
  usePresenceTracking();
  useUpdatePresence();
  return children;
};

// Socket notification handler component
const SocketNotificationHandler = ({ children }: { children: JSX.Element }) => {
  useSocketNotifications();
  return children;
};

// Banned account protection wrapper
const BannedAccountCheck = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user && (user as any).isBanned) {
    return <BannedAccountPage />;
  }

  return children;
};

// Shared profile route that renders the correct profile view per role
const ProfileRoute = () => {
  const { user } = useAuth();
  const isFreelancerProfile = user?.role === "freelancer";

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <Navbar />
      <div className="py-8 min-h-screen bg-slate-50">
        <div className={isFreelancerProfile ? "w-full" : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"}>
          {!isFreelancerProfile && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Profile</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage your public profile, portfolio, and digital assets.
                </p>
              </div>
            </div>
          )}

          {user.role === "client" && <ClientSelfProfile />}
          {user.role === "freelancer" && <FreelancerSelfProfile />}
        </div>
      </div>
    </>
  );
};

// Shared settings route that renders the correct settings view per role
const SettingsRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/settings" replace />;
  }

  return <AccountSettings />;
};

// Main application component with providers and routing
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketIOInitializer>
          <PresenceTracker>
            <SocketNotificationHandler>
              <BannedAccountCheck>
                <TooltipProvider>
                  <BrowserRouter>
                    <AccountStatusAlert />
                    <Routes>
                          {/* Public marketing and browsing routes */}
                          <Route path="/" element={<Index />} />
                          <Route path="/browse" element={<BrowseFreelancers />} />
                          <Route path="/freelancers/:id" element={<FreelancerProfile />} />
                          <Route path="/clients/:id" element={<ClientProfile />} />
                          <Route path="/jobs" element={<Jobs />} />
                          <Route path="/jobs/:id" element={<JobDetail />} />
                          <Route path="/assets" element={<Assets />} />
                          <Route path="/images" element={<Images />} />
                          <Route path="/people" element={<People />} />

                          {/* Auth routes */}
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
                            path="/forgot-password"
                            element={
                              <PublicOnlyRoute>
                                <ForgotPassword />
                              </PublicOnlyRoute>
                            }
                          />

                          {/* Onboarding and dashboards */}
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
                            path="/company-dashboard"
                            element={
                              <CompanyProtectedRoute>
                                <CompanyDashboard />
                              </CompanyProtectedRoute>
                            }
                          />

                          {/* Job posting (clients only) */}
                          <Route
                            path="/post-job"
                            element={
                              <RoleRoute allowedRoles={["client"]}>
                                <PostJob />
                              </RoleRoute>
                            }
                          />

                          {/* Profile */}
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <ProfileRoute />
                              </ProtectedRoute>
                            }
                          />

                          {/* Settings */}
                          <Route
                            path="/settings"
                            element={
                              <ProtectedRoute>
                                <SettingsRoute />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/messages"
                            element={
                              <ProtectedRoute>
                                <MessagesPage />
                              </ProtectedRoute>
                            }
                          />

                          {/* Stripe payout onboarding return URLs */}
                          <Route
                            path="/freelancer/payouts/onboarding-complete"
                            element={
                              <RoleRoute allowedRoles={["freelancer"]}>
                                <PayoutOnboardingComplete />
                              </RoleRoute>
                            }
                          />
                          <Route
                            path="/freelancer/payouts/onboarding"
                            element={
                              <RoleRoute allowedRoles={["freelancer"]}>
                                <PayoutOnboardingComplete />
                              </RoleRoute>
                            }
                          />

                          {/* Community and map */}
                          <Route path="/communities" element={<Communities />} />
                          <Route
                            path="/communities/manage"
                            element={
                              <RoleRoute allowedRoles={["client", "freelancer"]}>
                                <CommunitiesManage />
                              </RoleRoute>
                            }
                          />
                          <Route path="/communities/:id" element={<CommunityDetail />} />
                          <Route path="/map" element={<MapPage />} />

                          {/* Footer content pages */}
                          {footerPages.map((page) => (
                            <Route
                              key={page.path}
                              path={page.path}
                              element={<FooterContentPage page={page} />}
                            />
                          ))}

                          {/* Admin Panel */}
                          <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            {/* Users */}
                            <Route path="users" element={<AllUsers />} />
                            <Route path="users/banned" element={<AllUsers />} />
                            <Route path="users/:id" element={<UserDetail />} />
                            <Route path="verifications" element={<VerificationRequests />} />
                            <Route path="companies" element={<AdminCompanyVerifications />} />
                            <Route path="appeals" element={<AppealsList />} />
                            {/* Jobs */}
                            <Route path="jobs" element={<AllJobs />} />
                            <Route path="jobs/flagged" element={<AllJobs flaggedOnly />} />
                            {/* Contracts */}
                            <Route path="contracts" element={<AdminContracts />} />
                            <Route path="hiring-requests" element={<AdminHiringRequests />} />
                            <Route path="contracts/:id" element={<ContractDetail />} />
                            <Route path="disputes" element={<DisputeResolution />} />
                            <Route path="disputes/:id" element={<DisputeDetail />} />
                            {/* Payments */}
                            <Route path="payments/escrow" element={<EscrowMonitor />} />
                            <Route path="payments/transactions" element={<Transactions />} />
                            <Route path="payments/withdrawals" element={<WithdrawalRequests />} />
                            {/* Reviews & Reputation */}
                            <Route path="reviews" element={<ReviewModeration />} />
                            <Route path="reputation" element={<ReputationScores />} />
                            {/* Communities */}
                            <Route path="communities" element={<AdminCommunities />} />
                            {/* Analytics */}
                            <Route path="analytics" element={<AdminDashboard />} />
                            {/* Logs & Settings */}
                            <Route path="logs" element={<AuditLogs />} />
                            <Route path="settings" element={<AdminSettings />} />
                          </Route>

                          {/* 404 */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        <Toaster />
                        <Sonner />
                      </BrowserRouter>
                    </TooltipProvider>
                  </BannedAccountCheck>
                </SocketNotificationHandler>
              </PresenceTracker>
            </SocketIOInitializer>
          </AuthProvider>
        </QueryClientProvider>
      );
    };

    export default App;
