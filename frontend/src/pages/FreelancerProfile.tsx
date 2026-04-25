import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin, UserCheck, Mail, Star,
  Briefcase, ExternalLink, Share2, Loader2,
  ShieldCheck, Trophy,  Globe, TrendingUp, CheckCircle2,
  Sparkles, Award, GraduationCap, BadgeCheck, Download,
} from "lucide-react";
import { MdThumbUp } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { toggleGuestFollow } from "@/lib/guestStorage";
import { formatCurrency } from "@/lib/currency";
import { useUserPresence } from "@/hooks/usePresence";
import { formatLastSeen } from "@/utils/presence";
import { getSkillIcon } from "@/constants/skills";
import { getToolIcon, getToolIconColorClass } from "@/constants/tools";
import { resolveAvatarSrc } from "@/lib/avatar";
import FeaturedRibbon from "@/components/featured/FeaturedRibbon";
import {  BsGlobe, BsPlusCircleFill } from "react-icons/bs";
import { HiRectangleStack } from "react-icons/hi2";
import { FiLink } from "react-icons/fi";

import { AiFillInstagram, AiFillGithub } from "react-icons/ai";


interface FreelancerData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    bannerImage?: string;
    location: { city: string; state: string };
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    verifiedBadges?: { type: string; verifiedAt?: string }[];
    adminBadges?: { type: string; assignedAt?: string; assignedBy?: string }[];
    followers?: string[];
    following?: string[];
    socialLinks?: {
      portfolio?: string;
      github?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  title: string;
  bio: string;
  skills: Array<{ name: string; level: string }>;
  tools?: string[];
  rates: { minRate: number; maxRate: number; currency: string; rateType: string };
  localScore: number;
  globalScore: number;
  completedJobs: number;
  profileViews: number;
  appreciationsCount?: number;
  availability: { status: string };
  portfolio: Array<{
    _id: string; title: string; description: string;
    images?: string[]; imageUrl?: string; link?: string; tags: string[];
    appreciations?: string[];
  }>;
  experience: Array<{ title: string; company: string; duration: string }>;
  education: Array<{
    degree?: string;
    institution?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
    year?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuedBy?: string;
    issuedDate?: string;
    expiryDate?: string;
    credentialId?: string;
    verificationUrl?: string;
  }>;
}

interface AssetData {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  previewImages?: string[];
  price?: number;
  currency?: string;
  downloads?: number;
}

interface CompanyOption {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
}

interface HireMilestone {
  title: string;
  description: string;
  amount: string;
  dueDate: string;
}

const toIsoDate = (date: Date) => {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 10);
};

const getDefaultMilestoneDueDate = (offsetDays = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(1, offsetDays));
  return toIsoDate(date);
};

const FreelancerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const currentUserId = (user as any)?._id;
  const hasHandledHireIntent = useRef(false);

  const [activeTab, setActiveTab] = useState("portfolio");
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [hiringTypeSwitching, setHiringTypeSwitching] = useState(false);
  const [myCompanies, setMyCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [hireForm, setHireForm] = useState({
    title: "",
    description: "",
    amountTotal: "",
    amountType: "fixed" as "fixed" | "hourly",
    currency: "USD",
    hiringType: ((user as any)?.accountType === "company" ? "company" : "individual") as "individual" | "company",
    companyId: (user as any)?.companyId || "",
    terms: "",
  });
  const [milestones, setMilestones] = useState<HireMilestone[]>([
    { title: "", description: "", amount: "", dueDate: getDefaultMilestoneDueDate(7) },
  ]);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [companyDraft, setCompanyDraft] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
  });
  const todayIso = toIsoDate(new Date());
  const hasAtLeastOneValidMilestone = milestones.some((m) => (
    m.title.trim().length > 0
    && Number.isFinite(Number(m.amount))
    && Number(m.amount) > 0
    && Boolean(m.dueDate)
  ));
  const userCompanyId = String((user as any)?.companyId || "");
  const hasCompanyOption = myCompanies.length > 0 || Boolean(userCompanyId);
  const hasUserCompanyInList = Boolean(userCompanyId) && myCompanies.some((company) => company._id === userCompanyId);

  // Get real-time online status
  const { isOnline, lastSeen } = useUserPresence(freelancer?.userId?._id || '');

  const normalizeId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (record._id) return String(record._id);
      if (record.id) return String(record.id);

      const nestedUser = record.userId as unknown;
      if (nestedUser && typeof nestedUser === "object") {
        const nested = nestedUser as Record<string, unknown>;
        if (nested._id) return String(nested._id);
        if (nested.id) return String(nested.id);
      }
      if (typeof nestedUser === "string" || typeof nestedUser === "number") {
        return String(nestedUser);
      }
    }

    return "";
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getFreelancer(id!);
      if (response.data) {
        const payload = response.data as any;
        const data = payload.freelancer || payload.profile || payload;
        const normalizedSkills = Array.isArray(data?.skills) ? data.skills : [];
        const normalizedEducation = Array.isArray(data?.education) ? data.education : [];
        const normalizedCertifications = Array.isArray(data?.certifications) ? data.certifications : [];
        const normalizedPortfolio = Array.isArray(data?.portfolio) ? data.portfolio : [];
        const normalizedTools = Array.isArray(data?.tools)
          ? data.tools
            .map((tool: unknown) => (typeof tool === "string" ? tool.trim() : String(tool || "").trim()))
            .filter(Boolean)
          : [];

        setFreelancer({
          ...data,
          skills: normalizedSkills,
          education: normalizedEducation,
          certifications: normalizedCertifications,
          portfolio: normalizedPortfolio,
          tools: normalizedTools,
        });
        const followers: unknown[] = data.userId?.followers || [];
        setFollowerCount(followers.length);
        setFollowing(
          currentUserId
            ? followers.some((entry) => normalizeId(entry) === String(currentUserId))
            : false,
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch freelancer profile");
    } finally {
      setLoading(false);
    }
  }, [id, currentUserId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    const ownerId = freelancer?.userId?._id;
    if (!ownerId) {
      setAssets([]);
      setAssetsError("");
      return;
    }

    let canceled = false;

    const fetchFreelancerAssets = async () => {
      setAssetsLoading(true);
      setAssetsError("");
      try {
        const res: any = await api.getAssets({ creatorId: ownerId, limit: 24, sort: "-createdAt" });
        const payload = (res?.data as any) || res;
        const items = (payload?.assets || payload?.data?.assets || []) as AssetData[];

        if (!canceled) {
          setAssets(items);
        }
      } catch {
        if (!canceled) {
          setAssets([]);
          setAssetsError("Could not load freelancer assets right now.");
        }
      } finally {
        if (!canceled) {
          setAssetsLoading(false);
        }
      }
    };

    fetchFreelancerAssets();

    return () => {
      canceled = true;
    };
  }, [freelancer?.userId?._id]);

  useEffect(() => {
    const fetchMyCompanies = async () => {
      if (!hireDialogOpen || !user || (user.role !== "client" && user.role !== "admin")) return;
      setLoadingCompanies(true);
      try {
        const res: any = await api.getMyCompanies();
        const payload = (res?.data as any) || res;
        const companies = (payload.companies || payload.data?.companies || []) as CompanyOption[];
        setMyCompanies(companies);

        setHireForm((prev) => {
          const defaultCompanyId = prev.companyId || (user as any)?.companyId || companies[0]?._id || "";
          const shouldUseCompany =
            prev.hiringType === "company" ||
            (user as any)?.accountType === "company";

          return {
            ...prev,
            companyId: shouldUseCompany ? defaultCompanyId : "",
            hiringType: shouldUseCompany ? "company" : "individual",
          };
        });
      } catch {
        setMyCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchMyCompanies();
  }, [hireDialogOpen, user]);

  useEffect(() => {
    if (hireForm.hiringType !== "company") {
      setShowCompanyDetails(false);
      return;
    }

    setShowCompanyDetails(true);

    if (!hireForm.companyId || hireForm.companyId === "__new__") {
      setCompanyDraft((prev) => ({
        ...prev,
        name: prev.name || "",
      }));
      return;
    }

    const selectedCompany = myCompanies.find((company) => company._id === hireForm.companyId);
    if (selectedCompany) {
      setCompanyDraft({
        name: selectedCompany.name || "",
        description: selectedCompany.description || "",
        industry: selectedCompany.industry || "",
        website: selectedCompany.website || "",
      });
    }
  }, [hireForm.hiringType, hireForm.companyId, myCompanies]);

  const syncFollowingFromDb = useCallback(async () => {
    if (!user || !freelancer?.userId?._id) return;

    try {
      const meRes: any = await api.getMe();
      const me = (meRes?.data as any)?.user || meRes?.data || {};
      if (Array.isArray(me?.following)) {
        const followingIds: string[] = me.following.map((v: unknown) => normalizeId(v)).filter(Boolean);
        setFollowing(followingIds.includes(String(freelancer.userId._id)));
        return;
      }

      // Fallback for older backend payloads that do not expose me.following.
      const profileFollowers: unknown[] = Array.isArray(freelancer?.userId?.followers)
        ? freelancer.userId.followers
        : [];
      setFollowing(
        currentUserId
          ? profileFollowers.some((entry) => normalizeId(entry) === String(currentUserId))
          : false,
      );
    } catch {
      // Keep existing state if sync fails.
    }
  }, [user, freelancer?.userId?._id, freelancer?.userId?.followers, currentUserId]);

  useEffect(() => {
    if (!user || !freelancer?.userId?._id) return;
    syncFollowingFromDb();
  }, [user, freelancer?.userId?._id, syncFollowingFromDb]);

  const handleFollow = async () => {
    if (!freelancer?.userId?._id) return;

    if (!user) {
      const isNowFollowing = toggleGuestFollow(freelancer.userId._id);
      setFollowing(isNowFollowing);
      setFollowerCount((c) => (isNowFollowing ? c + 1 : Math.max(c - 1, 0)));
      return;
    }
    setFollowLoading(true);
    try {
      if (following) {
        await api.unfollowUser(freelancer!.userId._id);
        setFollowerCount((c) => Math.max(c - 1, 0));
      } else {
        await api.followUser(freelancer!.userId._id);
        setFollowerCount((c) => c + 1);
      }
      await refreshUser();
      await syncFollowingFromDb();
    } catch (err: any) {
      const status = err?.status;
      const message = String(err?.response?.data?.message || err?.message || '').toLowerCase();

      // Treat duplicate follow attempts as success to keep UI consistent.
      if (!following && status === 400 && message.includes('already following')) {
        setFollowing(true);
        await syncFollowingFromDb();
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!freelancer?.userId?._id) return;

    let dashboardBase = "/";
    if (user.role === "client") dashboardBase = "/dashboard/client";
    else if (user.role === "freelancer") dashboardBase = "/dashboard/freelancer";

    navigate(`${dashboardBase}?tab=messages&userId=${freelancer.userId._id}`);
  };

  const openHireDialog = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "client" && user.role !== "admin") {
      toast({
        title: "Hiring access required",
        description: "Only client or admin accounts can send a hire request.",
      });
      return;
    }

    setHireForm((prev) => ({
      ...prev,
      title: prev.title || `Hire request for ${freelancer?.userId?.name || "freelancer"}`,
      currency: freelancer?.rates?.currency || prev.currency || "USD",
      amountType: freelancer?.rates?.rateType === "hourly" ? "hourly" : prev.amountType,
      amountTotal: prev.amountTotal || String(freelancer?.rates?.minRate || ""),
      hiringType: ((user as any)?.accountType === "company" ? "company" : "individual"),
      companyId: (user as any)?.accountType === "company" ? (prev.companyId || (user as any)?.companyId || "") : "",
    }));
    setMilestones((prev) => prev.length > 0 ? prev : [{ title: "", description: "", amount: "", dueDate: getDefaultMilestoneDueDate(7) }]);
    setHireDialogOpen(true);
  };

  useEffect(() => {
    if (!freelancer?.userId?._id) return;

    const params = new URLSearchParams(location.search);
    const action = params.get("action");

    if (action !== "hire" || hasHandledHireIntent.current) return;

    hasHandledHireIntent.current = true;
    openHireDialog();

    params.delete("action");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [freelancer?.userId?._id, location.pathname, location.search, navigate]);

  const handleSubmitHireRequest = async () => {
    if (!freelancer?.userId?._id) return;

    const amount = Number(hireForm.amountTotal);
    if (hireForm.title.trim().length < 5) {
      toast({ title: "Title required", description: "Please provide a title (at least 5 characters).", variant: "destructive" });
      return;
    }

    if (hireForm.description.trim().length < 20) {
      toast({
        title: "Project brief required",
        description: "Please add a project brief (at least 20 characters).",
        variant: "destructive",
      });
      return;
    }

    if (!/^[A-Z]{3,5}$/.test((hireForm.currency || "").trim().toUpperCase())) {
      toast({
        title: "Invalid currency",
        description: "Use a valid currency code like USD, EUR, INR.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Please provide a valid contract amount.", variant: "destructive" });
      return;
    }

    const normalizedMilestones = milestones
      .map((m, index) => ({
        title: m.title.trim(),
        description: m.description.trim(),
        amount: Number(m.amount),
        dueDate: m.dueDate || getDefaultMilestoneDueDate((index + 1) * 7),
      }))
      .filter((m) => m.title && Number.isFinite(m.amount) && m.amount > 0);

    if (normalizedMilestones.length === 0) {
      toast({
        title: "Milestone required",
        description: "Add at least one milestone with title, amount, and due date.",
        variant: "destructive",
      });
      return;
    }

    const hasInvalidMilestoneDate = normalizedMilestones.some((m) => m.dueDate < todayIso);
    if (hasInvalidMilestoneDate) {
      toast({
        title: "Invalid milestone date",
        description: "Milestone due dates cannot be in the past.",
        variant: "destructive",
      });
      return;
    }

    if (normalizedMilestones.length > 0) {
      const sum = normalizedMilestones.reduce((acc, item) => acc + item.amount, 0);
      if (Math.abs(sum - amount) > 0.01) {
        toast({
          title: "Milestone total mismatch",
          description: "Milestones must add up to the contract amount.",
          variant: "destructive",
        });
        return;
      }
    }

    setHireSubmitting(true);
    try {
      let resolvedCompanyId = hireForm.companyId;

      if (hireForm.hiringType === "company") {
        const trimmedName = companyDraft.name.trim();
        const trimmedWebsite = companyDraft.website.trim();
        const trimmedDescription = companyDraft.description.trim();
        if (!resolvedCompanyId) {
          toast({
            title: "Company details required",
            description: "Select a company or choose create company first.",
            variant: "destructive",
          });
          return;
        }

        if (resolvedCompanyId === "__new__") {
          if (!trimmedName || !trimmedWebsite || !trimmedDescription) {
            toast({
              title: "Complete company profile",
              description: "Company name, website, and hiring brief are required.",
              variant: "destructive",
            });
            return;
          }

          const createRes: any = await api.createCompany({
            name: trimmedName,
            description: trimmedDescription || undefined,
            industry: companyDraft.industry.trim() || undefined,
            website: trimmedWebsite || undefined,
          });

          const createdCompany =
            (createRes?.data as any)?.company ||
            (createRes?.data as any)?.data?.company ||
            (createRes as any)?.company ||
            (createRes as any)?.data?.company;

          if (!createdCompany?._id) {
            throw new Error("Company was created but no company id was returned.");
          }

          resolvedCompanyId = createdCompany._id;
          setMyCompanies((prev) => [createdCompany, ...prev.filter((c) => c._id !== createdCompany._id)]);
          setHireForm((prev) => ({ ...prev, companyId: createdCompany._id, hiringType: "company" }));
          await refreshUser();
          toast({
            title: "Company created",
            description: "Company saved. Select it and send the hire request.",
          });
          return;
        } else if (showCompanyDetails && trimmedName) {
          const existingCompany = myCompanies.find((company) => company._id === resolvedCompanyId);
          const hasChanges =
            !existingCompany ||
            existingCompany.name !== trimmedName ||
            (existingCompany.description || "") !== trimmedDescription ||
            (existingCompany.industry || "") !== companyDraft.industry.trim() ||
            (existingCompany.website || "") !== trimmedWebsite;

          if (hasChanges) {
            const updateRes: any = await api.updateCompany(resolvedCompanyId, {
              name: trimmedName,
              description: trimmedDescription || undefined,
              industry: companyDraft.industry.trim() || undefined,
              website: trimmedWebsite || undefined,
            });

            const updatedCompany =
              (updateRes?.data as any)?.company ||
              (updateRes?.data as any)?.data?.company ||
              (updateRes as any)?.company ||
              (updateRes as any)?.data?.company;

            if (updatedCompany?._id) {
              setMyCompanies((prev) => prev.map((company) => (
                company._id === updatedCompany._id ? { ...company, ...updatedCompany } : company
              )));
            }
          }
        }
      }

      await api.createHiringRequest({
        freelancerId: freelancer.userId._id,
        title: hireForm.title.trim(),
        description: hireForm.description.trim(),
        amount: {
          total: amount,
          type: hireForm.amountType,
          currency: hireForm.currency || "USD",
        },
        milestones: normalizedMilestones,
        hiringType: hireForm.hiringType,
        companyId: hireForm.hiringType === "company" ? resolvedCompanyId : undefined,
        terms: hireForm.terms.trim(),
      });

      toast({
        title: "Hire request sent",
        description: "The freelancer can now accept or decline your request.",
      });
      setHireDialogOpen(false);
      setMilestones([{ title: "", description: "", amount: "", dueDate: getDefaultMilestoneDueDate(7) }]);
      setShowCompanyDetails(false);
      navigate("/dashboard/client?tab=hiring-requests");
    } catch (err: any) {
      toast({
        title: "Could not send request",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setHireSubmitting(false);
    }
  };

  const handleHiringTypeChange = async (nextType: "individual" | "company") => {
    if (nextType === hireForm.hiringType) return;

    const currentAccountType = ((user as any)?.accountType || "individual") as "individual" | "company";

    if (nextType === "company" && currentAccountType !== "company") {
      toast({ title: "Switching account", description: "Updating to company mode for this hiring flow..." });
      setHiringTypeSwitching(true);
      try {
        await api.updateProfile({ accountType: "company" });
        await refreshUser();
        toast({ title: "Switched to company", description: "You can now hire as a company." });
      } catch (err: any) {
        toast({
          title: "Switch failed",
          description: err?.response?.data?.message || err?.message || "Could not switch account type.",
          variant: "destructive",
        });
        return;
      } finally {
        setHiringTypeSwitching(false);
      }
    }

    if (nextType === "individual" && currentAccountType === "company") {
      toast({ title: "Switching account", description: "Updating to individual mode for this hiring flow..." });
      setHiringTypeSwitching(true);
      try {
        await api.updateProfile({ accountType: "individual" });
        await refreshUser();
        toast({ title: "Switched to individual", description: "You can now hire as an individual." });
      } catch (err: any) {
        toast({
          title: "Switch failed",
          description: err?.response?.data?.message || err?.message || "Could not switch account type.",
          variant: "destructive",
        });
        return;
      } finally {
        setHiringTypeSwitching(false);
      }
    }

    setHireForm((prev) => ({
      ...prev,
      hiringType: nextType,
      companyId: nextType === "company" ? (prev.companyId || userCompanyId || "") : "",
    }));
  };

  const handleShare = async () => {
    if (!freelancer?.userId?.name || !freelancer?.title) return;

    const url = window.location.href;
    const title = `${freelancer.userId.name} – ${freelancer.title}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Profile link copied",
          description: "You can now paste it anywhere to share.",
        });
      } else {
        // Fallback: select URL
        const dummy = document.createElement("input");
        dummy.value = url;
        document.body.appendChild(dummy);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        toast({
          title: "Profile link copied",
          description: "You can now paste it anywhere to share.",
        });
      }
    } catch {
      toast({
        title: "Unable to share",
        description: "Something went wrong while sharing this profile.",
      });
    }
  };

  const formatRate = () => {
    if (!freelancer) return "";
    const { rates } = freelancer;
    const amount = formatCurrency(rates.minRate, rates.currency);
    return rates.rateType === "hourly" ? `${amount}/hr` : amount;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getPortfolioImage = (item: FreelancerData["portfolio"][0]) =>
    item.images?.[0] || item.imageUrl || "";

  const getAssetImage = (asset: AssetData) => asset.previewImages?.[0] || "";

  const toAbsoluteExternalUrl = (rawUrl?: string) => {
    if (!rawUrl) return "";
    const trimmed = rawUrl.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const formatSkillLevel = (level?: string) => {
    const normalized = (level || "").toLowerCase();
    if (normalized === "expert") return "Expert";
    if (normalized === "intermediate") return "Intermediate";
    if (normalized === "beginner") return "Beginner";
    return "Intermediate";
  };

  const formatCertificateDate = (date?: string) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString();
  };

  const getBadgeLabel = (badgeType: string) => {
    const labels: Record<string, string> = {
      verified: "Verified",
      top_freelancer: "Top Freelancer",
      rising_talent: "Rising Talent",
      local_verified: "Local Verified",
      trusted_client: "Trusted Client",
      featured_visualization: "Featured In Visualization",
      email: "Email Verified",
      phone: "Phone Verified",
      id: "ID Verified",
      selfie: "Selfie Verified",
      college: "College Verified",
      workshop: "Workshop Certified",
      employer: "Employer Verified",
      github: "GitHub Verified"
    };
    return labels[badgeType] || badgeType;
  };

  const getBadgeColor = (badgeType: string) => {
    if (badgeType === "verified" || badgeType === "top_freelancer") return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 shadow-sm";
    if (badgeType === "rising_talent") return "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-300 shadow-sm";
    if (badgeType === "local_verified") return "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-300 shadow-sm";
    if (badgeType === "trusted_client") return "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-300 shadow-sm";
    if (badgeType === "featured_visualization") return "bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-800 border-amber-300 shadow-sm";
    // Verified badge colors
    if (badgeType === "email" || badgeType === "phone") return "bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-300 shadow-sm";
    if (badgeType === "id" || badgeType === "selfie") return "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-300 shadow-sm";
    if (badgeType === "college" || badgeType === "workshop") return "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-300 shadow-sm";
    if (badgeType === "employer" || badgeType === "github") return "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border-slate-300 shadow-sm";
    return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-300 shadow-sm";
  };

  const getBadgeIcon = (badgeType: string) => {
    const iconProps = { className: "w-3.5 h-3.5" };
    if (badgeType === "verified") return <CheckCircle2 {...iconProps} />;
    if (badgeType === "top_freelancer") return <Trophy {...iconProps} />;
    if (badgeType === "rising_talent") return <TrendingUp {...iconProps} />;
    if (badgeType === "local_verified") return <Globe {...iconProps} />;
    if (badgeType === "trusted_client") return <Award {...iconProps} />;
    if (badgeType === "featured_visualization") return <BadgeCheck {...iconProps} />;
    if (badgeType === "email" || badgeType === "phone") return <Mail {...iconProps} />;
    if (badgeType === "id" || badgeType === "selfie") return <ShieldCheck {...iconProps} />;
    if (badgeType === "college" || badgeType === "workshop") return <Star {...iconProps} />;
    if (badgeType === "employer") return <Briefcase {...iconProps} />;
    if (badgeType === "github") return <Sparkles {...iconProps} />;
    return <Sparkles {...iconProps} />;
  };

  // Only public-facing badges are shown on the profile page.
  // Private verification steps (email, phone, etc.) are visible only in the dashboard.
  const publicBadgeTypes: string[] = ["verified", "top_freelancer", "rising_talent", "local_verified", "trusted_client"];

  const allBadges = [
    ...(freelancer?.userId?.verifiedBadges || [])
      .map(b => ({ ...b, source: 'verified' as const })),
    ...(freelancer?.userId?.adminBadges || [])
      .map(b => ({ ...b, source: 'admin' as const }))
  ].filter(b => publicBadgeTypes.includes(b.type));

  const hasFeaturedVisualizationBadge = (freelancer?.userId?.adminBadges || []).some((b) => b.type === "featured_visualization");
  const featuredAdminBadge = freelancer?.userId?.adminBadges?.find((b) => b.type === "featured_visualization");
  const featuredTier = Math.max(1, Math.min(5, Math.round((freelancer?.localScore || 0) / 20)));
  const featuredSince = featuredAdminBadge?.assignedAt
    ? new Date(featuredAdminBadge.assignedAt).toLocaleDateString()
    : null;

  const freelancerOwnerId = freelancer?.userId?._id;
  const isOwnProfile = !!(currentUserId && freelancerOwnerId && currentUserId === freelancerOwnerId);
  const appreciationsCount = typeof freelancer?.appreciationsCount === "number"
    ? freelancer.appreciationsCount
    : (freelancer?.portfolio || []).reduce((sum, item) => sum + (item.appreciations?.length || 0), 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !freelancer) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 py-12 text-center">
          <p className="text-red-600 mb-4">{error || "Freelancer not found"}</p>
          <Link to="/browse" className="text-blue-600 hover:underline">← Back to Browse</Link>
        </div>
      </Layout>
    );
  }

  const tabs = [
    // { id: "profile", label: "Profile" },
    // { id: "skills", label: "Skills" },
    { id: "portfolio", label: "Work" },
    { id: "assets", label: "Assets" },
    { id: "education", label: "Education" },
    { id: "certificates", label: "Certificates" },
  ];

  return (
    <Layout>
      <section className="min-h-screen bg-white">
        <div className="w-full">
          <div className="group relative">
            {/* Cover image / header */}
            <div className="group relative h-36 sm:h-48 md:h-64 overflow-hidden border-b border-white/10 bg-gradient-to-r from-gray-700 via-neutral-800 to-gray-800">
              {freelancer?.userId?.bannerImage ? (
                <img
                  src={freelancer.userId.bannerImage}
                  alt="Profile banner"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : freelancer?.portfolio?.length > 0 && freelancer.portfolio[0] && getPortfolioImage(freelancer.portfolio[0]) ? (
                <img
                  src={getPortfolioImage(freelancer.portfolio[0])}
                  alt={freelancer.portfolio[0].title}
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : null}

              <div className="absolute inset-0 bg-black/35" />


            </div>


            <div className="absolute -bottom-14 left-10  ">
              <div className=" bottom-0 h-24 w-24 shrink-0 rounded-full bg-slate-100 shadow-md sm:h-32 sm:w-32">
                <img
                  src={resolveAvatarSrc(freelancer?.userId?.avatar)}
                  alt={freelancer?.userId?.name || "Freelancer"}
                  className="h-full w-full rounded-full object-cover"
                />
                <span
                  className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
                  title={isOnline ? "Online" : `Last seen ${formatLastSeen(lastSeen)}`}
                />
              </div>
            </div>

            <div className=" mb-24">
              {hasFeaturedVisualizationBadge && (
                <div className="absolute right-44  z-30">
                  <FeaturedRibbon
                    containerClassName="relative group"
                    tooltipClassName="absolute right-0 top-0 w-32 translate-x-full translate-y-full"
                    tier={featuredTier}
                    localScore={freelancer.localScore || 0}
                    featuredSince={featuredSince}
                  />
                </div>
              )}

            </div>
          </div>



          {/* Sidebar + main content */}
          <div className="mx-auto mt-4 w-full max-w-[1500px] px-3 sm:mt-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
              {/* Left sidebar */}
              <aside className="space-y-3 sm:space-y-4 lg:w-72">
                <div className="rounded-xl bg-white p-4 text-gray-900">
                  <div className="flex flex-col items-start gap-3">

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <h1 className="truncate text-2xl font-bold  text-gray-900">{freelancer?.userId?.name}</h1>
                          <p className={freelancer.availability?.status === "available" ? "text-green-500  bg-green-800 py-0.5 px-2 rounded-lg " : "text-orange-500  bg-orange-800 py-0.5 px-2 rounded-lg"}>
                            {freelancer.availability?.status === "available" ? "Available now" : "Busy"}
                          </p>
                        </div>
                        {allBadges.some((b) => b.type === "verified") && (
                          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">{freelancer?.title}</p>
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {freelancer?.userId?.location?.city}, {freelancer?.userId?.location?.state}
                        </p>

                      </div>
                    </div>
                  </div>

                  {allBadges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {allBadges.map((badge, idx) => (
                        <div
                          key={`${badge.source}-${badge.type}-${idx}`}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${getBadgeColor(badge.type)}`}
                          title={`${getBadgeLabel(badge.type)} ${badge.source === "admin" ? "(Admin Badge)" : ""}`}
                        >
                          <span className="mr-1 flex h-3 w-3 items-center justify-center">{getBadgeIcon(badge.type)}</span>
                          <span>{getBadgeLabel(badge.type)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isOwnProfile && (
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={following ? "outline" : "default"}
                        className={`w-full rounded-full gap-2 text-xs sm:text-sm ${following
                          ? "border-blue-300 text-blue-700 hover:bg-blue-700 hover:text-blue-50"
                          : "bg-blue-700 hover:bg-blue-700 text-white"
                          }`}
                      >
                        {followLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : following ? (
                          <>
                            <UserCheck className="h-4 w-4" /> Unfollow
                          </>
                        ) : (
                          <>
                            <BsPlusCircleFill className="h-4 w-4" /> Follow
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleContact}
                        variant="outline"
                        className="w-full rounded-full gap-2 border-gray-300 bg-white text-xs text-gray-700 hover:bg-blue-700 sm:text-sm"
                      >
                        <Mail className="h-4 w-4" /> Message
                      </Button>

                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full rounded-full border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-50 hover:text-gray-500 sm:text-sm"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Share2 className="h-4 w-4" /> Share profile
                        </span>
                      </button>

                      <div className="w-full  mt-4 flex justify-center items-center">
                        <div>
                          {user?.role === "client" && (
                            <div
                              onClick={openHireDialog}
                              className=" flex justify-center  px-5 w-44 p-3 border border-gray-300  gap-2 bg-transparent  hover:text-gray-500 text-xs text-black  sm:text-sm"
                            >
                              <HiRectangleStack className="h-4 w-4" /> Hire
                            </div>
                          )}
                        </div>
                      </div>

                      {(freelancer.userId?.socialLinks?.portfolio || freelancer.userId?.socialLinks?.github || freelancer.userId?.socialLinks?.instagram) && (
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 mb-3">Social Links</h3>
                          <div className="flex  flex-col gap-2">
                            {freelancer.userId?.socialLinks?.portfolio && (
                              <div className="flex justify-between items-center border border-gray-300 px-2">
                                <div className="flex justify-center items-center ">
                                  <BsGlobe className="w-3.5 h-3.5" />
                                  <a
                                    href={toAbsoluteExternalUrl(freelancer.userId.socialLinks.portfolio)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Portfolio Website
                                  </a>
                                  <FiLink className="w-3.5 h-3.5" />

                                </div>
                                <div> <ExternalLink className="w-3.5 h-3.5" /></div>
                              </div>
                            )}
                            {freelancer.userId?.socialLinks?.github && (
                              <div className="flex justify-between items-center border border-gray-300 px-2">
                                <div className="flex justify-center items-center ">
                                  <AiFillGithub className="w-3.5 h-3.5" />
                                  <a
                                    href={toAbsoluteExternalUrl(freelancer.userId.socialLinks.github)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg  bg-white text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    GitHub
                                  </a>
                                  <FiLink className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            )}
                            {freelancer.userId?.socialLinks?.instagram && (
                              <div className="flex justify-between items-center border border-gray-300 px-2">
                                <div className="flex justify-center items-center ">
                                  <AiFillInstagram  className="w-3.5 h-3.5" />
                                  <a
                                    href={toAbsoluteExternalUrl(freelancer.userId.socialLinks.instagram)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Instagram 
                                  </a>
                                  <FiLink className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs sm:rounded-2xl sm:p-4 sm:text-sm">
                  <p className="mb-3 font-semibold text-gray-900">Profile Insights</p>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Followers</span>
                      <span className="font-semibold text-gray-900">{followerCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Following</span>
                      <span className="font-semibold text-gray-900">{freelancer.userId.following?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Completed Jobs</span>
                      <span className="font-semibold text-gray-900">{freelancer.completedJobs || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Appreciations</span>
                      <span className="font-semibold text-gray-900">{appreciationsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Local Score</span>
                      <span className="font-semibold text-gray-900">{freelancer.localScore || 0}</span>
                    </div>
                  </div>
                </div>

                {freelancer.bio && (
                  <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm">
                    <p className="font-semibold text-gray-900 mb-2">About</p>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed line-clamp-6">{freelancer.bio}</p>
                  </div>
                )}

                {freelancer.skills?.length > 0 && (
                  <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm">
                    <p className="font-semibold text-gray-900 mb-2 sm:mb-3">Top Skills</p>
                    <div className="space-y-2">
                      {freelancer.skills.slice(0, 10).map((skill, i) => (
                        <button
                          key={i}
                          type="button"
                          className="group relative w-full overflow-hidden rounded-xl border border-slate-600 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 py-2 text-left"
                        >
                          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_45%)]" />
                          <span className="relative flex items-center justify-between">
                            <span className="flex items-center gap-2.5">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/35 text-slate-100 ring-1 ring-white/20">
                                {React.createElement(getSkillIcon(skill.name), { className: "h-4 w-4" })}
                              </span>
                              <span className="text-xs font-semibold text-white sm:text-sm">{skill.name}</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-slate-300">{formatSkillLevel(skill.level)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {freelancer.tools?.length > 0 && (
                  <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm">
                    <p className="font-semibold text-gray-900 mb-2 sm:mb-3">Tools</p>
                    <div className="grid grid-cols-3 gap-2">
                      {freelancer.tools.slice(0, 12).map((tool, idx) => (
                        <button
                          key={`${tool}-${idx}`}
                          type="button"
                          className="group relative h-14 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-slate-300"
                          aria-label={tool}
                          title={tool}
                        >
                          <span className="relative flex h-full w-full items-center justify-center">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">
                              {React.createElement(getToolIcon(tool), { className: `h-5 w-5 ${getToolIconColorClass(tool)}` })}
                            </span>
                          </span>
                          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 whitespace-nowrap">
                            {tool}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              {/* Main content with tabs and portfolio */}
              <div className="flex-1 bg-white rounded-lg sm:rounded-2xl border border-gray-200">
                <div className="flex gap-1 border-b border-gray-200 px-3 sm:px-4 md:px-6 overflow-x-auto scrollbar-hide">                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === t.id
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-900"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
                </div>

                <div className="p-3 sm:p-4 md:p-6 scrollbar-hide">

                  {activeTab === "education" && (
                    <div className="w-full h-full p-1 flex items-center justify-center">
                      {freelancer.education?.length > 0 ? (
                        <div className="flex w-full flex-row flex-wrap gap-3 sm:gap-4">
                          {freelancer.education.map((edu, i) => (
                            <div key={i} className="flex  gap-4 p-4  border border-gray-300">
                              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1 border-b border-gray-100 pb-4">
                                <h4 className="font-semibold text-gray-900">{edu.degree || "Education"}</h4>
                                <p className="text-sm text-gray-600">{edu.institution || ""}</p>
                                {edu.field && (
                                  <p className="text-xs text-gray-500 mt-0.5">{edu.field}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {edu.year || ((edu.startYear || edu.endYear)
                                    ? `${edu.startYear || "?"} - ${edu.endYear || "Present"}`
                                    : "")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No education added yet.</p>
                      )}
                    </div>
                  )}

                  {activeTab === "certificates" && (
                    <div className="max-w-3xl">
                      {freelancer.certifications && freelancer.certifications.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {freelancer.certifications.map((cert, i) => (
                            <div key={i} className="rounded-xl border border-gray-200 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{cert.name || "Certificate"}</h4>
                                  <p className="text-sm text-gray-600 mt-0.5">{cert.issuedBy || "Issuer not provided"}</p>
                                </div>
                                <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              </div>
                              <div className="mt-3 text-xs text-gray-500 space-y-1">
                                <p>Issued: {formatCertificateDate(cert.issuedDate)}</p>
                                <p>Expiry: {formatCertificateDate(cert.expiryDate)}</p>
                                {cert.credentialId && <p>Credential ID: {cert.credentialId}</p>}
                              </div>
                              {cert.verificationUrl && (
                                <a
                                  href={cert.verificationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                >
                                  Verify certificate <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No certificates added yet.</p>
                      )}
                    </div>
                  )}

                  {activeTab === "portfolio" && (
                    <div>
                      {freelancer.portfolio?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                          {freelancer.portfolio.map(work => (
                            <div key={work._id} className="group rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                {/* {hasFeaturedVisualizationBadge && (
                                <FeaturedRibbon
                                  containerClassName="absolute right-2 top-0 z-20"
                                  tooltipClassName="absolute right-0 top-12 w-48"
                                  tier={featuredTier}
                                  localScore={freelancer.localScore || 0}
                                  featuredSince={featuredSince}
                                />
                              )} */}

                                {getPortfolioImage(work) ? (
                                  <img
                                    src={getPortfolioImage(work)}
                                    alt={work.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                    <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                  </div>
                                )}
                                {work.link && (
                                  <a
                                    href={toAbsoluteExternalUrl(work.link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 sm:p-1.5 bg-white rounded-lg shadow opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-700" />
                                  </a>
                                )}
                              </div>
                              <div className="p-2 sm:p-3 md:p-4">
                                <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{work.title}</h3>
                                {work.description && (
                                  <p className="text-[10px] sm:text-xs text-gray-500 mb-2 line-clamp-2">{work.description}</p>
                                )}
                                <div className="flex items-center justify-between mb-2">
                                  {work.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {work.tags.slice(0, 2).map((tag, i) => (
                                        <span key={i} className="text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                                    <MdThumbUp className="w-3 h-3" />
                                    <span>{work.appreciations?.length ?? 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 sm:py-16">
                          <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                          <p className="text-gray-500 font-medium text-sm sm:text-base">No showcase items yet</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">This freelancer hasn't added any work samples</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "assets" && (
                    <div>
                      {assetsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                      ) : assetsError ? (
                        <p className="text-center text-sm text-red-600 py-8">{assetsError}</p>
                      ) : assets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                          {assets.map((asset) => (
                            <div key={asset._id} className="group rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow bg-white">
                              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                {getAssetImage(asset) ? (
                                  <img
                                    src={getAssetImage(asset)}
                                    alt={asset.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                    <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <div className="p-3 sm:p-4">
                                <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm line-clamp-1">{asset.title}</h3>
                                {asset.description && (
                                  <p className="text-[10px] sm:text-xs text-gray-500 mb-2 line-clamp-2">{asset.description}</p>
                                )}

                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{asset.category || "General"}</span>
                                  <span className="font-medium text-gray-900">Free download</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                                    <Download className="w-3.5 h-3.5" /> {asset.downloads || 0}
                                  </span>
                                  <Link
                                    to={`/assets?assetId=${asset._id}`}
                                    className="text-[10px] sm:text-xs font-medium text-blue-600 hover:underline"
                                  >
                                    View asset
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 sm:py-16">
                          <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                          <p className="text-gray-500 font-medium text-sm sm:text-base">No assets published yet</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">This freelancer has not uploaded marketplace assets yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={hireDialogOpen}
        onOpenChange={(open) => {
          setHireDialogOpen(open);
          if (!open) {
            setMilestones([{ title: "", description: "", amount: "", dueDate: getDefaultMilestoneDueDate(7) }]);
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Send Hiring Request</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Behance-style flow: send the request first, freelancer accepts, then contract payment goes to escrow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Contract title</label>
              <input
                value={hireForm.title}
                onChange={(e) => setHireForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Brand refresh website redesign"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Hiring as</label>
                <select
                  value={hireForm.hiringType}
                  onChange={(e) => handleHiringTypeChange(e.target.value as "individual" | "company")}
                  disabled={hiringTypeSwitching}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="individual">Individual</option>
                  <option value="company" disabled={loadingCompanies}>Company</option>
                </select>
              </div>

              {hireForm.hiringType === "company" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Company</label>
                  <select
                    value={hireForm.companyId}
                    onChange={(e) => setHireForm((prev) => ({ ...prev, companyId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Select company</option>
                    {userCompanyId && !hasUserCompanyInList && (
                      <option value={userCompanyId}>My company</option>
                    )}
                    {myCompanies.map((company) => (
                      <option key={company._id} value={company._id}>{company.name}</option>
                    ))}
                    <option value="__new__">+ Create new company</option>
                  </select>
                </div>
              )}
            </div>

            {hireForm.hiringType === "company" && showCompanyDetails && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    {hireForm.companyId === "__new__" ? "Create company profile" : "Update company profile"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Add the same company details used in your client profile.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Company name</label>
                  <input
                    value={companyDraft.name}
                    onChange={(e) => setCompanyDraft((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Studio Nova"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Industry</label>
                  <input
                    value={companyDraft.industry}
                    onChange={(e) => setCompanyDraft((prev) => ({ ...prev, industry: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Design, SaaS, E-commerce"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Company website</label>
                  <input
                    value={companyDraft.website}
                    onChange={(e) => setCompanyDraft((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">About / Hiring brief</label>
                  <textarea
                    value={companyDraft.description}
                    onChange={(e) => setCompanyDraft((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Tell freelancers what your company builds and what kind of talent you hire."
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Type</label>
                <select
                  value={hireForm.amountType}
                  onChange={(e) => setHireForm((prev) => ({ ...prev, amountType: e.target.value as "fixed" | "hourly" }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Currency</label>
                <input
                  value={hireForm.currency}
                  onChange={(e) => setHireForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                  maxLength={5}
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Amount</label>
                <input
                  value={hireForm.amountTotal}
                  onChange={(e) => setHireForm((prev) => ({ ...prev, amountTotal: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  inputMode="decimal"
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Project brief</label>
              <textarea
                value={hireForm.description}
                onChange={(e) => setHireForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Share goals, scope, timeline, and required deliverables."
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Milestones (at least one required)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-lg border-slate-200"
                  onClick={() => setMilestones((prev) => [...prev, { title: "", description: "", amount: "", dueDate: getDefaultMilestoneDueDate((prev.length + 1) * 7) }])}
                >
                  Add Milestone
                </Button>
              </div>

              <div className="space-y-2">
                {milestones.map((item, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={item.title}
                        onChange={(e) =>
                          setMilestones((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, title: e.target.value } : m))
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder={`Milestone ${index + 1} title`}
                      />
                      <input
                        value={item.amount}
                        onChange={(e) =>
                          setMilestones((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, amount: e.target.value } : m))
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="Amount"
                        inputMode="decimal"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) =>
                          setMilestones((prev) =>
                            prev.map((m, i) => (i === index ? { ...m, dueDate: e.target.value } : m))
                          )
                        }
                        min={todayIso}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg text-xs  text-rose-600 hover:bg-rose-600 "
                        onClick={() =>
                          setMilestones((prev) =>
                            prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ title: "", description: "", amount: "", dueDate: getDefaultMilestoneDueDate(7) }]
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        setMilestones((prev) =>
                          prev.map((m, i) => (i === index ? { ...m, description: e.target.value } : m))
                        )
                      }
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Milestone description (optional)"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Terms (optional)</label>
              <textarea
                value={hireForm.terms}
                onChange={(e) => setHireForm((prev) => ({ ...prev, terms: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Revision policy, communication expectations, and acceptance criteria."
              />
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700">
              After the freelancer accepts, you can fund escrow from your Contracts tab.
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setHireDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                disabled={
                  hireSubmitting ||
                  hiringTypeSwitching ||
                  hireForm.title.trim().length < 5 ||
                  hireForm.description.trim().length < 20 ||
                  !/^[A-Z]{3,5}$/.test((hireForm.currency || "").trim().toUpperCase()) ||
                  !Number.isFinite(Number(hireForm.amountTotal)) ||
                  Number(hireForm.amountTotal) <= 0 ||
                  !hasAtLeastOneValidMilestone ||
                  (hireForm.hiringType === "company" && !hireForm.companyId)
                }
                onClick={handleSubmitHireRequest}
              >
                {hireSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default FreelancerProfile;
