import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { forgotPassword, resetPassword } = useAuth();

  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState<"request" | "reset">(initialEmail ? "reset" : "request");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (/@example\.com$/i.test(trimmedEmail)) {
      setError("Please use a real email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(trimmedEmail);
      setSuccessMessage("We sent a 6-digit code to your email.");
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      (document.getElementById(`reset-otp-${index + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      (document.getElementById(`reset-otp-${index - 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const lastFilled = Math.min(digits.length, 5);
    (document.getElementById(`reset-otp-${lastFilled}`) as HTMLInputElement)?.focus();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), code, password);
      setSuccessMessage("Password reset successful. You can now sign in.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">

      {/* ── Full-screen background image ── */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGFydHxlbnwwfHwwfHx8MA%3D%3D')]" />
      {/* White gradient overlay – opaque on left, transparent on right */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/95 via-white/60 to-white/5" />

      {/* ── Left editorial panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative z-10 flex-col justify-between p-14 font-sans">
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
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-widest uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
            <HiOutlineSparkles className="h-3.5 w-3.5" />
            Secure account recovery
          </div>

          {/* Headline */}
          <h1 className="text-[52px] leading-[1.12] font-semibold text-gray-900 tracking-tight font-serif">
            Reset your<br />
            <em className="text-emerald-700 italic">password</em>
          </h1>

          <p className="text-[15px] text-gray-500 leading-relaxed max-w-sm font-light">
            Enter your email and we'll send a 6-digit code to securely restore access to your account.
          </p>

          {/* Trust signals */}
          <div className="flex gap-10 pt-4">
            {[
              { num: "OTP", label: "Secured flow" },
              { num: "60s", label: "Avg. delivery" },
              { num: "100%", label: "Encrypted" },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="text-[28px] font-semibold text-gray-900 font-serif">{num}</div>
                <div className="text-[12px] text-gray-400 mt-0.5 tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div />
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-y-auto">
        {/* Glassmorphism card */}
        <div className="w-full max-w-[420px] rounded-2xl sm:rounded-3xl px-6 sm:px-10 py-8 sm:py-11 bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]">

          {/* Mobile brand */}
          <div className="lg:hidden mb-6 sm:mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700" />
              <span className="text-lg sm:text-xl font-semibold text-gray-900 font-serif">LocalSkillHub</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-[22px] sm:text-[26px] font-semibold text-gray-900 tracking-tight font-serif">
              {step === "request" ? "Forgot password?" : "Set new password"}
            </h2>
            <p className="mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] text-gray-400 font-light">
              {step === "request"
                ? "We'll send a one-time code to your email."
                : "Check your inbox for the 6-digit code we sent."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl text-sm space-y-2 bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[11px] font-medium tracking-widest uppercase mb-1.5 text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-gray-400" />
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

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-xl text-[14px] font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 ${
                  loading ? "bg-emerald-600" : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Sending code…
                  </span>
                ) : (
                  "Send reset code"
                )}
              </button>

              <p className="mt-6 text-center text-[13px] text-gray-400">
                Remembered your password?{" "}
                <Link to="/login" className="font-medium hover:opacity-80 transition-opacity text-emerald-700">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {/* Read-only email */}
              <div>
                <label className="block text-[11px] font-medium tracking-widest uppercase mb-1.5 text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-gray-400" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 h-[46px] text-[14px] border border-gray-200 bg-gray-50 text-gray-400 rounded-xl outline-none"
                    value={email}
                    readOnly
                  />
                </div>
              </div>

              {/* OTP boxes */}
              <div>
                <label className="block text-[11px] font-medium tracking-widest uppercase mb-3 text-slate-700">
                  6-digit code
                </label>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`reset-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 bg-white text-gray-900 rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-[11px] font-medium tracking-widest uppercase mb-1.5 text-slate-700">
                  New password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-gray-400" />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 h-[46px] text-[14px] border border-gray-300 bg-white text-gray-900 outline-none rounded-xl transition-colors focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-[11px] font-medium tracking-widest uppercase mb-1.5 text-slate-700">
                  Confirm password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-gray-400" />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 h-[46px] text-[14px] border border-gray-300 bg-white text-gray-900 outline-none rounded-xl transition-colors focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-xl text-[14px] font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 ${
                  loading ? "bg-emerald-600" : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Resetting…
                  </span>
                ) : (
                  "Reset password"
                )}
              </button>

              <p className="mt-6 text-center text-[13px] text-gray-400">
                Changed your mind?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setOtp(["", "", "", "", "", ""]);
                    setPassword("");
                    setConfirmPassword("");
                    setSuccessMessage("");
                    setError("");
                  }}
                  className="font-medium hover:opacity-80 transition-opacity text-emerald-700"
                >
                  Start over
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
