import { useState, useEffect, useCallback } from "react";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, FileCheck,
  MessageSquare, Users, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import DashboardLayout, { NavItem } from "@/components/dashboard/DashboardLayout";
import MessagesTab from "@/components/dashboard/MessagesTab";
import ConnectionsTab from "@/components/dashboard/ConnectionsTab";
import CompanyOverviewTab from "./company-dashboard/Overview";
import CompaniesTab from "./company-dashboard/CompaniesTab";
import MyJobsTab from "./client-dashboard/MyJobs";
import ProposalsTab from "./client-dashboard/Prposals";
import ContractsTab from "./client-dashboard/Contracts";
import { AdminNotificationsPanel } from "@/components/AdminNotificationsPanel";
import { getAdminNotifications } from "@/lib/notificationsApi";
import VerificationStatusCard from "@/components/dashboard/VerificationStatusCard";
import type { Analytics, Job, Proposal, Contract } from "./client-dashboard/types";

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [companyProfileReady, setCompanyProfileReady] = useState(false);
  const [companyProfileMissing, setCompanyProfileMissing] = useState<string[]>([]);
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
        const pagination = (notifRes.value as any).pagination;
        setUnreadNotifications(pagination.unreadCount || 0);
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

      const myCompanyRes = await api.getMyCompanies();
      const myCompanyPayload = (myCompanyRes?.data as any) || myCompanyRes;
      const companies = (myCompanyPayload?.companies || myCompanyPayload?.data?.companies || []) as Array<any>;
      const primaryCompany = companies[0] || null;

      const missing: string[] = [];

      if (!user?.location?.city || !user?.location?.state || !user?.location?.country) {
        missing.push("account location");
      }

      if (!primaryCompany?.name?.trim()) missing.push("company name");
      if (!primaryCompany?.website?.trim()) missing.push("company website");
      if (!primaryCompany?.description?.trim()) missing.push("company description");

      if (!primaryCompany?.location?.city || !primaryCompany?.location?.state || !primaryCompany?.location?.country) {
        missing.push("company location");
      }
      // Require admin approval before allowing company posting
      if (primaryCompany && primaryCompany.verificationStatus !== 'approved') {
        missing.push('company verification (pending admin approval)');
      }

      setCompanyProfileMissing(missing);
      setCompanyProfileReady(missing.length === 0);
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

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "organization",
      label: "Organization",
      icon: Users,
      children: [
        { id: "companies", label: "Companies", icon: Users },
        { id: "connections", label: "Team & Contacts", icon: Users },
        {
          id: "communities",
          label: "Communities",
          icon: Users,
          href: communitiesRoute === undefined ? undefined : communitiesRoute || "/communities/manage",
        },
      ],
    },
    {
      id: "work",
      label: "Work",
      icon: Briefcase,
      children: [
        { id: "my-jobs", label: "Company Jobs", icon: Briefcase, badge: jobs.filter(j => j.status === "open").length },
        { id: "proposals", label: "Proposals", icon: FileText, badge: proposals.filter(p => ["sent", "viewed", "shortlisted"].includes(p.status)).length },
        { id: "contracts", label: "Contracts", icon: FileCheck, badge: contracts.filter(c => c.status === "active").length },
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
    overview: (
      <CompanyOverviewTab
        analytics={analytics}
        jobs={jobs}
        proposals={proposals}
        loading={loading}
        canPostCompanyJob={companyProfileReady}
      />
    ),
    companies: <CompaniesTab />,
    "my-jobs": <MyJobsTab jobs={jobs} loading={loading} onRefresh={fetchData} canPostCompanyJob={companyProfileReady} isCompanyScope={true} />,
    proposals: <ProposalsTab proposals={proposals} loading={loading} onAction={() => { /* reuse client actions later */ }} />,
    contracts: <ContractsTab contracts={contracts} loading={loading} onRefresh={fetchData} focusContractId={focusContractId} />,
    connections: <ConnectionsTab user={user} />,
    notifications: <AdminNotificationsPanel />,
    communities:
      communitiesRoute === undefined ? (
        <div className="py-4 text-sm text-slate-500">Loading communities...</div>
      ) : (
        <Navigate to={communitiesRoute || "/communities/manage"} replace />
      ),
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
        <Button
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-1.5"
          disabled={!companyProfileReady}
          title={!companyProfileReady ? `Complete profile first: ${companyProfileMissing.join(", ")}` : ""}
          onClick={() => navigate("/post-job?scope=company")}
        >
          Post Company Job
        </Button>
      }
    >
      {!companyProfileReady && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p>
            Complete your profile before posting company jobs. Missing: {companyProfileMissing.join(", ")}.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white/70 text-amber-900"
              onClick={() => navigate("/profile?tab=company")}
            >
              Open Company Profile
            </Button>
          </div>
        </div>
      )}
      {tabContent[activeTab] || tabContent["overview"]}
    </DashboardLayout>
    <VerificationStatusCard />
    </>
  );
};

export default CompanyDashboard;
