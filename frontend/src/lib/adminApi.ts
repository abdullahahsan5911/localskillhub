const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

type QueryParams = Record<string, unknown>;

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${API_BASE}/admin${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function request<T = unknown>(
  method: string,
  path: string,
  { params, body }: { params?: QueryParams; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

const get = <T = unknown>(path: string, params?: QueryParams) => request<T>('GET', path, { params });
const post = <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, { body });
const put = <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, { body });
const del = <T = unknown>(path: string, body?: unknown) => request<T>('DELETE', path, { body });

// ── Analytics ──────────────────────────────────────────────────
export type AdminAnalytics = {
  overview?: {
    totalUsers?: number;
    newUsers30d?: number;
    bannedUsers?: number;
    highRiskUsers?: number;
    mediumRiskUsers?: number;
    pendingVerifications?: number;
    totalCommunities?: number;
  };
  marketplace?: {
    totalJobs?: number;
    activeJobs?: number;
    completedJobs?: number;
    flaggedJobs?: number;
    conversionRate?: number | string;
  };
  contracts?: {
    totalContracts?: number;
    activeContracts?: number;
    openDisputes?: number;
    disputedContracts?: number;
    disputeRate?: number | string;
  };
  revenue?: {
    platformFees?: number;
    gmv?: number;
    processingFees?: number;
  };
  insights?: {
    topCities?: { _id: string; count: number }[];
    jobsByCategory?: { _id: string; count: number }[];
    roleBreakdown?: { _id: string; count: number }[];
    signupTrend?: { _id: { year: number; month: number }; count: number }[];
  };
};

type AdminAnalyticsResponse = {
  success: boolean;
  data: AdminAnalytics;
};

export const fetchAnalytics = () =>
  get<AdminAnalyticsResponse>('/analytics').then((res) => res.data);

// ── Users ──────────────────────────────────────────────────────
export const fetchUsers = (params?: QueryParams) => get('/users', params);
export const fetchUserDetail = (id: string) => get<{ data: { user: any } }>(`/users/${id}`).then(r => r.data.user);
export const banUser = (id: string, reason: string) => post(`/users/${id}/ban`, { reason });
export const unbanUser = (id: string, reason?: string) => post(`/users/${id}/unban`, { reason });
export const suspendUser = (id: string, reason: string, suspendedUntil?: string) => post(`/users/${id}/suspend`, { reason, suspendedUntil });
export const removeSuspension = (id: string) => post(`/users/${id}/suspend/remove`, {});
export const warnUser = (id: string, reason: string) => post(`/users/${id}/warn`, { reason });
export const removeWarning = (id: string, warningIndex: number) => post(`/users/${id}/warn/remove`, { warningIndex });
export const setRiskLevel = (id: string, riskLevel: string, reason: string) => post(`/users/${id}/risk`, { riskLevel, reason });
export const addAdminNote = (id: string, note: string) => post(`/users/${id}/note`, { note });
export const assignBadge = (id: string, badgeType: string, action: 'add' | 'remove') => post(`/users/${id}/badge`, { badgeType, action });

// ── Verifications ──────────────────────────────────────────────
export type AdminVerificationUser = {
  name?: string;
  email?: string;
  avatar?: string;
};

export type AdminVerificationRequest = {
  _id: string;
  userId: AdminVerificationUser;
  documents: string[];
  status: string;
  type: string;
  createdAt: string;
  rejectionReason?: string;
  submittedData?: unknown;
};

export type AdminVerificationRequestsResponse = {
  data: AdminVerificationRequest[];
};

export const fetchVerifications = (params?: QueryParams) => get<AdminVerificationRequestsResponse>('/verifications', params);
export const approveVerification = (id: string, badgeType?: string) => post(`/verifications/${id}/approve`, { badgeType });
export const rejectVerification = (id: string, reason: string) => post(`/verifications/${id}/reject`, { reason });
export const requestReupload = (id: string, reason: string) => post(`/verifications/${id}/reupload`, { reason });

// ── Jobs ───────────────────────────────────────────────────────
export const fetchAdminJobs = (params?: QueryParams) => get('/jobs', params);
export const flagJob = (id: string, reason: string) => post(`/jobs/${id}/flag`, { reason });
export const unflagJob = (id: string) => post(`/jobs/${id}/unflag`);
export const featureJob = (id: string, isFeatured: boolean) => post(`/jobs/${id}/feature`, { isFeatured });
export const deleteJob = (id: string, reason: string) => del(`/jobs/${id}`, { reason });

// ── Contracts ──────────────────────────────────────────────────
export type AdminContractEarnings = {
  contractAmount: number;
  currency: string;
  platformFeePercentage?: number;
  platformFeeAmount: number;
  freelancerNetAmount: number;
  processingFee: number;
  clientTotal: number;
  stripeProcessingFee: number;
  stripeProcessingFeePercentage: number;
  adminEarningsAfterStripe: number;
  stripeChargeId: string | null;
  paymentStatus?: string;
  transactionStatus?: string;
};

export type AdminContractDetail = {
  contract: Record<string, unknown>;
  dispute?: unknown;
  reviews?: AdminContractReport[];
};

export const fetchAdminContracts = (params?: QueryParams) => get('/contracts', params);
export const fetchContractDetail = (id: string) =>
  get<{ data: AdminContractDetail }>(`/contracts/${id}`).then(r => r.data);
export const fetchContractEarnings = (id: string) =>
  get<{ data: { contract: unknown; earnings: AdminContractEarnings } }>(`/contracts/${id}/earnings`).then(r => r.data);
export const forceReleaseEscrow = (id: string, reason: string) => post(`/contracts/${id}/release`, { reason });
export const refundClient = (id: string, reason: string) => post(`/contracts/${id}/refund`, { reason });
export const freezeContract = (id: string, reason: string) => post(`/contracts/${id}/freeze`, { reason });

// ── Disputes ───────────────────────────────────────────────────
export type AdminDisputeContract = {
  title?: string;
};

export type AdminDisputeUser = {
  name?: string;
};

export type AdminDispute = {
  _id: string;
  contractId: AdminDisputeContract;
  raisedBy: AdminDisputeUser;
  status: string;
  createdAt: string;
  description?: string;
  resolution?: unknown;
};

export type AdminDisputesResponse = {
  data: AdminDispute[];
  pagination?: { pages: number };
};

export const fetchDisputes = (params?: QueryParams) => get<AdminDisputesResponse>('/disputes', params);
export const fetchDisputeDetail = (id: string) => get<{ data: unknown }>(`/disputes/${id}`).then(r => r.data);
export const resolveDispute = (id: string, data: { resolutionType: string; freelancerAmount?: number; clientAmount?: number; notes?: string; reason: string }) => post(`/disputes/${id}/resolve`, data);

// ── Reviews ────────────────────────────────────────────────────
export type AdminReviewUser = {
  name?: string;
  avatar?: string;
};

export type AdminReviewRating = {
  overall?: number;
};

export type AdminReview = {
  _id: string;
  reviewerId: AdminReviewUser;
  reviewedUserId: AdminReviewUser;
  rating: AdminReviewRating;
  reviewText?: string;
  isFlagged?: boolean;
  flagReason?: string;
  createdAt: string;
};

export type AdminReviewsResponse = {
  data: AdminReview[];
};

export const fetchAdminReviews = (params?: QueryParams) => get<AdminReviewsResponse>('/reviews', params);
export const deleteReview = (id: string, reason: string) => del(`/reviews/${id}`, { reason });
export const flagReview = (id: string, reason: string) => post(`/reviews/${id}/flag`, { reason });

// ── Reputation ─────────────────────────────────────────────────
export const fetchReputations = (params?: QueryParams) => get('/reputation', params);
export const fetchUserReputation = (userId: string) => get<{ data: unknown }>(`/reputation/${userId}`).then(r => r.data);
export const adjustReputationScore = (userId: string, field: string, value: number, reason: string) => post(`/reputation/${userId}/adjust`, { field, value, reason });

// ── Communities ────────────────────────────────────────────────
export type AdminCommunityOwner = {
  name?: string;
};

export type AdminCommunity = {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  logo?: string;
  isSuspended?: boolean;
  ownerId?: AdminCommunityOwner;
  members?: unknown[];
};

export type AdminCommunitiesResponse = {
  data: AdminCommunity[];
};

export const fetchAdminCommunities = (params?: QueryParams) =>
  get<AdminCommunitiesResponse>('/communities', params);
export const deleteCommunity = (id: string, reason: string) => del(`/communities/${id}`, { reason });
export const suspendCommunity = (id: string, reason: string) => post(`/communities/${id}/suspend`, { reason });
export const restoreCommunity = (id: string) => post(`/communities/${id}/restore`);

// ── Payments ───────────────────────────────────────────────────
export type AdminEscrowAmount = {
  currency: string;
  total: number;
};

export type AdminEscrowParty = {
  _id?: string;
  name: string;
  email?: string;
};

export type AdminEscrowContract = {
  _id: string;
  title: string;
  status?: string;
  paymentStatus?: string;
  clientId: AdminEscrowParty;
  freelancerId: AdminEscrowParty;
  amount: AdminEscrowAmount;
  createdAt: string;
  isHeldByAdmin?: boolean;
  holdReason?: string;
  reports?: AdminContractReport[];
  financials?: AdminContractEarnings;
};

export type AdminEscrowOverview = {
  totalHeld: number;
  contracts: AdminEscrowContract[];
};

export const fetchEscrowOverview = () =>
  get<{ data: AdminEscrowOverview }>('/payments/escrow').then(r => r.data);
export const fetchTransactions = (params?: QueryParams) => get('/payments/transactions', params);

// ── Withdrawal Requests ─────────────────────────────────────────
export type AdminWithdrawalRequest = {
  userId: string;
  totalAmount: number;
  txCount: number;
  latestAt: string;
  user?: { _id: string; name?: string; email?: string; role?: string } | null;
};

export const fetchWithdrawalRequests = () =>
  get<{ success: boolean; data: AdminWithdrawalRequest[] }>('/payments/withdrawals').then(
    (r) => (r as any).data
  );

export const approveWithdrawal = (userId: string) =>
  post(`/payments/withdrawals/${userId}/approve`);

// ── Settings ───────────────────────────────────────────────────
export type AdminSettings = {
  platformFeePercentage?: number;
  escrowEnabled?: boolean;
  maxProposalsPerJob?: number;
  maxActiveJobsPerClient?: number;
  autoFlagReportCount?: number;
  autoFlagRefundCount?: number;
  allowNewRegistrations?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
};

export const fetchSettings = () => get<AdminSettings>('/settings');
export const updateSettings = (data: Record<string, unknown>) => put('/settings', data);

// ── Audit Logs ─────────────────────────────────────────────────
export const fetchAuditLogs = (params?: QueryParams) => get('/logs', params);

// ── Escrow Hold / Unhold ───────────────────────────────────────
export const holdEscrow = (id: string, reason: string) => post(`/contracts/${id}/hold`, { reason });
export const unholdEscrow = (id: string, reason?: string) => post(`/contracts/${id}/unhold`, { reason });

// ── Payment Stats ──────────────────────────────────────────────
export type AdminPaymentStats = {
  totalClientPaid: number;
  totalInEscrow: number;
  totalReleased: number;
  totalPlatformFees: number;
  totalRefunded: number;
  escrowCount: number;
  releasedCount: number;
  disputedCount: number;
  pendingWithdrawals: number;
  heldByAdminCount: number;
  paymentStatusBreakdown: { _id: string; count: number; volume: number }[];
  // Real Stripe Transaction-ledger amounts (actual amounts, not DB estimates)
  totalActualClientCharges: number;   // sum of clientTotal from Transaction (job + stripe fee)
  totalActualStripeFees: number;      // sum of actualStripeFee from Transaction
  totalActualPlatformFees: number;    // sum of platformFee from Transaction ledger
  totalNetAmountHeld: number;         // sum of netAmount for held transactions (what freelancers will get)
};


export const fetchPaymentStats = () =>
  get<{ success: boolean; data: AdminPaymentStats }>('/payments/stats').then(r => (r as any).data);

// Extend existing types
export interface AdminContractReport {
  _id: string;
  reporterId: { name?: string; email?: string } | string;
  reporterRole: 'client' | 'freelancer';
  reason: string;
  description?: string;
  createdAt: string;
}

