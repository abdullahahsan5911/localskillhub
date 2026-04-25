import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PayoutOnboardingComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/profile#freelancer-payouts-section", { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const isRefresh = location.pathname.endsWith("/onboarding");

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 mb-1">
          {isRefresh ? "Payout details updated" : "Stripe payouts connected"}
        </h1>
        <p className="text-sm text-slate-500 mb-5">
          {isRefresh
            ? "Your Stripe account details have been refreshed. You can now manage payouts from your freelancer profile settings."
            : "You're all set. Your Stripe payout account is now linked. In a moment you'll be redirected back to your freelancer profile settings."}
        </p>
        <Button
          type="button"
          className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
          onClick={() => navigate("/profile#freelancer-payouts-section", { replace: true })}
        >
          Go to Profile Settings
        </Button>
      </div>
    </main>
  );
};

export default PayoutOnboardingComplete;
