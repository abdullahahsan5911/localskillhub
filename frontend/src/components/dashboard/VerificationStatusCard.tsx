import { useAuth } from "@/contexts/AuthContext";
import { Mail, Phone, Github, ChevronRight, Shield, Minimize2, ShieldCheck, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { githubProvider, GithubAuthProvider } from "@/lib/firebase";
import { linkWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";

interface VerificationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  verified: boolean;
  description: React.ReactNode;
  color: string;
  action: () => void;
}

const VerificationStatusCard = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "phone" | "github" | "application">("email");
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // ── Phone state ──
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");

  // ── Email OTP state (for unverified emails, e.g. GitHub users) ──
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);

  // ── GitHub state ──
  const [githubInput, setGithubInput] = useState("");
  const [githubProfileFound, setGithubProfileFound] = useState<any>(null);
  const [githubStep, setGithubStep] = useState<"input" | "authorize">("input");

  const [loading, setLoading] = useState(false);

  // Track if verification status fetch is pending (to prevent duplicate requests)
  const statusFetchPending = useRef(false);

  const isFreelancer = user?.role === "freelancer";
  const emailVerified = user?.isEmailVerified || false;
  const phoneVerified = user?.isPhoneVerified || false;
  const githubVerified = user?.verifiedBadges?.some((b: any) => b.type === "github") || user?.provider === "github" || false;
  const isVerified = user?.verifiedBadges?.some((b: any) => b.type === "verified") || false;

  // Is the current user signed in via GitHub OAuth?
  const isGithubUser = user?.provider === "github";

  // If the user shows as verified (has the badge), hide this card completely.
  if (isVerified) return null;

  // ── Phone handlers ──────────────────────────────────────────────────────────
  const handlePhoneRequest = async () => {
    if (!phoneInput.trim()) {
      toast({ title: "Error", description: "Please enter a phone number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Format phone number: expect format like +1234567890 or country code + number
      let formattedPhone = phoneInput.trim();

      // If doesn't start with +, add it
      if (!formattedPhone.startsWith("+")) {
        // If it starts with 0, remove it (common in many countries)
        if (formattedPhone.startsWith("0")) {
          formattedPhone = formattedPhone.slice(1);
        }
        // Remove all non-digits
        const digits = formattedPhone.replace(/\D/g, "");

        // If less than 10 digits, it's likely missing country code
        if (digits.length < 10) {
          toast({
            title: "Invalid Format",
            description: "Please enter your phone number with country code (e.g., +1234567890 or +923001234567)",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Add + prefix
        formattedPhone = "+" + digits;
      }

      // Validate format (must have + followed by 10-15 digits)
      if (!/^\+\d{10,15}$/.test(formattedPhone)) {
        toast({
          title: "Invalid Format",
          description: "Please use format: +[country code][phone number] (e.g., +923001234567)",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      await api.requestPhoneOtp(formattedPhone);
      setPhoneStep("verify");
      toast({ title: "OTP Sent", description: "Check your phone for the 6-digit code." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerify = async () => {
    const otp = phoneOtp.join("");
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter a 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await api.verifyPhoneOtp(otp) as any;
      if (response?.data?.user) {
        updateUser(response.data.user);
      } else {
        await refreshUser();
      }
      toast({ title: "Success", description: "Phone verified successfully!" });
      setIsDialogOpen(false);
      setPhoneInput("");
      setPhoneOtp(["", "", "", "", "", ""]);
      setPhoneStep("input");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendPhoneOtp = async () => {
    setLoading(true);
    try {
      await api.resendPhoneOtp();
      toast({ title: "Sent", description: "New OTP sent to your phone." });
      setPhoneOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to resend OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Email OTP handlers (GitHub users & unverified emails) ──────────────────
  const handleEmailOtpRequest = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      // Resend-otp endpoint sends an OTP for the given email
      await api.resendOtp(user.email);
      setEmailOtpSent(true);
      toast({ title: "OTP Sent", description: `Check ${user.email} for your verification code.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpVerify = async () => {
    const otp = emailOtp.join("");
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    if (!user?.email) return;
    setLoading(true);
    try {
      await api.verifyOtp({ email: user.email, otp });
      await refreshUser();
      toast({ title: "Success", description: "Email verified successfully!" });
      setIsDialogOpen(false);
      setEmailOtpSent(false);
      setEmailOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── GitHub handlers ─────────────────────────────────────────────────────────
  const handleCheckGithubAccount = async () => {
    if (!githubInput.trim()) {
      toast({ title: "Error", description: "Please enter a GitHub username", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await api.checkGithubAccount(githubInput.trim()) as any;
      setGithubProfileFound(response.data);
      setGithubStep("authorize");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to find GitHub account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubAuthorize = async () => {
    setLoading(true);
    try {
      if (isGithubUser) {
        // GitHub SSO users: already authenticated via GitHub — just verify the username
        const verifyResponse = await api.verifyGithubSso(githubInput.trim()) as any;
        if (verifyResponse?.status === "success") {
          await refreshUser();
          toast({ title: "Success", description: "GitHub account verified successfully! Your badge is now active." });
          setIsDialogOpen(false);
          setGithubStep("input");
          setGithubInput("");
          setGithubProfileFound(null);
        }
      } else {
        // Non-GitHub users (Google / email): must link GitHub via OAuth popup to prove ownership
        const result = await linkWithPopup(auth.currentUser!, githubProvider);
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        if (!token) throw new Error("Failed to get GitHub access token");

        const verifyResponse = await api.verifyGithub(githubInput.trim(), token) as any;
        if (verifyResponse?.data?.status === "approved" || verifyResponse?.status === "success") {
          await refreshUser();
          toast({ title: "Success", description: "GitHub account verified successfully! Your badge is now active." });
        }
        setIsDialogOpen(false);
        setGithubStep("input");
        setGithubInput("");
        setGithubProfileFound(null);
      }
    } catch (err: any) {
      if (err.code === "auth/account-exists-with-different-credential") {
        toast({
          title: "Error",
          description: "This GitHub account is already linked to another account. Please use a different GitHub account.",
          variant: "destructive",
        });
      } else if (err.code === "auth/credential-already-in-use") {
        // Credential is already in use on this account — treat as success by switching to SSO path
        try {
          const verifyResponse = await api.verifyGithubSso(githubInput.trim()) as any;
          if (verifyResponse?.status === "success") {
            await refreshUser();
            toast({ title: "Success", description: "GitHub account verified successfully!" });
            setIsDialogOpen(false);
            setGithubStep("input");
            setGithubInput("");
            setGithubProfileFound(null);
            return;
          }
        } catch {
          // fall through
        }
        toast({
          title: "Already Linked",
          description: "This GitHub account is already linked to your profile.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: err.message || "Failed to authorize GitHub account", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubCancel = () => {
    setGithubStep("input");
    setGithubInput("");
    setGithubProfileFound(null);
  };

  // ── Fetch verification status on mount ──
  const fetchVerificationStatus = async () => {
    // Skip if request is already pending
    if (statusFetchPending.current) {
      console.debug('✓ Verification status request already pending, skipping...');
      return;
    }

    try {
      statusFetchPending.current = true;
      const response = await api.getVerificationStatus() as any;
      setVerificationStatus(response.data);
    } catch (err: any) {
      // Only log non-429 errors to reduce console spam
      if (err.code !== 429) {
        console.error('Failed to fetch verification status:', err.message);
      }
    } finally {
      statusFetchPending.current = false;
    }
  };

  // Fetch status on mount
  useEffect(() => {
    fetchVerificationStatus();
    // Refresh every 30 seconds (instead of 5) to avoid rate limiting
    const interval = setInterval(fetchVerificationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOpenFromDashboard = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: "email" | "phone" | "github" | "application" }>;
      const tab = customEvent.detail?.tab;
      if (!tab) return;

      setActiveTab(tab);
      setIsMinimized(false);
      setIsDialogOpen(true);
    };

    window.addEventListener("open-verification-card", handleOpenFromDashboard as EventListener);
    return () => {
      window.removeEventListener("open-verification-card", handleOpenFromDashboard as EventListener);
    };
  }, []);

  // ── Submit verified badge application ──
  const handleSubmitVerifiedApplication = async () => {
    setIsSubmittingApplication(true);
    try {
      await api.submitVerifiedBadgeApplication();
      toast({
        title: "Success",
        description: "Verified badge application submitted! It will be auto-approved in 24 hours if admin takes no action.",
      });
      await fetchVerificationStatus();
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // ── OTP input helpers ───────────────────────────────────────────────────────
  const makeOtpHandlers = (
    otp: string[],
    setOtp: React.Dispatch<React.SetStateAction<string[]>>,
    idPrefix: string
  ) => ({
    onChange: (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...otp];
      next[index] = value;
      setOtp(next);
      if (value && index < 5) {
        (document.getElementById(`${idPrefix}-${index + 1}`) as HTMLInputElement)?.focus();
      }
    },
    onKeyDown: (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        (document.getElementById(`${idPrefix}-${index - 1}`) as HTMLInputElement)?.focus();
      }
    },
  });

  const phoneOtpHandlers = makeOtpHandlers(phoneOtp, setPhoneOtp, "phone-otp");
  const emailOtpHandlers = makeOtpHandlers(emailOtp, setEmailOtp, "email-otp");

  // ── Verification item list ──────────────────────────────────────────────────
  const verificationItems: VerificationItem[] = [
    {
      id: "email",
      label: "Email",
      icon: Mail,
      verified: emailVerified,
      description: emailVerified ? (
        <>
          <CheckCircle className="inline-block w-4 h-4 text-gray-500 mr-1" />
          Verified
        </>
      ) : (
        "Verify with OTP"
      ),
      color: "blue",
      action: () => setActiveTab("email"),
    },
    {
      id: "phone",
      label: "Phone",
      icon: Phone,
      verified: phoneVerified,
      description: phoneVerified ? (
        <>
          <CheckCircle className="inline-block w-4 h-4 text-gray-500 mr-1" />
          Verified
        </>
      ) : (
        "Verify with SMS OTP"
      ),
      color: "green",
      action: () => setActiveTab("phone"),
    },
    ...(isFreelancer
      ? [
        {
          id: "github",
          label: "GitHub",
          icon: Github,
          verified: githubVerified,
          description: githubVerified ? (
            <>
              <CheckCircle className="inline-block w-4 h-4 text-gray-500 mr-1" />
              Verified
            </>
          ) : (
            "Verify your GitHub account"
          ),
          color: "slate",
          action: () => setActiveTab("github"),
        },
      ]
      : []),
    {
      id: "application",
      label: "Submit Application",
      icon: ShieldCheck,
      verified: isVerified,
      description: isVerified
        ? (
          <>
            <CheckCircle className="inline-block w-4 h-4 text-gray-500 mr-1" />
            Verified
          </>
        )
        : verificationStatus?.application?.status === 'pending'
          ? "⏳ Pending Approval"
          : (emailVerified && phoneVerified && (isFreelancer ? githubVerified : true))
            ? "Submit verification application"
            : "submit application to get verified",
      color: isVerified ? "green" : (emailVerified && phoneVerified && (isFreelancer ? githubVerified : true)) ? "blue" : "slate",
      action: () => {
        if (isVerified || (emailVerified && phoneVerified && (isFreelancer ? githubVerified : true)) || verificationStatus?.application?.status === 'pending') {
          setActiveTab("application");
          setIsDialogOpen(true); // Open dialog
        } else {
          toast({ title: "Requirements not met", description: "Please verify email and phone (and GitHub for freelancers) first.", variant: "destructive" });
        }
      },
    },
  ];

  const verifiedCount = verificationItems.filter((item) => item.verified).length;
  const totalItems = verificationItems.length;

  // ── OTP input grid ──────────────────────────────────────────────────────────
  const OtpGrid = ({
    otp,
    idPrefix,
    handlers,
  }: {
    otp: string[];
    idPrefix: string;
    handlers: ReturnType<typeof makeOtpHandlers>;
  }) => (
    <div className="flex gap-2 mt-3">
      {otp.map((digit, i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlers.onChange(i, e.target.value)}
          onKeyDown={(e) => handlers.onKeyDown(i, e)}
          className="w-10 h-10 rounded-lg border border-slate-300 text-center text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Minimized Card */}
      <AnimatePresence>
        {isMinimized && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: [1, 1.06, 1],
              boxShadow: [
                "0 0 0 0 rgba(37,99,235,0.45)",
                "0 0 0 12px rgba(37,99,235,0)",
                "0 0 0 0 rgba(37,99,235,0)",
              ],
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            onClick={() => setIsMinimized(false)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-[background-color,transform] duration-300 hover:scale-110 z-50"
            title="Click to expand verification status"
          >
            <Shield className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full Card */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-80 rounded-2xl border border-slate-300 bg-white shadow-2xl hover:shadow-xl transition-shadow z-50 origin-[calc(100%-1rem)]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-3 rounded-lg border border-slate-300 ">
                  <ShieldCheck className="w-4 h-4 text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">Verification Status</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {verifiedCount} of {totalItems} verified
                  </p>
                </div>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-4">
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gray-200 via-zinc-400 to-neutral-800 transition-all duration-300"
                  style={{ width: `${(verifiedCount / totalItems) * 100}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="px-5 py-3 space-y-2">
              {verificationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'application') {
                        const isEligible = isVerified || (emailVerified && phoneVerified && (isFreelancer ? githubVerified : true)) || verificationStatus?.application?.status === 'pending';
                        if (isEligible) {
                          setActiveTab("application");
                          setIsDialogOpen(true);
                        } else {
                          toast({ title: "Requirements not met", description: "Please complete email, phone (and GitHub if freelancer) verification first.", variant: "destructive" });
                        }
                      } else {
                        setActiveTab(item.id as any);
                        setIsDialogOpen(true);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    {!item.verified && (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 " />
                    )}
                    {item.verified && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center ">
                        <CheckCircle />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">Verify your identity to get verified badge </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "email" && "Email Verification"}
              {activeTab === "phone" && "Phone Verification"}
              {activeTab === "github" && "GitHub Verification"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "email" && (emailVerified ? "Your email is verified." : "Verify your email address with a one-time code.")}
              {activeTab === "phone" && "Verify your phone number via SMS OTP."}
              {activeTab === "github" && "Connect and verify your GitHub account."}
            </DialogDescription>
          </DialogHeader>

          {/* ── EMAIL TAB ─────────────────────────────────────── */}
          {activeTab === "email" && (
            <div className="space-y-4 py-4">
              {emailVerified ? (
                <div className="p-3  border border-slate-300 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                  <p className="text-xs text-black mt-1 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-black" />
                    <span>Verified</span>
                  </p>
                </div>
              ) : !emailOtpSent ? (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700">
                      We'll send a 6-digit verification code to:
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{user?.email}</p>
                  </div>
                  <Button
                    onClick={handleEmailOtpRequest}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Sending..." : "Send Verification Code"}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-900">Enter 6-Digit Code</label>
                    <p className="text-xs text-slate-500 mt-1">We sent a code to {user?.email}</p>
                    <OtpGrid otp={emailOtp} idPrefix="email-otp" handlers={emailOtpHandlers} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={handleEmailOtpRequest}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Resend code
                    </button>
                    <button
                      onClick={() => { setEmailOtpSent(false); setEmailOtp(["", "", "", "", "", ""]); }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Back
                    </button>
                  </div>
                  <Button
                    onClick={handleEmailOtpVerify}
                    disabled={loading || emailOtp.join("").length !== 6}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── PHONE TAB ─────────────────────────────────────── */}
          {activeTab === "phone" && (
            <div className="space-y-4 py-4">
              {phoneVerified ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-emerald-900 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4 text-gray-500" />Phone Verified</p>
                  <p className="text-xs text-emerald-700 mt-1">Your phone number has been verified.</p>
                </div>
              ) : phoneStep === "input" ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-900">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="+1 555 000 0000 or +92 300 1234567"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">Include country code (e.g., +1 for US, +92 for Pakistan)</p>
                  </div>
                  <Button
                    onClick={handlePhoneRequest}
                    disabled={loading || !phoneInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-900">Enter 6-Digit Code</label>
                    <p className="text-xs text-slate-500 mt-1">We sent a code to {phoneInput}</p>
                    <OtpGrid otp={phoneOtp} idPrefix="phone-otp" handlers={phoneOtpHandlers} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={handleResendPhoneOtp}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Resend code
                    </button>
                    <button
                      onClick={() => { setPhoneStep("input"); setPhoneOtp(["", "", "", "", "", ""]); }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Change number
                    </button>
                  </div>
                  <Button
                    onClick={handlePhoneVerify}
                    disabled={loading || phoneOtp.join("").length !== 6}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Verifying..." : "Verify Phone"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── GITHUB TAB ────────────────────────────────────── */}
          {activeTab === "github" && (
            <div className="space-y-4 py-4">
              {githubVerified ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-emerald-900 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4 text-gray-500" />GitHub Verified</p>
                  <p className="text-xs text-emerald-700">Your GitHub account has been verified and approved.</p>
                </div>
              ) : githubStep === "input" ? (
                <>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700 mb-2">
                      {isGithubUser
                        ? "You signed in with GitHub. Enter your GitHub username to link and verify it."
                        : "Enter your GitHub username to verify your account. We'll ask you to authorize the app."}
                    </p>
                    <p className="text-xs text-slate-500">Example: @torvalds, @facebook-research, etc.</p>
                  </div>
                  <Input
                    type="text"
                    placeholder="GitHub username (without @)"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleCheckGithubAccount(); }}
                  />
                  <Button
                    onClick={handleCheckGithubAccount}
                    disabled={loading || !githubInput.trim()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {loading ? "Checking..." : "Check GitHub Account"}
                  </Button>
                </>
              ) : (
                /* authorize step */
                githubProfileFound && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">GitHub Account Found <CheckCircle className="w-4 h-4 text-gray-500" /></p>
                      <div className="flex gap-3 items-start mb-3">
                        {githubProfileFound.avatarUrl && (
                          <img
                            src={githubProfileFound.avatarUrl}
                            alt={githubProfileFound.username}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-slate-900">@{githubProfileFound.username}</p>
                          <p className="text-xs text-slate-600">
                            {githubProfileFound.publicRepos} public repos • {githubProfileFound.followers} followers
                          </p>
                          {githubProfileFound.bio && (
                            <p className="text-xs text-slate-600 mt-1">{githubProfileFound.bio}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">
                        {isGithubUser
                          ? "Click \"Authorize with GitHub\" to link this account to your platform profile."
                          : "Click \"Authorize with GitHub\" below to link this account to your platform profile."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleGithubCancel} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button
                        onClick={handleGithubAuthorize}
                        disabled={loading}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white flex gap-2 items-center justify-center"
                      >
                        <Github className="w-4 h-4" />
                        {loading ? "Authorizing..." : "Authorize with GitHub"}
                      </Button>
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* ── VERIFIED BADGE APPLICATION TAB ────────────────── */}
          {activeTab === "application" && (
            <div className="space-y-4 py-4">
              {isVerified ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-emerald-900 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4 text-gray-500" />Verified Badge</p>
                  <p className="text-xs text-emerald-700 mt-1">Your account has been verified and approved.</p>
                </div>
              ) : verificationStatus?.application?.status === 'pending' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">⏳ Application Pending</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your verified badge application was submitted successfully!
                    </p>
                    {verificationStatus?.application?.autoApproveAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        Will auto-approve on: {new Date(verificationStatus.application.autoApproveAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                    <p className="font-medium mb-2">What happens next:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>An admin will review your application</li>
                      <li>If no action is taken, you'll be auto-approved in 24 hours</li>
                      <li>You can check the status here anytime</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">All Requirements Met! <CheckCircle className="w-4 h-4 text-gray-500" /></p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-slate-700">Email verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-slate-700">Phone verified</span>
                      </div>
                      {isFreelancer && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-slate-700">GitHub verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                    <p className="font-medium mb-1">About Verified Badge:</p>
                    <p className="text-xs">
                      Get your account verified to build trust with clients and stand out on the platform.
                      Your application will be admin-reviewed, and automatically approved if not actioned within 24 hours.
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmitVerifiedApplication}
                    disabled={isSubmittingApplication}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSubmittingApplication ? "Submitting..." : "Submit Verification Application"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificationStatusCard;
