import React from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { PayoutStatusCardProps } from "./types";

const PayoutStatusCard: React.FC<PayoutStatusCardProps> = ({ status, payoutsEnabled, isLoading = false }) => {
  const getStatusDisplay = () => {
    if (payoutsEnabled) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        title: "Payouts Enabled",
        message: "Payouts are enabled. You'll receive transfers to your connected bank account.",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
      };
    }

    if (status === "restricted") {
      return {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        title: "Action Required",
        message: "Your Stripe payout account needs attention. Click below to fix this in Stripe.",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    }

    return {
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      title: "Pending Setup",
      message: "Set up payouts once so you can withdraw completed contract earnings to your bank.",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    };
  };

  const display = getStatusDisplay();

  return (
    <div className={`rounded-lg sm:rounded-xl border ${display.borderColor} ${display.bgColor} p-4`}>
      <div className="flex items-start gap-3">
        {!isLoading && display.icon}
        {isLoading && <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />}
        <div className="flex-1">
          <p className="font-semibold text-slate-900 text-sm">{display.title}</p>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{display.message}</p>
        </div>
      </div>
    </div>
  );
};

export default PayoutStatusCard;
