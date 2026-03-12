import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiGithub, FiRefreshCw } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineLocationMarker, HiOutlineSparkles } from "react-icons/hi";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  { icon: "🌍", text: "Connect with local talent" },
  { icon: "⚡", text: "Get projects done fast" },
  { icon: "🔒", text: "Secure payments & contracts" },
  { icon: "⭐", text: "Verified professionals only" },
];

const Login = () => {
  const navigate = useNavigate();
  const { login, resendOtp, loginWithGoogle, loginWithGithub } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);

  // Unverified email state
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const redirectAfterLogin = () => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (!u.onboardingCompleted) return navigate("/onboarding");
    if (u.role === "client") return navigate("/dashboard/client");
    if (u.role === "freelancer") return navigate("/dashboard/freelancer");
    if (u.role === "both") return navigate("/dashboard/both");
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      await login(email, password);
      redirectAfterLogin();
    } catch (err: any) {
      // Check for EMAIL_NOT_VERIFIED structured response
      if (err?.response?.data?.code === "EMAIL_NOT_VERIFIED" || err?.message?.includes("verify your email")) {
        setUnverifiedEmail(email);
        setError("Your email is not verified. Please check your inbox for the OTP or request a new one.");
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
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
    try { await loginWithGoogle(); redirectAfterLogin(); }
    catch (err: any) { setError(err.message || "Google sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  const handleGithub = async () => {
    setError(""); setUnverifiedEmail(null); setSocialLoading("github");
    try { await loginWithGithub(); redirectAfterLogin(); }
    catch (err: any) { setError(err.message || "GitHub sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0f4c3a 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
        </div>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
              <HiOutlineLocationMarker className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">LocalSkillHub</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-emerald-300 font-medium mb-6">
              <HiOutlineSparkles className="h-4 w-4" />
              Trusted by 10,000+ professionals
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Your local talent<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">marketplace</span>
            </h1>
            <p className="mt-4 text-lg text-slate-300 max-w-sm leading-relaxed">
              Connect with skilled freelancers in your city. Get work done faster, locally.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm text-slate-200 font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <p className="text-slate-200 text-sm leading-relaxed italic">"Found an amazing web designer in my city within hours. The quality of work and speed was incredible!"</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">S</div>
            <div>
              <p className="text-white text-sm font-semibold">Sarah K.</p>
              <p className="text-slate-400 text-xs">Startup Founder</p>
            </div>
            <div className="ml-auto flex gap-0.5">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
                <HiOutlineLocationMarker className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LocalSkillHub</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-500">Sign in to your account to continue</p>
          </div>

          {/* Error / Unverified state */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
              {unverifiedEmail && (
                <div className="pl-6 flex items-center gap-3">
                  <button onClick={handleResendOtp} disabled={resending}
                    className="inline-flex items-center gap-1.5 text-red-700 font-semibold underline hover:text-red-800 disabled:opacity-60 text-sm">
                    <FiRefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                    {resending ? "Sending…" : "Resend OTP"}
                  </button>
                  <span className="text-red-400 text-xs">or</span>
                  <Link to="/signup" className="text-red-700 font-semibold underline hover:text-red-800 text-sm">
                    Enter OTP →
                  </Link>
                </div>
              )}
              {resendSuccess && (
                <p className="pl-6 text-emerald-700 text-xs font-medium">✓ New OTP sent to {unverifiedEmail}</p>
              )}
            </div>
          )}

          {/* Social buttons */}
          <div className="space-y-3 mb-6">
            <button type="button" onClick={handleGoogle} disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {socialLoading === "google" ? <div className="h-5 w-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" /> : <FcGoogle className="h-5 w-5" />}
              Continue with Google
            </button>
            <button type="button" onClick={handleGithub} disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-gray-900 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {socialLoading === "github" ? <div className="h-5 w-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" /> : <FiGithub className="h-5 w-5" />}
              Continue with GitHub
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-gray-400">or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input type="email" className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-0 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                  placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input type={showPassword ? "text" : "password"} className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-0 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <FiEyeOff className="h-[18px] w-[18px]" /> : <FiEye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-emerald-500 rounded" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold">Forgot password?</a>
            </div>

            <button type="submit" disabled={loading || !!socialLoading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</span> : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
