// API Configuration and Service Layer
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null;

  private toQueryString(params?: Record<string, unknown>): string {
    if (!params) return '';

    const entries = Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    });

    if (entries.length === 0) return '';

    return `?${new URLSearchParams(entries as [string, string][]).toString()}`;
  }

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        const err: any = new Error(data.message || 'API request failed');
        err.code = data.code;
        err.status = response.status;
        err.response = { data };
        
        // Provide better fallback messages for specific status codes.
        // Preserve backend-provided message when present (e.g., Twilio error codes).
        const hasServerMessage = Boolean(data?.message);
        if (response.status === 429 && !hasServerMessage) {
          err.message = 'Too many requests. Please wait before trying again.';
        } else if (response.status === 500 && !hasServerMessage) {
          err.message = 'Server error. Please try again later.';
        } else if (response.status === 401 && !hasServerMessage) {
          err.message = 'Unauthorized. Please log in again.';
        } else if (response.status === 403 && !hasServerMessage) {
          err.message = 'You do not have permission to perform this action.';
        }
        
        throw err;
      }

      return data;
    } catch (error: any) {
      // Handle network errors (Failed to fetch)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const networkError = new Error('Network error. Please check your connection.');
        networkError.name = 'NetworkError';
        throw networkError;
      }
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: { name: string; email: string; password: string; role?: string }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if ((response as any).token) {
      this.setToken((response as any).token);
    }
    
    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if ((response as any).token) {
      this.setToken((response as any).token);
    }
    
    return response;
  }

  async oauthLogin(data: { idToken: string; provider: 'google' | 'github' | 'email' }) {
    const response = await this.request('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if ((response as any).token) {
      this.setToken((response as any).token);
    }
    return response;
  }

  async verifyOtp(data: { email: string; otp: string; type?: string }) {
    const response = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if ((response as any).token) {
      this.setToken((response as any).token);
    }
    return response;
  }

  async resendOtp(email: string, type?: string) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, type }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: { email: string; otp: string; password: string }) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestPhoneOtp(phone: string) {
    return this.request('/auth/request-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyPhoneOtp(otp: string) {
    const response = await this.request('/auth/verify-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
    if ((response as any).token) {
      this.setToken((response as any).token);
    }
    return response;
  }

  async resendPhoneOtp() {
    return this.request('/auth/resend-phone-otp', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async verifyPhoneFirebase(data: { token: string; phone: string }) {
    return this.request('/auth/verify-phone-firebase', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkGithubAccount(githubUsername: string) {
    return this.request('/users/verify/github/check', {
      method: 'POST',
      body: JSON.stringify({ githubUsername }),
    });
  }

  async verifyGithub(enteredUsername: string, token: string) {
    return this.request('/users/verify/github', {
      method: 'POST',
      body: JSON.stringify({ enteredUsername, token }),
    });
  }

  async verifyGithubSso(enteredUsername: string) {
    return this.request('/users/verify/github/sso', {
      method: 'POST',
      body: JSON.stringify({ enteredUsername }),
    });
  }

  async getVerificationStatus() {
    return this.request('/users/me/verification-status', {
      method: 'GET',
    });
  }

  async submitVerifiedBadgeApplication() {
    return this.request('/users/verification/submit-verified-badge', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  async getMe() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  async updateProfile(updates: any) {
    return this.request('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(passwords: any) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    });
  }

  async deleteAccount(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Onboarding endpoints
  async completeOnboarding() {
    return this.request('/users/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async skipOnboarding(lastStep?: number) {
    return this.request('/users/onboarding/skip', {
      method: 'POST',
      body: JSON.stringify({ lastStep: lastStep || 1 }),
    });
  }

  // Job endpoints
  async getJobs(params?: {
    category?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
  }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/jobs${queryString}`, {
      method: 'GET',
    });
  }

  async getJob(id: string) {
    return this.request(`/jobs/${id}`, {
      method: 'GET',
    });
  }

  async createJob(jobData: any) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: string, jobData: any) {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: string) {
    return this.request(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyJobs(params?: { status?: string; page?: number }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/jobs/my${queryString}`, {
      method: 'GET',
    });
  }

  async getNearbyJobs(lat: number, lng: number, radius: number = 50) {
    return this.request(`/jobs/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
      method: 'GET',
    });
  }

  // Freelancer endpoints
  async getFreelancers(params?: {
    skills?: string;
    city?: string;
    state?: string;
    country?: string;
    search?: string;
    page?: number;
    limit?: number;
    completeOnly?: boolean;
    minRate?: number;
    maxRate?: number;
    availability?: string;
    verifiedOnly?: boolean;
    sort?: string;
  }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/freelancers${queryString}`, {
      method: 'GET',
    });
  }

  async getFreelancer(id: string) {
    return this.request(`/freelancers/${id}`, {
      method: 'GET',
    });
  }

  async updateFreelancerProfile(profileData: any) {
    return this.request('/freelancers/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async createFreelancerProfile(profileData: any) {
    return this.request('/freelancers/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async addPortfolioItem(itemData: any) {
    return this.request('/freelancers/portfolio', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updatePortfolioItem(itemId: string, itemData: any) {
    return this.request(`/freelancers/portfolio/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deletePortfolioItem(itemId: string) {
    return this.request(`/freelancers/portfolio/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getNearbyFreelancers(lat: number, lng: number, radius: number = 50) {
    return this.request(`/freelancers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
      method: 'GET',
    });
  }

  // Proposal endpoints
  async getProposals(jobId?: string) {
    const queryString = jobId ? `?jobId=${jobId}` : '';
    return this.request(`/proposals${queryString}`, {
      method: 'GET',
    });
  }

  async createProposal(proposalData: any) {
    return this.request('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
  }

  async updateProposal(id: string, updates: any) {
    return this.request(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async acceptProposal(id: string) {
    return this.request(`/proposals/${id}/accept`, {
      method: 'POST',
    });
  }

  async rejectProposal(id: string) {
    return this.request(`/proposals/${id}/reject`, {
      method: 'POST',
    });
  }

  async withdrawProposal(id: string) {
    return this.request(`/proposals/${id}/withdraw`, {
      method: 'POST',
    });
  }

  // Contract endpoints
  async getContracts() {
    return this.request('/contracts', {
      method: 'GET',
    });
  }

  async getContract(id: string) {
    return this.request(`/contracts/${id}`, {
      method: 'GET',
    });
  }

  async createContract(contractData: any) {
    return this.request('/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async createHiringRequest(payload: {
    freelancerId: string;
    title: string;
    description?: string;
    amount: { total: number; type: 'hourly' | 'fixed'; currency?: string };
    milestones?: Array<{ title: string; description?: string; amount: number; dueDate?: string }>;
    hiringType?: 'individual' | 'company';
    companyId?: string;
    terms?: string;
  }) {
    return this.request('/contracts/hire-request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async respondToHiringRequest(contractId: string, action: 'accept' | 'reject') {
    return this.request(`/contracts/${contractId}/hire-response`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async signContract(id: string) {
    return this.request(`/contracts/${id}/sign`, {
      method: 'POST',
    });
  }

  async declineContract(id: string) {
    return this.request(`/contracts/${id}/decline`, {
      method: 'POST',
    });
  }

  async createContractPaymentIntent(id: string) {
    return this.request(`/contracts/${id}/payment-intent`, {
      method: 'POST',
    });
  }

  async confirmContractPayment(id: string) {
    return this.request(`/contracts/${id}/payment-confirm`, {
      method: 'POST',
    });
  }
    async getClientPaymentBreakdown(contractId: string) {
      return this.request(`/contracts/${contractId}/payment-breakdown`, {
        method: 'GET',
      });
    }

  async getContractPaymentPreview(contractId: string) {
    return this.request(`/contracts/${contractId}/payment-preview`, {
      method: 'GET',
    });
  }

  async submitMilestone(contractId: string, milestoneId: string, deliverables: Array<{ filename: string; url: string }>) {
    return this.request(`/contracts/${contractId}/milestones/${milestoneId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ deliverables }),
    });
  }

  async approveMilestone(contractId: string, milestoneId: string) {
    return this.request(`/contracts/${contractId}/milestones/${milestoneId}/approve`, {
      method: 'POST',
    });
  }

  async requestMilestoneRevision(contractId: string, milestoneId: string, feedback: string) {
    return this.request(`/contracts/${contractId}/milestones/${milestoneId}/revision`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async releaseMilestonePayment(contractId: string, milestoneId: string) {
    return this.request(`/contracts/${contractId}/milestones/${milestoneId}/release-payment`, {
      method: 'POST',
    });
  }

  async reportContract(contractId: string, reason: string, description?: string) {
    return this.request(`/contracts/${contractId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  }

  async initiateContractDispute(contractId: string, reason: string) {
    return this.request(`/contracts/${contractId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Payout / Stripe Connect endpoints for freelancers
  async createPayoutOnboardingLink() {
    return this.request('/payments/connect/onboard', {
      method: 'POST',
    });
  }

  async refreshPayoutOnboardingLink() {
    return this.request('/payments/connect/refresh', {
      method: 'POST',
    });
  }

   async getPayoutStatus() {
     return this.request('/payments/payout/status', {
       method: 'GET',
     });
   }

   async withdrawPayouts() {
     return this.request('/payments/payout/withdraw', {
       method: 'POST',
     });
   }

  // Message endpoints
  async getConversations() {
    return this.request('/messages/conversations', {
      method: 'GET',
    });
  }

  async getMessages(conversationId: string) {
    return this.request(`/messages/${conversationId}`, {
      method: 'GET',
    });
  }

  async sendMessage(messageData: { receiverId: string; content?: string; conversationId?: string; attachments?: any[] }) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async markMessageRead(messageId: string) {
    return this.request(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async deleteMessage(messageId: string) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async editMessage(messageId: string, content: string) {
    return this.request(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  // Review endpoints
  async getReviews(userId: string) {
    return this.request(`/reviews?userId=${userId}`, {
      method: 'GET',
    });
  }

  async getContractReviews(contractId: string) {
    return this.request(`/reviews?contractId=${contractId}`, {
      method: 'GET',
    });
  }

  async createReview(reviewData: any) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Reputation endpoints
  async getReputation(userId: string) {
    return this.request(`/users/${userId}/reputation`, {
      method: 'GET',
    });
  }

  // Follow endpoints
  async followUser(userId: string) {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string) {
    return this.request(`/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'GET',
    });
  }

  // Job bookmarks for current user
  async bookmarkJob(jobId: string) {
    return this.request('/users/me/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  }

  async unbookmarkJob(jobId: string) {
    return this.request(`/users/me/bookmarks/${jobId}`, {
      method: 'DELETE',
    });
  }

  // Community endpoints
  async getLeaderboard(params?: { city?: string; category?: string; limit?: number }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/analytics/leaderboard/local${queryString}`, {
      method: 'GET',
    });
  }

  async getBadges() {
    return this.request('/communities/badges', {
      method: 'GET',
    });
  }

  async getEvents() {
    return this.request('/communities/events', {
      method: 'GET',
    });
  }

  // Community jobs/articles/products endpoints
  async getCommunityJobs(params?: { communityId?: string; page?: number; limit?: number; includeImages?: boolean; includeLinks?: boolean }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/communities/jobs${queryString}`, { method: 'GET' });
  }

  async createCommunityJob(data: any) {
    return this.request('/communities/jobs', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCommunityJob(id: string, data: any) {
    return this.request(`/communities/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCommunityJob(id: string) {
    return this.request(`/communities/jobs/${id}`, { method: 'DELETE' });
  }

  async getCommunityArticles(params?: { communityId?: string; page?: number; limit?: number; includeImages?: boolean; includeLinks?: boolean }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/communities/articles${queryString}`, { method: 'GET' });
  }

  async getCommunityArticle(id: string) {
    return this.request(`/communities/articles/${id}`, { method: 'GET' });
  }

  async createCommunityArticle(data: any) {
    return this.request('/communities/articles', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCommunityArticle(id: string, data: any) {
    return this.request(`/communities/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCommunityArticle(id: string) {
    return this.request(`/communities/articles/${id}`, { method: 'DELETE' });
  }

  async getCommunityProducts(params?: { communityId?: string; page?: number; limit?: number; includeImages?: boolean; includeLinks?: boolean }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/communities/products${queryString}`, { method: 'GET' });
  }

  async createCommunityProduct(data: any) {
    return this.request('/communities/products', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCommunityProduct(id: string, data: any) {
    return this.request(`/communities/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCommunityProduct(id: string) {
    return this.request(`/communities/products/${id}`, { method: 'DELETE' });
  }

  // Job interactions
  async toggleCommunityJobLike(jobId: string) {
    return this.request(`/communities/jobs/${jobId}/like`, { method: 'POST' });
  }

  async commentCommunityJob(jobId: string, content: string) {
    return this.request(`/communities/jobs/${jobId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async replyCommunityJobComment(jobId: string, commentId: string, content: string) {
    return this.request(`/communities/jobs/${jobId}/comments/${commentId}/replies`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  // Article interactions
  async toggleCommunityArticleLike(articleId: string) {
    return this.request(`/communities/articles/${articleId}/like`, { method: 'POST' });
  }

  async commentCommunityArticle(articleId: string, content: string) {
    return this.request(`/communities/articles/${articleId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async replyCommunityArticleComment(articleId: string, commentId: string, content: string) {
    return this.request(`/communities/articles/${articleId}/comments/${commentId}/replies`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  // Product interactions
  async toggleCommunityProductLike(productId: string) {
    return this.request(`/communities/products/${productId}/like`, { method: 'POST' });
  }

  async commentCommunityProduct(productId: string, content: string) {
    return this.request(`/communities/products/${productId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async replyCommunityProductComment(productId: string, commentId: string, content: string) {
    return this.request(`/communities/products/${productId}/comments/${commentId}/replies`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async createEvent(data: { title: string; description?: string; location?: string; date: string; communityId?: string; images?: string[]; links?: string[] }) {
    return this.request('/communities/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: { title?: string; description?: string; location?: string; date?: string; images?: string[]; links?: string[] }) {
    return this.request(`/communities/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/communities/events/${id}`, {
      method: 'DELETE',
    });
  }

  async joinEvent(id: string) {
    return this.request(`/communities/events/${id}/join`, {
      method: 'POST',
    });
  }

  async unjoinEvent(id: string) {
    return this.request(`/communities/events/${id}/join`, {
      method: 'DELETE',
    });
  }

    async toggleEventLike(eventId: string) {
      return this.request(`/communities/events/${eventId}/like`, {
        method: 'POST',
      });
    }

    async commentEvent(eventId: string, content: string) {
      return this.request(`/communities/events/${eventId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }

    async replyEventComment(eventId: string, commentId: string, content: string) {
      return this.request(`/communities/events/${eventId}/comments/${commentId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }

    async reactEvent(eventId: string, type: string) {
      return this.request(`/communities/events/${eventId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
    }

  async getUserRank() {
    return this.request('/communities/rank', {
      method: 'GET',
    });
  }

  // Companies endpoints
  async getCompanies(params?: { q?: string; industry?: string; page?: number; limit?: number }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/companies${queryString}`, {
      method: 'GET',
    });
  }

  async getMyCompanies() {
    return this.request('/companies/my', {
      method: 'GET',
    });
  }

  async getCompany(id: string) {
    return this.request(`/companies/${id}`, {
      method: 'GET',
    });
  }

  async createCompany(data: { name: string; description?: string; industry?: string; website?: string; logo?: string; location?: any }) {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: Partial<{ name: string; description: string; industry: string; website: string; logo: string; location: any }>) {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id: string) {
    return this.request(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadCompanyDocument(companyId: string, file: File, documentType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const url = `${this.baseURL}/companies/${companyId}/documents`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload document');
    }

    return response.json();
  }

  async getCompanyDocuments(companyId: string) {
    return this.request(`/companies/${companyId}/documents`, {
      method: 'GET',
    });
  }

  async deleteCompanyDocument(companyId: string, docId: string) {
    return this.request(`/companies/${companyId}/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  
  async getCommunities(params?: { q?: string; category?: string; page?: number; limit?: number }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/communities${queryString}`, {
      method: 'GET',
    });
  }

  async getMyCommunities() {
    return this.request('/communities/my', {
      method: 'GET',
    });
  }

  async getCommunityById(id: string) {
    return this.request(`/communities/${id}`, {
      method: 'GET',
    });
  }

  async updateCommunity(id: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    logo: string;
    coverImage: string;
    tagline: string;
    website: string;
    industry: string;
  }>) {
    return this.request(`/communities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCommunityFeed(id: string) {
    return this.request(`/communities/${id}/feed`, {
      method: 'GET',
    });
  }

  async followCommunityPage(id: string, targetCommunityId: string) {
    return this.request(`/communities/${id}/following`, {
      method: 'POST',
      body: JSON.stringify({ targetCommunityId }),
    });
  }

  async unfollowCommunityPage(id: string, targetCommunityId: string) {
    return this.request(`/communities/${id}/following/${targetCommunityId}`, {
      method: 'DELETE',
    });
  }

  async addCommunityAdmin(id: string, userId: string) {
    return this.request(`/communities/${id}/admins`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeCommunityAdmin(id: string, userId: string) {
    return this.request(`/communities/${id}/admins/${userId}`, {
      method: 'DELETE',
    });
  }

  async addRestrictedCommunityMember(id: string, userId: string) {
    return this.request(`/communities/${id}/restricted`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeRestrictedCommunityMember(id: string, userId: string) {
    return this.request(`/communities/${id}/restricted/${userId}`, {
      method: 'DELETE',
    });
  }

  async createCommunity(data: { 
    name: string; 
    description?: string; 
    category?: string; 
    logo?: string; 
    coverImage?: string;
    tagline?: string;
    website?: string;
    industry?: string;
  }) {
    return this.request('/communities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinCommunity(id: string) {
    return this.request(`/communities/${id}/join`, {
      method: 'POST',
    });
  }

  async leaveCommunity(id: string) {
    return this.request(`/communities/${id}/leave`, {
      method: 'POST',
    });
  }

  async deleteCommunity(id: string) {
    return this.request(`/communities/${id}`, {
      method: 'DELETE',
    });
  }

  // Community posts (LinkedIn-style group posts)
  async getCommunityPosts(communityId: string, params?: { page?: number; limit?: number }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/communities/${communityId}/posts${queryString}`, {
      method: 'GET',
    });
  }

  async createCommunityPost(communityId: string, data: { content: string; images?: string[]; links?: string[]; repostOf?: string }) {
    return this.request(`/communities/${communityId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommunityPost(communityId: string, postId: string, data: { content?: string; images?: string[]; links?: string[]; isHidden?: boolean }) {
    return this.request(`/communities/${communityId}/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCommunityPost(communityId: string, postId: string) {
    return this.request(`/communities/${communityId}/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async toggleCommunityPostLike(communityId: string, postId: string) {
    return this.request(`/communities/${communityId}/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async repostCommunityPost(communityId: string, postId: string) {
    return this.request(`/communities/${communityId}/posts/${postId}/repost`, {
      method: 'POST',
    });
  }

  async commentCommunityPost(communityId: string, postId: string, content: string) {
    return this.request(`/communities/${communityId}/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async replyCommunityPostComment(communityId: string, postId: string, commentId: string, content: string) {
    return this.request(`/communities/${communityId}/posts/${postId}/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteCommunityPostComment(communityId: string, postId: string, commentId: string) {
    return this.request(`/communities/${communityId}/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async reactCommunityPost(communityId: string, postId: string, type: string) {
    return this.request(`/communities/${communityId}/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  // Analytics endpoints
  async getFreelancerAnalytics() {
    return this.request('/analytics/freelancer', {
      method: 'GET',
    });
  }

  async getClientAnalytics() {
    return this.request('/analytics/client', {
      method: 'GET',
    });
  }

  // Geolocation endpoints
  async findFreelancersNearby(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    skills?: string[];
    minRating?: number;
    limit?: number;
    available?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', params.latitude.toString());
    queryParams.append('longitude', params.longitude.toString());
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.skills) queryParams.append('skills', params.skills.join(','));
    if (params.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.available !== undefined) queryParams.append('available', params.available.toString());

    return this.request(`/geo/freelancers/nearby?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async findJobsNearby(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    skills?: string[];
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    limit?: number;
    remote?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', params.latitude.toString());
    queryParams.append('longitude', params.longitude.toString());
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.skills) queryParams.append('skills', params.skills.join(','));
    if (params.category) queryParams.append('category', params.category);
    if (params.minBudget) queryParams.append('minBudget', params.minBudget.toString());
    if (params.maxBudget) queryParams.append('maxBudget', params.maxBudget.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.remote !== undefined) queryParams.append('remote', params.remote.toString());

    return this.request(`/geo/jobs/nearby?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async getFreelancersByCity(city: string, params?: {
    skills?: string[];
    minRating?: number;
    available?: boolean;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.skills) queryParams.append('skills', params.skills.join(','));
    if (params?.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params?.available !== undefined) queryParams.append('available', params.available.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/geo/freelancers/city/${encodeURIComponent(city)}${queryString}`, {
      method: 'GET',
    });
  }

  async getJobsByCity(city: string, params?: {
    category?: string;
    skills?: string[];
    minBudget?: number;
    maxBudget?: number;
    remote?: boolean;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.skills) queryParams.append('skills', params.skills.join(','));
    if (params?.minBudget) queryParams.append('minBudget', params.minBudget.toString());
    if (params?.maxBudget) queryParams.append('maxBudget', params.maxBudget.toString());
    if (params?.remote !== undefined) queryParams.append('remote', params.remote.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/geo/jobs/city/${encodeURIComponent(city)}${queryString}`, {
      method: 'GET',
    });
  }

  // Asset marketplace endpoints
  async getAssets(params?: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    creatorId?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/assets${queryString}`, {
      method: 'GET',
    });
  }

  async getAsset(id: string) {
    return this.request(`/assets/${id}`, {
      method: 'GET',
    });
  }

  async getMyAssets() {
    return this.request('/assets/me/mine', {
      method: 'GET',
    });
  }

  async createAsset(data: any) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id: string, data: any) {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string) {
    return this.request(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  async downloadAsset(id: string) {
    return this.request(`/assets/${id}/download`, {
      method: 'POST',
    });
  }

  async rateAsset(id: string, rating: number) {
    return this.request(`/assets/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  // Portfolio appreciations
  async appreciatePortfolioItem(itemId: string) {
    return this.request(`/freelancers/portfolio/${itemId}/appreciate`, {
      method: 'POST',
    });
  }

  async removePortfolioAppreciation(itemId: string) {
    return this.request(`/freelancers/portfolio/${itemId}/appreciate`, {
      method: 'DELETE',
    });
  }

  async getMapClusters(params: {
    type: 'freelancers' | 'jobs';
    zoom: number;
    bounds?: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('type', params.type);
    queryParams.append('zoom', params.zoom.toString());
    if (params.bounds) {
      queryParams.append('minLat', params.bounds.minLat.toString());
      queryParams.append('maxLat', params.bounds.maxLat.toString());
      queryParams.append('minLng', params.bounds.minLng.toString());
      queryParams.append('maxLng', params.bounds.maxLng.toString());
    }

    return this.request(`/geo/map/clusters?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async getPopularCities(type: 'freelancers' | 'jobs' = 'freelancers', limit: number = 10) {
    return this.request(`/geo/cities/popular?type=${type}&limit=${limit}`, {
      method: 'GET',
    });
  }

  async geocodeAddress(address: string) {
    return this.request(`/geo/map/geocode?address=${encodeURIComponent(address)}`, {
      method: 'GET',
    });
  }

  async reverseGeocodeCoordinates(latitude: number, longitude: number) {
    return this.request(
      `/geo/map/reverse-geocode?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`,
      {
        method: 'GET',
      }
    );
  }

  async triggerGeolocationBackfill(limit: number = 200) {
    return this.request('/geo/admin/backfill', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  }

  // Upload endpoint – sends file to backend which proxies to Cloudinary
  // Backend returns the canonical secure_url as `url` plus basic metadata.
  async uploadFile(file: File, folder?: string): Promise<{ url: string; publicId: string; resourceType?: string; fileName: string; fileSize: number; fileType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    const headers: HeadersInit = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data.data;
  }

  // Ban Appeal endpoints
  async submitBanAppeal(appealMessage: string) {
    return this.request('/appeals/ban', {
      method: 'POST',
      body: JSON.stringify({ appealMessage }),
    });
  }

  async getBanAppealStatus() {
    return this.request('/appeals/ban/status', {
      method: 'GET',
    });
  }

  async reopenBanAppeal(appealId: string) {
    return this.request(`/appeals/ban/${appealId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getAllBanAppeals(params?: { page?: number; limit?: number; status?: string }) {
    const queryString = this.toQueryString(params as Record<string, unknown>);
    return this.request(`/appeals/ban${queryString}`, {
      method: 'GET',
    });
  }

  async reviewBanAppeal(appealId: string, decision: 'approved' | 'rejected', adminReview?: string) {
    return this.request(`/appeals/ban/${appealId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, adminReview }),
    });
  }

  // Token management
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
  }

  getToken() {
    return this.token;
  }
}

// Export singleton instance
export const api = new ApiService(API_BASE_URL);
export default api;
