export interface Job {
	_id: string;
	title: string;
	status: string;
	category: string;
	budget: { type: string; amount: number; currency: string };
	createdAt: string;
	proposals?: any[];
	skills: string[];
	clientId?: any;
}

export interface Proposal {
	_id: string;
	jobId: { _id: string; title: string };
	freelancerId: { _id: string; name: string; avatar?: string };
	coverLetter: string;
	proposedRate?: { amount?: number; type?: string; currency?: string };
	estimatedDuration?: { value?: number; unit?: string };
	status: string;
	createdAt: string;
}

export interface Contract {
  proposalId: any;
	_id: string;
	jobId?: { _id: string; title: string } | null;
	title?: string;
	freelancerId: { _id: string; name: string; avatar?: string };
	clientId?: { _id: string; name: string; avatar?: string };
	amount: { total: number; type: string; currency: string };
	isHiringRequest?: boolean;
	offerStatus?: "pending_freelancer" | "accepted" | "rejected";
	hiringContext?: {
		type?: "individual" | "company";
		companyId?: string | { _id: string; name: string; logo?: string };
	};
	milestones?: Array<{
		_id: string;
		title: string;
		amount: number;
		status: string;
		feedback?: string;
		deliverables?: Array<{
			filename: string;
			url: string;
			uploadedAt?: string;
		}>;
	}>;
	signatures?: {
		client?: { signed?: boolean };
		freelancer?: { signed?: boolean };
	};
	status: string;
	startDate: string;
	paymentStatus?: string;
	totalPaid?: number;
}

export interface Analytics {
	jobsPosted: number;
	openJobs: number;
	activeContracts: number;
	completedJobs: number;
	totalSpent: number;
	totalProposalsReceived: number;
	hireRate: number;
	avgJobValue: number;
}

export const statusColors: Record<string, string> = {
	open: "bg-green-100 text-green-700",
	"in-progress": "bg-blue-100 text-blue-700",
	completed: "bg-gray-100 text-gray-700",
	cancelled: "bg-red-100 text-red-700",
	draft: "bg-yellow-100 text-yellow-700",
	closed: "bg-gray-100 text-gray-600",
	accepted: "bg-green-100 text-green-700",
	sent: "bg-yellow-100 text-yellow-700",
	viewed: "bg-blue-100 text-blue-700",
	shortlisted: "bg-purple-100 text-purple-700",
	pending: "bg-yellow-100 text-yellow-700",
	rejected: "bg-red-100 text-red-700",
	active: "bg-blue-100 text-blue-700",
	submitted: "bg-indigo-100 text-indigo-700",
	"revision-requested": "bg-amber-100 text-amber-700",
	approved: "bg-green-100 text-green-700",
	paid: "bg-emerald-100 text-emerald-700",
};

