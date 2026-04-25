import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiGithub, FiRefreshCw } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineSparkles } from "react-icons/hi";
import { useAuth } from "@/contexts/AuthContext";

const requiresOnboarding = (u: any) => {
  // Once onboardingCompleted is true, never send the user back.
  if (u?.onboardingCompleted || u?.role === "admin") return false;

  const hasLocation = Boolean(u?.location?.city && u?.location?.state && u?.location?.country);
  const hasInterests = Array.isArray(u?.interests) && u.interests.length > 0;

  // For legacy users without the flag, treat full location + interests
  // as "completed" so they aren't trapped in onboarding.
  return !(hasLocation && hasInterests);
};

const Login = () => {
  const navigate = useNavigate();
  const { login, resendOtp, loginWithGoogle, loginWithGithub, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const redirectAfterLogin = async () => {
    try {
      // Ensure we have the latest profile (location, interests, onboarding flag)
      await refreshUser();
    } catch {
      // Non-fatal – fall back to whatever is already in localStorage
    }

    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (u.role === "admin") return navigate("/admin");
    if (requiresOnboarding(u)) return navigate("/onboarding");
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(null);
    const trimmedEmail = email.trim();
    if (/@example\.com$/i.test(trimmedEmail)) {
      setError("Please use a real email address");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      await redirectAfterLogin();
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      const errorMessage = err?.response?.data?.message || err?.message || "Login failed";

      if (errorCode === "EMAIL_NOT_VERIFIED" || err?.message?.includes("verify your email")) {
        setUnverifiedEmail(email);
        setError("Your email is not verified. Please check your inbox for the OTP or request a new one.");
      } else if (errorCode === "ACCOUNT_BANNED") {
        setError("Your account has been banned. Please contact support@localskillhub.com for more information.");
      } else if (errorCode === "ACCOUNT_SUSPENDED") {
        setError(`Your account is suspended until ${err?.response?.data?.data?.suspendedUntil ? new Date(err.response.data.data.suspendedUntil).toLocaleDateString() : 'the specified date'}. Please try again later or contact support.`);
      } else {
        setError(errorMessage.includes("credentials") ? "Login failed. Please check your credentials." : errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await resendOtp(unverifiedEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleGoogle = async () => {
    setError(""); setUnverifiedEmail(null); setSocialLoading("google");
    try { await loginWithGoogle(); await redirectAfterLogin(); }
    catch (err: any) { setError(err.message || "Google sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  const handleGithub = async () => {
    setError(""); setUnverifiedEmail(null); setSocialLoading("github");
    try { await loginWithGithub(); await redirectAfterLogin(); }
    catch (err: any) { setError(err.message || "GitHub sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">

      {/* ── Full-screen background image ── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGFydHxlbnwwfHwwfHx8MA%3D%3D')]"
      />
      {/* White gradient overlay – opaque on left, transparent on right */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/95 via-white/60 to-white/5" />

      {/* ── Left editorial panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative z-10 flex-col justify-between p-14 font-sans"
      >
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
          <span className="text-[22px] font-semibold text-gray-900 tracking-tight font-serif">
            LocalSkillHub
          </span>
        </Link>

        {/* Hero */}
        <div className="space-y-5">
          {/* Tag */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-widest uppercase bg-emerald-50 border border-emerald-200 text-emerald-700"
          >
            <HiOutlineSparkles className="h-3.5 w-3.5" />
            Trusted by 10,000+ professionals
          </div>

          {/* Headline */}
          <h1 className="text-[52px] leading-[1.12] font-semibold text-gray-900 tracking-tight font-serif">
            Your local talent<br />
            <em className="text-emerald-700 italic">marketplace</em>
          </h1>

          <p className="text-[15px] text-gray-500 leading-relaxed max-w-sm font-light">
            Connect with skilled freelancers in your city. Get work done faster, locally.
          </p>

          {/* Stats */}
          <div className="flex gap-10 pt-4">
            {[
              { num: "10k+", label: "Professionals" },
              { num: "140+", label: "Cities covered" },
              { num: "98%", label: "Satisfaction rate" },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="text-[28px] font-semibold text-gray-900 font-serif">
                  {num}
                </div>
                <div className="text-[12px] text-gray-400 mt-0.5 tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div />
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-y-auto">
        {/* Glassmorphism card */}
        <div className="w-full max-w-[420px] rounded-2xl sm:rounded-3xl px-6 sm:px-10 py-8 sm:py-11 bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Mobile brand */}
          <div className="lg:hidden mb-6 sm:mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700" />
              <span className="text-lg sm:text-xl font-semibold text-gray-900 font-serif">
                LocalSkillHub
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-[22px] sm:text-[26px] font-semibold text-gray-900 tracking-tight font-serif">
              Welcome back
            </h2>
            <p className="mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] text-gray-400 font-light">
              Sign in to your account to continue
            </p>
          </div>

          {/* ── Error / Unverified state ── */}
          {error && (
            <div
              className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl text-sm space-y-2 bg-red-50 border border-red-200 text-red-700"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
              {unverifiedEmail && (
                <div className="pl-6 flex items-center gap-3">
                  <button
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 font-semibold underline hover:opacity-80 disabled:opacity-60 text-sm text-red-700"
                  >
                    <FiRefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                    {resending ? "Sending…" : "Resend OTP"}
                  </button>
                  <span className="text-xs text-red-300">or</span>
                  <Link
                    to={`/signup?verify=1&email=${encodeURIComponent(unverifiedEmail)}`}
                    className="font-semibold underline hover:opacity-80 text-sm text-red-700"
                  >
                    Enter OTP →
                  </Link>
                </div>
              )}
              {resendSuccess && (
                <p className="pl-6 text-xs font-medium text-emerald-700">
                  ✓ New OTP sent to {unverifiedEmail}
                </p>
              )}
            </div>
          )}

          {/* ── Social buttons ── */}
          <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 h-[44px] sm:h-[46px] rounded-xl text-[12px] sm:text-[13px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 text-neutral-800 hover:bg-gray-50"
            >
              {socialLoading === "google" ? (
                <div
                  className="h-[18px] w-[18px] rounded-full border-2 border-gray-300 border-t-[#4285F4] animate-spin"
                />
              ) : (
                <FcGoogle className="h-[18px] w-[18px]" />
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleGithub}
              disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 h-[44px] sm:h-[46px] rounded-xl text-[12px] sm:text-[13px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-800"
            >
              {socialLoading === "github" ? (
                <div
                  className="h-[18px] w-[18px] rounded-full border-2 border-neutral-600 border-t-white animate-spin"
                />
              ) : (
                <FiGithub className="h-[18px] w-[18px]" />
              )}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-4 sm:mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 sm:px-4 text-[11px] sm:text-[12px] tracking-wide uppercase bg-transparent text-gray-400">
                or continue with email
              </span>
            </div>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-[11px] font-medium tracking-widest uppercase mb-1.5 text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px]"
                  style={{ color: "#aaa" }}
                />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 h-[46px] text-[14px] border border-gray-300 bg-white text-gray-900 outline-none transition-colors rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[11px] font-medium tracking-widest uppercase mb-1.5 text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px]"
                  style={{ color: "#aaa" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-11  h-[46px] text-[14px] border border-gray-300 bg-white text-gray-900 outline-none transition-colors rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity text-gray-400"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-[15px] w-[15px]" />
                  ) : (
                    <FiEye className="h-[15px] w-[15px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-[13px] pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  className="w-[14px] h-[14px] rounded text-emerald-700 focus:ring-emerald-500"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="font-medium hover:opacity-80 transition-opacity text-emerald-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!socialLoading}
              className={`w-full h-12 rounded-xl text-[14px] font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 ${
                loading || socialLoading ? "bg-emerald-600" : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                  />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-[13px] text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium hover:opacity-80 transition-opacity text-emerald-700"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;