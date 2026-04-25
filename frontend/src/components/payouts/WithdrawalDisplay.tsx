import React from "react";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { WithdrawalDisplayProps } from "./types";

const WithdrawalDisplay: React.FC<WithdrawalDisplayProps> = ({
  withdrawableAmount,
  withdrawLoading,
  hasSubmittedWithdrawal,
  onWithdraw,
  payoutsEnabled,
}) => {
  if (!payoutsEnabled) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 px-3 sm:px-4 py-2 sm:py-3 space-y-1">
        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          Available to Withdraw
        </p>
        <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
          {formatCurrency(withdrawableAmount)}
        </p>
        {!withdrawLoading && (
          <p className="text-[10px] sm:text-[12px] text-slate-600 leading-relaxed">
            {hasSubmittedWithdrawal
              ? "Your withdrawal request has been submitted. The platform will review and process it within 3–5 business days."
              : "Withdrawal requests are reviewed by the platform and are typically processed within 3–5 business days."}
          </p>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full rounded-lg sm:rounded-xl text-xs border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5"
        disabled={withdrawLoading || withdrawableAmount <= 0}
        onClick={onWithdraw}
      >
        {withdrawLoading ? (
          <>
            <Loader className="w-3 h-3 mr-2 animate-spin" />
            Withdrawing…
          </>
        ) : (
          "Withdraw"
        )}
      </Button>
    </div>
  );
};

export default WithdrawalDisplay;
