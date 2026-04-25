// Payout and withdrawal type definitions

export interface WithdrawInfo {
  withdrawableAmount: number;
  payoutsEnabled: boolean;
  payoutsStatus: "pending" | "enabled" | "restricted";
}

export type PayoutStatus = "pending" | "enabled" | "restricted";

export interface PayoutProfile {
  payoutsEnabled?: boolean;
  payoutsStatus?: PayoutStatus;
}

export interface PayoutManagerProps {
  profile: PayoutProfile | null;
  onPayoutUpdate?: (info: WithdrawInfo) => void;
  onWithdrawalSubmitted?: () => void;
  className?: string;
}

export interface WithdrawalDisplayProps {
  withdrawableAmount: number;
  withdrawLoading: boolean;
  hasSubmittedWithdrawal: boolean;
  onWithdraw: () => void;
  payoutsEnabled: boolean;
}

export interface PayoutStatusCardProps {
  status: PayoutStatus;
  payoutsEnabled: boolean;
  isLoading?: boolean;
  onAction?: () => void;
}
