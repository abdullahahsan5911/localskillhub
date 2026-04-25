import React, { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import PayoutStatusCard from "./PayoutStatusCard";
import WithdrawalDisplay from "./WithdrawalDisplay";
import { PayoutManagerProps, WithdrawInfo } from "./types";

// Panel wrapper component
const PanelWrapper: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; id?: string }> = ({
  title,
  icon,
  children,
  id,
}) => (
  <section
    id={id}
    className="rounded-lg sm:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
  >
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
        {icon}
      </div>
      <p className="text-xs sm:text-sm font-semibold text-slate-900">{title}</p>
    </div>
    <div className="px-3 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-5">{children}</div>
  </section>
);

/**
 * PayoutManager Component
 *
 * Manages all payout and withdrawal functionality for freelancers.
 * Handles:
 * - Payout status display (pending, enabled, restricted)
 * - Withdrawal functionality
 * - Stripe onboarding/management
 *
 * @param profile - Freelancer profile with payout settings
 * @param onPayoutUpdate - Callback when payout info updates
 * @param onWithdrawalSubmitted - Callback when withdrawal is submitted
 * @param className - Additional CSS classes
 *
 * Usage:
 * ```tsx
 * <PayoutManager
 *   profile={profile}
 *   onPayoutUpdate={(info) => console.log(info)}
 *   onWithdrawalSubmitted={() => toast.success("Withdrawal submitted")}
 * />
 * ```
 */
const PayoutManager: React.FC<PayoutManagerProps> = ({
  profile,
  onPayoutUpdate,
  onWithdrawalSubmitted,
  className = "",
}) => {
  // State management
  const [withdrawInfo, setWithdrawInfo] = useState<WithdrawInfo | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [hasSubmittedWithdrawal, setHasSubmittedWithdrawal] = useState(false);

  // Load payout status on mount or when profile changes
  const loadPayoutStatus = async () => {
    try {
      const res = await api.getPayoutStatus();
      const data = (res as any)?.data;
      if (data) {
        const info: WithdrawInfo = {
          withdrawableAmount: Number(data.withdrawableAmount || 0),
          payoutsEnabled: Boolean(data.payoutsEnabled),
          payoutsStatus: (data.payoutsStatus || "pending") as any,
        };
        setWithdrawInfo(info);
        onPayoutUpdate?.(info);
      }
    } catch (error) {
      console.error("Failed to load payout status", error);
    }
  };

  useEffect(() => {
    if (profile) {
      loadPayoutStatus();
    }
  }, [profile]);

  /**
   * Initiate payout onboarding or management
   * If payouts are already enabled, opens the Stripe management dashboard
   * Otherwise, starts the onboarding flow
   */
  const handlePayoutOnboarding = async (mode: "new" | "refresh" = "new") => {
    try {
      setPayoutError("");
      setPayoutLoading(true);

      const res =
        mode === "refresh"
          ? await api.refreshPayoutOnboardingLink()
          : await api.createPayoutOnboardingLink();

      const url = (res as any)?.data?.url;
      if (!url) {
        throw new Error("Unable to start payout onboarding. Please try again.");
      }

      // Redirect to Stripe
      window.location.href = url;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || "Unable to start payout onboarding";
      setPayoutError(errorMsg);
      console.error("Payout onboarding error:", err);
    } finally {
      setPayoutLoading(false);
    }
  };

  /**
   * Submit a withdrawal request
   * Validates that:
   * - Payouts are enabled
   * - There is a withdrawable amount
   */
  const handleWithdraw = async () => {
    if (!withdrawInfo || withdrawInfo.withdrawableAmount <= 0) {
      setPayoutError("No funds available to withdraw");
      return;
    }

    try {
      setPayoutError("");
      setWithdrawLoading(true);

      const res = await api.withdrawPayouts();
      const data = (res as any)?.data;

      if (data) {
        const updatedInfo: WithdrawInfo = {
          withdrawableAmount: Number(data.withdrawableAmount || 0),
          payoutsEnabled: Boolean(data.payoutsEnabled),
          payoutsStatus: (data.payoutsStatus || "pending") as any,
        };
        setWithdrawInfo(updatedInfo);
        setHasSubmittedWithdrawal(true);
        onPayoutUpdate?.(updatedInfo);
        onWithdrawalSubmitted?.();
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || "Unable to withdraw earnings right now";
      setPayoutError(errorMsg);
      console.error("Withdrawal error:", err);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const effectivePayoutsEnabled = withdrawInfo?.payoutsEnabled ?? !!profile?.payoutsEnabled;
  const status = (withdrawInfo?.payoutsStatus || profile?.payoutsStatus || "pending") as any;
  const isRestricted = status === "restricted";

  return (
    <PanelWrapper id="payout-manager" title="Payouts & Earnings" icon={<CreditCard size={16} />}>
      <div className={`flex flex-col gap-3 sm:gap-5 ${className}`}>
        {/* Status Card */}
        <PayoutStatusCard
          status={status}
          payoutsEnabled={effectivePayoutsEnabled}
          isLoading={payoutLoading}
        />

        {/* Withdrawal Display - Only shown if payouts enabled */}
        {effectivePayoutsEnabled && withdrawInfo && (
          <WithdrawalDisplay
            withdrawableAmount={withdrawInfo.withdrawableAmount}
            withdrawLoading={withdrawLoading}
            hasSubmittedWithdrawal={hasSubmittedWithdrawal}
            onWithdraw={handleWithdraw}
            payoutsEnabled={withdrawInfo.payoutsEnabled}
          />
        )}

        {/* Error Display */}
        {payoutError && (
          <div className="flex items-start gap-1.5 sm:gap-2 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 sm:py-2.5">
            <p className="text-[10px] sm:text-xs text-red-600 leading-relaxed">{payoutError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg sm:rounded-xl text-xs px-3 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none"
            disabled={payoutLoading}
            onClick={() => handlePayoutOnboarding(effectivePayoutsEnabled || isRestricted ? "refresh" : "new")}
          >
            {payoutLoading ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                Redirecting…
              </>
            ) : effectivePayoutsEnabled ? (
              "Manage in Stripe"
            ) : isRestricted ? (
              "Fix in Stripe"
            ) : (
              "Set up payouts"
            )}
          </Button>
        </div>
      </div>
    </PanelWrapper>
  );
};

export default PayoutManager;
