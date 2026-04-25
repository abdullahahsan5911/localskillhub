import { useState, useEffect, useCallback } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, FileCheck,
  MessageSquare, Settings, Search, Plus, Bookmark, Users, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import DashboardLayout, { NavItem } from "@/components/dashboard/DashboardLayout";
import VerificationStatusCard from "@/components/dashboard/VerificationStatusCard";
import MessagesTab from "@/components/dashboard/MessagesTab";
import SavedTab from "@/components/dashboard/SavedTab";
import ConnectionsTab from "@/components/dashboard/ConnectionsTab";
import { AdminNotificationsPanel } from "@/components/AdminNotificationsPanel";
import OverviewTab from "./client-dashboard/Overview";
import MyJobsTab from "./client-dashboard/MyJobs";
import ProposalsTab from "./client-dashboard/Prposals";
import ContractsTab from "./client-dashboard/Contracts";
import HiringRequestsTab from "./client-dashboard/HiringRequests";
import { getAdminNotifications } from "@/lib/notificationsApi";
import type { Analytics, Job, Proposal, Contract } from "./client-dashboard/types";

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showVerify, setShowVerify] = useState(false);
  useEffect(() => {
    if (user?.accountType === "company") {
      navigate("/company-dashboard", { replace: true });
      return;
    }

    if (user && (!user.isEmailVerified || (user as any).verificationLevel === 'unverified' || (user as any).verificationLevel === 'basic')) {
      setShowVerify(true);
    } else {
      setShowVerify(false);
    }
  }, [user, navigate]);
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingPayContractId, setPendingPayContractId] = useState<string | null>(null);
  const [communitiesRoute, setCommunitiesRoute] = useState<string | null | undefined>(undefined);
  const currentUserId = ((user as any)?._id || (user as any)?.id) as string | undefined;
  const focusContractId = searchParams.get("contractId") || undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, jobsRes, proposalsRes, contractsRes, convsRes, notifRes, communitiesRes] = await Promise.allSettled([
        api.getClientAnalytics(),
        api.getMyJobs(),
        api.getProposals(),
        api.getContracts(),
        api.getConversations(),
        getAdminNotifications({ limit: 1, unreadOnly: true }),
        api.getMyCommunities(),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        const d = analyticsRes.value.data as any;
        setAnalytics(d.data?.analytics || d.analytics || d);
      }
      if (jobsRes.status === "fulfilled" && jobsRes.value?.data) {
        const d = jobsRes.value.data as any;
        setJobs(d.jobs || []);
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
      if (notifRes.status === "fulfilled" && (notifRes.value as any)?.pagination) {
        setUnreadNotifications((notifRes.value as any).pagination.unreadCount || 0);
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
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleProposalAction = async (proposal: Proposal, status: string) => {
    try {
      if (status === "accepted") {
        toast({
          title: "Preparing your contract and payment...",
          description: "We are setting up escrow and your contract details.",
        });

        const res: any = await api.acceptProposal(proposal._id);

        const data = (res?.data as any)?.data || res?.data || res || {};
        const createdContract: Contract | null = (data as any).contract || null;
        const canPay: boolean = Boolean((data as any).canPay);

        let targetContractId: string | null = createdContract?._id || null;

        // Refresh contracts list from backend to keep in sync
        try {
          const contractsRes = await api.getContracts();
          const d = (contractsRes.data as any) || {};
          const updatedContracts: Contract[] = d.contracts || d.data || [];
          setContracts(updatedContracts);

          if (!targetContractId) {
            const related = updatedContracts.find(
              (c: Contract) =>
                c.proposalId === (proposal as any)._id ||
                c.jobId?._id === proposal.jobId?._id
            );
            if (related) {
              targetContractId = related._id;
            }
          }
        } catch (err) {
          console.error("Error refreshing contracts after accepting proposal", err);
        }

        if (targetContractId) {
          setActiveTab("contracts");
          // Only auto-open payment flow if backend says we can pay
          if (canPay) {
            setPendingPayContractId(targetContractId);
          } else {
            setPendingPayContractId(null);
          }
        }
      } else if (status === "rejected") {
        await api.rejectProposal(proposal._id);
      }
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "work",
      label: "Work",
      icon: Briefcase,
      children: [
        { id: "my-jobs", label: "My Jobs", icon: Briefcase, badge: jobs.filter(j => j.status === "open").length },
        { id: "proposals", label: "Proposals", icon: FileText, badge: proposals.filter(p => ["sent", "viewed", "shortlisted"].includes(p.status)).length },
        { id: "contracts", label: "Contracts", icon: FileCheck, badge: contracts.filter(c => c.status === "active").length },
        { id: "hiring-requests", label: "Hiring Requests", icon: FileText, badge: contracts.filter(c => (c as any).isHiringRequest).length },
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
    {
      id: "network",
      label: "Network",
      icon: Users,
      children: [
        { id: "saved", label: "Saved", icon: Bookmark },
        { id: "connections", label: "Connections", icon: Users },
        {
          id: "communities",
          label: "Communities",
          icon: Users,
          href: communitiesRoute === undefined ? undefined : communitiesRoute || "/communities/manage",
        },
      ],
    },
  ];

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab analytics={analytics} jobs={jobs} proposals={proposals} loading={loading} />,
    "my-jobs": <MyJobsTab jobs={jobs} loading={loading} onRefresh={fetchData} />,
    proposals: <ProposalsTab proposals={proposals} loading={loading} onAction={handleProposalAction} />,
    contracts: (
      <ContractsTab
        contracts={contracts}
        loading={loading}
        onRefresh={fetchData}
        payContractId={pendingPayContractId}
        focusContractId={focusContractId}
        onPayFlowComplete={() => setPendingPayContractId(null)}
      />
    ),
    "hiring-requests": (
      <HiringRequestsTab
        contracts={contracts}
        loading={loading}
        focusContractId={focusContractId}
        onOpenContractPayment={(contractId) => {
          setActiveTab("contracts");
          setPendingPayContractId(contractId);
        }}
      />
    ),
    notifications: <AdminNotificationsPanel />,
    saved: <SavedTab user={user} />,
    connections: <ConnectionsTab user={user} />,
    messages: (
      <MessagesTab
        onUnreadCount={setUnreadMessages}
        initialTargetUserId={searchParams.get("userId") || undefined}
      />
    ),
    communities:
      communitiesRoute === undefined ? (
        <div className="py-4 text-sm text-slate-500">Loading communities...</div>
      ) : (
        <Navigate to={communitiesRoute || "/communities/manage"} replace />
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
          <Link to="/post-job">
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-1.5 hidden sm:flex">
              <Plus className="w-4 h-4" /> Post Job
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

export default ClientDashboard;
