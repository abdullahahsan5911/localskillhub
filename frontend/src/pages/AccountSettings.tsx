import { useState } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FiLock, FiMail, FiTrash2, FiShield, FiKey } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const AccountSettings = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteOtpField, setShowDeleteOtpField] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [isRequestingDeleteOtp, setIsRequestingDeleteOtp] = useState(false);

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const isFreelancer = user?.role === "freelancer";
  const isOAuthUser = user?.provider !== "local";
  const provider = (user?.provider || "").toLowerCase();

  const providerMeta = {
    google: {
      label: "Google",
      icon: <FcGoogle className="text-base" />,
      badgeClass: "bg-white text-slate-700 border-slate-200",
    },
    github: {
      label: "GitHub",
      icon: <FaGithub className="text-base text-slate-800" />,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    },
    default: {
      label: user?.provider?.charAt(0).toUpperCase() + user?.provider?.slice(1),
      icon: <FiKey className="text-base text-slate-700" />,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    },
  };

  const activeProvider = providerMeta[provider as keyof typeof providerMeta] || providerMeta.default;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "Passwords match error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast({ title: "Success", description: "Your password has been updated." });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.message || "Could not update password.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleRequestDeleteOtp = async () => {
    setIsRequestingDeleteOtp(true);
    try {
      await api.resendOtp(user.email, 'deletion');
      setShowDeleteOtpField(true);
      toast({ 
        title: "Verification code sent", 
        description: `We've sent a 6-digit code to ${user.email}. Please enter it below to authorize account deletion.` 
      });
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err?.message || "Could not send verification code.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingDeleteOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteOtp) {
      toast({ title: "OTP required", description: "Please enter the verification code sent to your email.", variant: "destructive" });
      return;
    }

    setDeletingAccount(true);
    try {
      // First verify the OTP
      await api.verifyOtp({ email: user.email, otp: deleteOtp, type: 'deletion' });
      
      // If verification succeeds, proceed to delete
      await api.deleteAccount(user._id);
      toast({ title: "Account deleted", description: "Your account and all data have been removed." });
      logout();
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Deletion failed",
        description: err?.message || "Verification failed. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <Layout>
      <div className="py-8 sm:py-12 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8 rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">
                  Manage your LocalSkillHub account preferences. {isFreelancer 
                    ? "Public profile, skills and rates live under your dashboard > Profile." 
                    : "Profile details live under your dashboard > Profile."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {isOAuthUser ? "Connected" : "Local account"}
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Login & Security */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <FiLock size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">Login & Security</h3>
              </div>
              
              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-400">
                      <FiMail size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold  uppercase tracking-wider text-slate-400">Email Address</p>
                      <p className="text-[10px] sm:text-sm font-medium text-slate-900">{user?.email}</p>
                    </div>
                  </div>
                  {isOAuthUser && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${activeProvider.badgeClass}`}>
                      {activeProvider.icon}
                      Connected via {activeProvider.label}
                    </span>
                  )}
                </div>

                {!isOAuthUser ? (
                  <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Current Password</label>
                        <Input
                          type="password"
                          required
                          value={passwords.currentPassword}
                          onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                          className="rounded-xl border-slate-200 focus:ring-blue-500 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">New Password</label>
                        <Input
                          type="password"
                          required
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                          className="rounded-xl border-slate-200 focus:ring-blue-500 h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                        <Input
                          type="password"
                          required
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          className="rounded-xl border-slate-200 focus:ring-blue-500 h-11"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={updatingPassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl h-11 text-sm font-semibold shadow-sm transition-all active:scale-95 w-full sm:w-auto"
                      >
                        {updatingPassword ? "Updating…" : "Update Password"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-3">
                    <FiKey size={18} className="text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        {activeProvider.icon}
                        Password managed by {activeProvider.label}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Since you signed up with {activeProvider.label}, your password is managed there.
                        Update security settings directly in your {activeProvider.label} account.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

          

            {/* Danger Zone */}
            <section className="bg-red-50/60 rounded-2xl border border-red-100 shadow-sm overflow-hidden mt-10 transition-all hover:bg-red-50">
              <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2.5 bg-red-50">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <FiTrash2 size={18} />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-red-900">Danger Zone</h3>
              </div>
              <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-900">Delete Account</p>
                  <p className="text-xs text-red-700 mt-1 max-w-md leading-relaxed">
                    Permanently delete your profile and all associated data including matches, messages, and portfolio. 
                    <span className="font-bold"> This action cannot be undone.</span>
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="rounded-xl px-6 h-10 text-sm font-semibold shadow-sm hover:bg-red-600 transition-all active:scale-95 sm:w-auto w-full"
                    >
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-2 border-red-100 p-6 w-[95vw] max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-900 flex items-center gap-2">
                        <FiShield className="text-red-600" size={20} />
                        Delete {user.email}?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-600 text-sm py-2">
                        {showDeleteOtpField
                          ? "To confirm, please enter the 6-digit verification code sent to your email. This action will permanently remove all your jobs, proposals, and chats."
                          : "To ensure your security, we'll send a 6-digit verification code to your email. You must enter this code to authorize the permanent deletion of your account and all associated data."}
                      </AlertDialogDescription>
                      {showDeleteOtpField && (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center gap-3 pt-2">
                            <label className="text-xs font-bold uppercase tracking-tight text-slate-500 self-start">OTP Code</label>
                            <InputOTP
                              maxLength={6}
                              value={deleteOtp}
                              onChange={(value) => setDeleteOtp(value)}
                              autoFocus
                            >
                              <InputOTPGroup className="gap-2 flex-wrap justify-center">
                                <InputOTPSlot index={0} className="rounded-xl border-2 w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-bold bg-white" />
                                <InputOTPSlot index={1} className="rounded-xl border-2 w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-bold bg-white" />
                                <InputOTPSlot index={2} className="rounded-xl border-2 w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-bold bg-white" />
                                <InputOTPSlot index={3} className="rounded-xl border-2 w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-bold bg-white" />
                                <InputOTPSlot index={4} className="rounded-xl border-2 w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-bold bg-white" />
                                <InputOTPSlot index={5} className="rounded-xl border-2 w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-bold bg-white" />
                              </InputOTPGroup>
                            </InputOTP>
                            <button
                              onClick={handleRequestDeleteOtp}
                              className="text-[11px] text-blue-600 font-medium hover:underline"
                            >
                              Didn't get a code? Resend
                            </button>
                          </div>
                        </div>
                      )}
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:mt-4 mt-6 flex flex-col-reverse sm:flex-row">
                      <AlertDialogCancel 
                        className="rounded-xl border-slate-200" 
                        onClick={() => {
                          setShowDeleteOtpField(false);
                          setDeleteOtp("");
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      
                      {showDeleteOtpField ? (
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount || deleteOtp.length !== 6}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11 font-bold transition-all active:scale-95 shadow-sm w-full sm:w-auto"
                        >
                          {deletingAccount ? "Verifying & Deleting..." : "Finalize Deletion"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRequestDeleteOtp}
                          disabled={isRequestingDeleteOtp}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11 font-bold transition-all active:scale-95 shadow-sm w-full sm:w-auto"
                        >
                          {isRequestingDeleteOtp ? "Sending Code..." : "Send Verification Code"}
                        </Button>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountSettings;
