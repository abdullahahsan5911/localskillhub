import { useState, useEffect, useCallback, useRef } from "react";
import { Link, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, FileCheck,
  MessageSquare, Settings, Plus, Eye, DollarSign,
  Star, TrendingUp, Clock, CheckCircle2, ExternalLink,
  Grid3X3, Search, X, Image as ImageIcon, Trophy, Target,
  Upload, Camera, Loader, Layers, Bookmark, Users, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { buildPointLocation, resolveCurrentBrowserLocation } from "@/lib/location";
import { uploadToCloudinary } from "@/lib/cloudinary";
import DashboardLayout, { NavItem } from "@/components/dashboard/DashboardLayout";
import VerificationStatusCard from "@/components/dashboard/VerificationStatusCard";
import MessagesTab from "@/components/dashboard/MessagesTab";
import SavedTab from "@/components/dashboard/SavedTab";
import ConnectionsTab from "@/components/dashboard/ConnectionsTab";
import { CATEGORIES } from "@/constants/categories";
import OverviewTab from "./freelancer-dashboard/Overview";
import PortfolioTab from "./freelancer-dashboard/Portfolio";
import AssetsTab from "./freelancer-dashboard/Assets";
import MyProposalsTab from "./freelancer-dashboard/Proposals";
import MyContractsTab from "./freelancer-dashboard/Contracts";
import FindJobsTab from "./freelancer-dashboard/FindJobs";
import { AdminNotificationsPanel } from "@/components/AdminNotificationsPanel";
import { getAdminNotifications } from "@/lib/notificationsApi";
import type { PortfolioItem, FreelancerProfile, Analytics, Proposal, Contract, AssetItem } from "./freelancer-dashboard/types";

// ...existing dashboard content removed; main component defined later in file

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  accepted: "bg-green-100 text-green-700",
  sent: "bg-yellow-100 text-yellow-700",
  viewed: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  active: "bg-blue-100 text-blue-700",
  shortlisted: "bg-purple-100 text-purple-700",
  submitted: "bg-indigo-100 text-indigo-700",
  "revision-requested": "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
};

// Tab implementations moved to separate files in ./freelancer-dashboard/*

