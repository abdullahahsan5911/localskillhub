export interface PortfolioItem {
  _id?: string;
  title: string;
  description: string;
  images: string[];
  link?: string;
  category: string;
  tags: string[];
  completedAt?: string;
}

export interface FreelancerProfile {
  title?: string;
  bio?: string;
  skills?: Array<{ name: string; level: string }>;
  tools?: string[];
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
  }>;
  certifications?: Array<{
    name?: string;
    issuedBy?: string;
    issuedDate?: string;
    expiryDate?: string;
    credentialId?: string;
    verificationUrl?: string;
  }>;
  portfolio: PortfolioItem[];
  rates?: { minRate: number; maxRate: number; currency: string; rateType: string };
  totalEarnings?: number;
  completedJobs?: number;
  rating?: number;
  profileViews?: number;
  availability?: { status: string };
  payoutsEnabled?: boolean;
  payoutsStatus?: 'pending' | 'enabled' | 'restricted';
}

export interface Analytics {
  profileViews: number;
  proposalsSent: number;
  proposalsAccepted: number;
  proposalSuccessRate: number;
  totalEarnings: number;
  currentMonthEarnings: number;
  averageRating: number;
  completedJobs: number;
  activeContracts: number;
  localRank?: { rank: number; city: string; totalFreelancers: number };
}

export interface Proposal {
  _id: string;
  jobId: { _id: string; title: string; budget: { amount: number } };
  proposedRate?: { amount?: number; type?: string; currency?: string };
  status: string;
  createdAt: string;
  coverLetter: string;
}

export interface Contract {
  _id: string;
  jobId?: { _id: string; title: string } | null;
  clientId: { name: string; avatar?: string };
  amount: { total: number; type: string; currency: string };
  title?: string;
  offerStatus?: 'pending_freelancer' | 'accepted' | 'rejected';
  hiringContext?: {
    type?: 'individual' | 'company';
    companyId?: string;
  };
  milestones?: Array<{
    _id: string;
    title: string;
    amount: number;
    status: string;
    feedback?: string;
  }>;
  signatures?: { client?: { signed?: boolean }; freelancer?: { signed?: boolean } };
  status: string;
  startDate: string;
  paymentStatus?: string;
  totalPaid?: number;
}

export interface AssetItem {
  _id?: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  price?: number;
  currency?: string;
  fileUrl?: string;
  previewImages?: string[];
  downloads?: number;
  ratings?: { average: number; count: number };
}
