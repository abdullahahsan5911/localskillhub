import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiGithub, FiRefreshCw } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineLocationMarker, HiOutlineLightningBolt, HiOutlineMail } from "react-icons/hi";
import { useAuth } from "@/contexts/AuthContext";

const STATS = [
  { value: "10K+", label: "Freelancers" },
  { value: "5K+", label: "Projects done" },
  { value: "50+", label: "Cities" },
  { value: "4.9★", label: "Avg. rating" },
];

const SignUp = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp, loginWithGoogle, loginWithGithub } = useAuth();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);

  // OTP state
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const redirectAfterAuth = () => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (!u.onboardingCompleted) return navigate("/onboarding");
    if (u.role === "client") return navigate("/dashboard/client");
    if (u.role === "freelancer") return navigate("/dashboard/freelancer");
    navigate("/");
  };

  // ── OTP input helpers ────────────────────────────────────────
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
      redirectAfterAuth();
    } catch (err: any) {
      setOtpError(err.message || "Invalid OTP. Please try again.");
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
      setOtpError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  // ── Main register ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await register(formData.name, formData.email, formData.password);
      if (result.emailVerificationRequired) {
        setPendingEmail(result.email);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(""); setSocialLoading("google");
    try { await loginWithGoogle(); redirectAfterAuth(); }
    catch (err: any) { setError(err.message || "Google sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  const handleGithub = async () => {
    setError(""); setSocialLoading("github");
    try { await loginWithGithub(); redirectAfterAuth(); }
    catch (err: any) { setError(err.message || "GitHub sign-in failed."); }
    finally { setSocialLoading(null); }
  };

  // ── OTP Verification Screen ──────────────────────────────────
  if (pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-6">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="relative mx-auto mb-8 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
              <HiOutlineMail className="h-10 w-10 text-emerald-400" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm">We sent a 6-digit code to</p>
            <p className="text-emerald-400 font-semibold mt-1">{pendingEmail}</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {/* OTP boxes */}
            <div className="flex gap-3 justify-center">
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
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-white/20 bg-white/10 text-white rounded-xl focus:border-emerald-400 focus:bg-white/15 outline-none transition-all"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-center text-sm text-red-400">{otpError}</p>
            )}

            {resendSuccess && (
              <p className="text-center text-sm text-emerald-400">✓ A new code has been sent!</p>
            )}

            <button type="submit" disabled={otpLoading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
              {otpLoading
                ? <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </span>
                : "Verify Email"}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <span>Didn't receive it?</span>
              <button type="button" onClick={handleResendOtp} disabled={resending}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium disabled:opacity-50">
                <FiRefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Sending…" : "Resend code"}
              </button>
            </div>

            <button type="button" onClick={() => setPendingEmail(null)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Use a different email
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main Sign Up Screen ──────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
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
              <HiOutlineLightningBolt className="h-4 w-4" />
              Join the fastest-growing local marketplace
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Start hiring or<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">get hired today</span>
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <p className="text-slate-200 text-sm leading-relaxed italic">"I landed three clients in my first week. LocalSkillHub made it easy to connect with businesses nearby."</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">A</div>
            <div>
              <p className="text-white text-sm font-semibold">Ahmed R.</p>
              <p className="text-slate-400 text-xs">Full Stack Developer</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-gray-500">Join thousands of local creators and clients</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <span className="mt-0.5">⚠️</span><span>{error}</span>
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
            <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-gray-400">or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input type="text" className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-0 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                  placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input type="email" className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-0 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                  placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input type={showPassword ? "text" : "password"} className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-0 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                  placeholder="At least 6 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} minLength={6} required />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <FiEyeOff className="h-[18px] w-[18px]" /> : <FiEye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <HiOutlineMail className="h-4 w-4 mt-0.5 shrink-0" />
              <span>We'll send a 6-digit OTP to your email. You must verify before signing in.</span>
            </div>

            <p className="text-xs text-gray-500">
              By signing up you agree to our <a href="#" className="text-emerald-600 hover:underline">Terms</a> and <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>.
            </p>

            <button type="submit" disabled={loading || !!socialLoading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account…</span> : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
