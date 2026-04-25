import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiGithub, FiRefreshCw } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail, HiOutlineSparkles } from "react-icons/hi";
import { useAuth } from "@/contexts/AuthContext";
import normalizeError from "@/utils/normalizeError";

const STATS = [
  { value: "10K+", label: "Freelancers" },
  { value: "5K+", label: "Projects done" },
  { value: "50+", label: "Cities" },
  { value: "4.9★", label: "Avg. rating" },
];

const requiresOnboarding = (u: any) => {
  // Respect the flag: once true, user never goes back to onboarding.
  if (u?.onboardingCompleted || u?.role === "admin") return false;

  const hasLocation = Boolean(u?.location?.city && u?.location?.state && u?.location?.country);
  const hasInterests = Array.isArray(u?.interests) && u.interests.length > 0;

  return !(hasLocation && hasInterests);
};

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, verifyOtp, resendOtp, loginWithGoogle, loginWithGithub, refreshUser } = useAuth();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);

  const queryEmail = searchParams.get("email");
  const queryVerify = searchParams.get("verify");
  const storedPendingEmail = localStorage.getItem("pendingVerificationEmail");
  const shouldUseQueryEmail = queryVerify === "1" && !!queryEmail;
  const [pendingEmail, setPendingEmail] = useState<string | null>(
    shouldUseQueryEmail ? queryEmail : storedPendingEmail
  );
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const redirectAfterAuth = async () => {
    try {
      // Refresh user so onboarding/location flags are up to date
      await refreshUser();
    } catch {
      // Ignore refresh failures and fall back to stored user
    }

    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (u.role === "admin") return navigate("/admin");
    if (requiresOnboarding(u)) return navigate("/onboarding");
    if (u.role === "client") {
      if (u.accountType === "company") return navigate("/company-dashboard");
      return navigate("/dashboard/client");
    }
    if (u.role === "freelancer") return navigate("/dashboard/freelancer");
    navigate("/");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      (document.getElementById(`otp-${index + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      (document.getElementById(`otp-${index - 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const lastFilled = Math.min(digits.length, 5);
    (document.getElementById(`otp-${lastFilled}`) as HTMLInputElement)?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setOtpError("Please enter the full 6-digit code."); return; }
    setOtpError("");
    setOtpLoading(true);
    try {
      await verifyOtp(pendingEmail!, code);
      localStorage.removeItem("pendingVerificationEmail");
      await redirectAfterAuth();
    } catch (err: any) {
      setOtpError(normalizeError(err) || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      await resendOtp(pendingEmail!);
      setResendSuccess(true);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setOtpError(normalizeError(err) || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    localStorage.removeItem("pendingVerificationEmail");
    setPendingEmail(null);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const email = formData.email.trim();
    if (/@example\.com$/i.test(email)) {
      setError("Please use a real email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await register(formData.name, formData.email, formData.password);
      if (result.emailVerificationRequired) {
        setPendingEmail(result.email);
        localStorage.setItem("pendingVerificationEmail", result.email);
      }
    } catch (err: any) {
      setError(normalizeError(err) || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(""); setSocialLoading("google");
    try { await loginWithGoogle(); await redirectAfterAuth(); }
    catch (err: any) { setError(normalizeError(err) || "Google sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  const handleGithub = async () => {
    setError(""); setSocialLoading("github");
    try { await loginWithGithub(); await redirectAfterAuth(); }
    catch (err: any) { setError(normalizeError(err) || "GitHub sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  // ── OTP Screen (light theme, matches login/signup shell using Tailwind) ──────────────────
  if (pendingEmail) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGFydHxlbnwwfHwwfHx8MA%3D%3D')]"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-0 bg-[linear-gradient(125deg,_rgba(255,255,255,0.97)_0%,_rgba(255,255,255,0.93)_18%,_rgba(255,255,255,0.45)_35%,_rgba(255,255,255,0.06)_40%)]"
        />

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-sm rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-2xl px-8 py-8">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
                <HiOutlineMail className="h-7 w-7 text-emerald-700" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 font-serif tracking-tight">
                Check your email
              </h2>
              <p className="mt-1 text-xs text-gray-500 font-light">
                We sent a 6-digit code to
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700 break-all">
                {pendingEmail}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* OTP boxes */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-12 rounded-xl border border-slate-300 bg-white text-center text-xl font-semibold text-slate-900 outline-none transition-colors focus:border-emerald-600"
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-xs text-red-600">{otpError}</p>
              )}
              {resendSuccess && (
                <p className="text-center text-xs text-emerald-700">✓ A new code has been sent!</p>
              )}

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full h-11 rounded-xl bg-emerald-700 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Verify Email"
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>Didn't receive it?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
                >
                  <FiRefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleUseDifferentEmail}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-500"
              >
                ← Use a different email
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Sign Up Screen ───────────────────────────────────────
  return (
    <div className="min-h-screen flex relative overflow-hidden">

      {/* Full-screen background */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGFydHxlbnwwfHwwfHx8MA%3D%3D')]" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(125deg,_rgba(255,255,255,0.97)_0%,_rgba(255,255,255,0.93)_18%,_rgba(255,255,255,0.45)_35%,_rgba(255,255,255,0.06)_40%)]" />

      {/* Left editorial panel */}
      <div className="hidden lg:flex lg:w-[52%] relative z-10 flex-col justify-between p-8 xl:p-14 font-sans">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
          <span className="text-[22px] font-semibold text-gray-900 tracking-tight font-serif">
            LocalSkillHub
          </span>
        </Link>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-widest uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
            <HiOutlineSparkles className="h-3.5 w-3.5" />
            Create your account in minutes
          </div>

          <h1 className="text-[40px] md:text-[48px] leading-[1.12] font-semibold text-gray-900 font-serif tracking-tight">
            Join your local
            <br />
            <em className="italic text-emerald-800">talent network</em>
          </h1>

          <p className="text-[15px] text-gray-500 leading-relaxed max-w-sm font-light">
            Whether you are hiring or freelancing, LocalSkillHub connects you with trusted people nearby.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2 max-w-xs">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-[22px] font-semibold text-gray-900 font-serif">
                  {value}
                </div>
                <div className="text-[12px] text-gray-400 mt-0.5 tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div />
      </div>

      {/* Right panel */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-4 sm:px-6 overflow-hidden">
        <div className="w-full max-w-md rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-2xl px-7 py-7 sm:px-9 sm:py-8">
          {/* Mobile brand */}
          <div className="lg:hidden mb-5 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-800" />
              <span className="text-xl font-semibold text-gray-900 font-serif">
                LocalSkillHub
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h2 className="text-[24px] font-semibold text-gray-900 font-serif tracking-tight">
              Create your account
            </h2>
            <p className="mt-1 text-[13px] text-gray-400 font-light">
              Join thousands of local creators and clients.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Social buttons */}
          <div className="flex flex-col gap-3 mb-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!socialLoading || loading}
              className="flex-1 p-3 h-[42px] rounded-xl border border-slate-300 bg-white text-md font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {socialLoading === "google" ? (
                <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
              ) : (
                <FcGoogle className="h-4 w-4" />
              )}
              Google
            </button>

            <button
              type="button"
              onClick={handleGithub}
              disabled={!!socialLoading || loading}
              className="flex-1 p-3 h-[42px] rounded-xl border border-gray-900 bg-gray-900 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {socialLoading === "github" ? (
                <div className="h-4 w-4 rounded-full border-2 border-gray-500 border-t-white animate-spin" />
              ) : (
                <FiGithub className="h-4 w-4" />
              )}
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-[11px] tracking-wide uppercase text-gray-400">
                or sign up with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full name */}
            <div>
              <label className="mb-1 block text-[11px] font-medium tracking-widest uppercase text-gray-600">
                Full name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400" />
                <input
                  type="text"
                  className="h-[42px] w-full rounded-xl border-2 border-slate-300 bg-white pl-10 pr-4 text-[13px] text-gray-900 outline-none transition-colors focus:border-emerald-700"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-[11px] font-medium tracking-widest uppercase text-gray-600">
                Email address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400" />
                <input
                  type="email"
                  className="h-[42px] w-full rounded-xl border-2 border-slate-300 bg-white pl-10 pr-4 text-[13px] text-gray-900 outline-none transition-colors focus:border-emerald-700"
                  placeholder="you@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Please enter a valid email address"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-[11px] font-medium tracking-widest uppercase text-gray-600">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="h-[42px] w-full rounded-xl border-2 border-slate-300 bg-white pl-10 pr-11 text-[13px] text-gray-900 outline-none transition-colors focus:border-emerald-700"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-opacity hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-[14px] w-[14px]" />
                  ) : (
                    <FiEye className="h-[14px] w-[14px]" />
                  )}
                </button>
              </div>
            </div>

            {/* OTP notice */}
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              <HiOutlineMail className="h-3.5 w-3.5 shrink-0" />
              <span>A 6-digit OTP will be sent to verify your email.</span>
            </div>

            {/* Terms */}
            <p className="text-[11px] text-gray-400">
              By signing up you agree to our{" "}
              <a href="#" className="text-emerald-700 hover:underline">
                Terms
              </a>
              {" & "}
              <a href="#" className="text-emerald-700 hover:underline">
                Privacy Policy
              </a>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!socialLoading}
              className="mt-1 h-11 w-full rounded-xl bg-emerald-700 text-[14px] font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-[13px] text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-emerald-700 transition-opacity hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;