// ─── Main Component ────────────────────────────────────────────────────────────
const FreelancerDashboard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
    // Show verify banner if not fully verified
    if (user && (!user.isEmailVerified || (user as any).verificationLevel === 'unverified' || (user as any).verificationLevel === 'basic')) {
      setShowVerify(true);
    } else {
      setShowVerify(false);
    }
  }, [isAuthenticated, isLoading, navigate, user]);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [communitiesRoute, setCommunitiesRoute] = useState<string | null | undefined>(undefined);
  const currentUserId = ((user as any)?._id || (user as any)?.id) as string | undefined;
  const focusContractId = searchParams.get('contractId') || undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, profileRes, proposalsRes, contractsRes, convsRes, assetsRes, notifRes, communitiesRes] = await Promise.allSettled([
        api.getFreelancerAnalytics(),
        api.getFreelancer((user as any)?._id || ""),
        api.getProposals(),
        api.getContracts(),
        api.getConversations(),
        api.getMyAssets(),
        getAdminNotifications({ limit: 1, unreadOnly: true }),
        api.getMyCommunities(),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        const d = analyticsRes.value.data as any;
        setAnalytics(d.data?.analytics || d.analytics || d);
      }
      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        const d = profileRes.value.data as any;
        setProfile(d.freelancer || d.data?.freelancer || null);
      }
      if (proposalsRes.status === "fulfilled" && proposalsRes.value?.data) {
        const d = proposalsRes.value.data as any;
        setProposals(d.proposals || d.data || []);
      }
      if (contractsRes.status === "fulfilled" && contractsRes.value?.data) {
        const d = contractsRes.value.data as any;
        setContracts(d.contracts || []);
      }
      if (convsRes.status === "fulfilled" && convsRes.value?.data) {
        const convs: any[] = (convsRes.value.data as any).conversations || [];
        setUnreadMessages(convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0));
      }
      if (assetsRes.status === "fulfilled" && assetsRes.value?.data) {
        const d = assetsRes.value.data as any;
        setAssets(d.assets || d.data?.assets || d);
      }
      if (notifRes.status === "fulfilled" && (notifRes.value as any)?.pagination) {
        setUnreadNotifications(((notifRes.value as any).pagination as any).unreadCount || 0);
      }

      if (communitiesRes.status === "fulfilled" && communitiesRes.value?.data) {
        const payload = communitiesRes.value.data as any;
        const communities = (payload.communities || payload.data?.communities || []) as Array<any>;
        const ownedCommunity = communities.find((community) => {
          const ownerId = (community as any)?.ownerId;
          if (!ownerId || !currentUserId) return false;
          const normalizedOwnerId = typeof ownerId === "string" ? ownerId : ownerId._id || ownerId.id;
          return String(normalizedOwnerId) === String(currentUserId);
        });

        setCommunitiesRoute(ownedCommunity?._id ? `/communities/${ownedCommunity._id}` : null);
      } else {
        setCommunitiesRoute(null);
      }
    } catch (e) {
      console.error(e);
      setCommunitiesRoute(null);
    } finally {
      setLoading(false);
    }
  }, [(user as any)?._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "work",
      label: "Work",
      icon: Briefcase,
      children: [
        { id: "find-jobs", label: "Find Jobs", icon: Search },
        { id: "proposals", label: "My Proposals", icon: FileText, badge: proposals.filter(p => ["sent", "viewed", "shortlisted"].includes(p.status)).length },
        { id: "contracts", label: "Contracts", icon: FileCheck, badge: contracts.filter(c => c.status === "active").length },
        { id: "saved", label: "Saved", icon: Bookmark },
      ],
    },
    {
      id: "network",
      label: "Network",
      icon: Users,
      children: [
        { id: "connections", label: "Connections", icon: Users },
        {
          id: "communities",
          label: "Communities",
          icon: Users,
          href: communitiesRoute === undefined ? undefined : communitiesRoute || "/communities/manage",
        },
      ],
    },
    {
      id: "inbox",
      label: "Inbox",
      icon: MessageSquare,
      children: [
        { id: "notifications", label: "Notifications", icon: AlertCircle },
        { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadMessages || undefined },
      ],
    },
  ];

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab analytics={analytics} profile={profile} loading={loading} contracts={contracts} />,
    "find-jobs": <FindJobsTab />,
    saved: <SavedTab user={user} />,
    connections: <ConnectionsTab user={user} />,
    communities:
      communitiesRoute === undefined ? (
        <div className="py-4 text-sm text-slate-500">Loading communities...</div>
      ) : (
        <Navigate to={communitiesRoute || "/communities/manage"} replace />
      ),
    notifications: <AdminNotificationsPanel />,
    proposals: <MyProposalsTab proposals={proposals} loading={loading} />,
    contracts: <MyContractsTab contracts={contracts} loading={loading} onRefresh={fetchData} focusContractId={focusContractId} />,
    messages: (
      <MessagesTab
        onUnreadCount={setUnreadMessages}
        initialTargetUserId={searchParams.get("userId") || undefined}
      />
    ),
  };

  return (
    <>
      <DashboardLayout
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notificationCount={unreadNotifications}
        onNotificationClick={() => setActiveTab("notifications")}
        headerActions={
          <Link to="/jobs">
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5 hidden sm:flex border-blue-200 text-blue-600">
              <Search className="w-4 h-4" /> Find Work
            </Button>
          </Link>
        }
      >
      {tabContent[activeTab] || tabContent["overview"]}
    </DashboardLayout>
    <VerificationStatusCard />
    </>
  );
};

export {
  OverviewTab,
  PortfolioTab,
  AssetsTab,
  MyProposalsTab,
  MyContractsTab,
  FindJobsTab,
};

export default FreelancerDashboard;
