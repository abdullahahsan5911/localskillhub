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
        err.response = { data };
        throw err;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
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

  async verifyOtp(data: { email: string; otp: string }) {
    const response = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if ((response as any).token) {
      this.setToken((response as any).token);
    }
    return response;
  }

  async resendOtp(email: string) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
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

  // Job endpoints
  async getJobs(params?: {
    category?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
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

  async signContract(id: string) {
    return this.request(`/contracts/${id}/sign`, {
      method: 'POST',
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

  async sendMessage(messageData: { receiverId: string; content: string; conversationId?: string }) {
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

  // Review endpoints
  async getReviews(userId: string) {
    return this.request(`/reviews?userId=${userId}`, {
      method: 'GET',
    });
  }

  async createReview(reviewData: any) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
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
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/community/leaderboard${queryString}`, {
      method: 'GET',
    });
  }

  async getBadges() {
    return this.request('/community/badges', {
      method: 'GET',
    });
  }

  async getEvents() {
    return this.request('/community/events', {
      method: 'GET',
    });
  }

  async getUserRank() {
    return this.request('/community/rank', {
      method: 'GET',
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

  // Verification endpoints
  async sendEmailVerification() {
    return this.request('/verify/email/send', {
      method: 'POST',
    });
  }

  async verifyEmail(token: string) {
    return this.request(`/verify/email/verify/${token}`, {
      method: 'GET',
    });
  }

  async sendPhoneOTP(phoneNumber: string) {
    return this.request('/verify/phone/send', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyPhoneOTP(phoneNumber: string, otp: string) {
    return this.request('/verify/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  }

  async submitIDVerification(formData: FormData) {
    return this.request('/verify/id/submit', {
      method: 'POST',
      headers: {},
      body: formData as any,
    });
  }

  async submitBiometricVerification(formData: FormData) {
    return this.request('/verify/biometric/verify', {
      method: 'POST',
      headers: {},
      body: formData as any,
    });
  }

  async connectLinkedIn(linkedinData: { profileUrl: string; profileData?: any }) {
    return this.request('/verify/social/linkedin', {
      method: 'POST',
      body: JSON.stringify(linkedinData),
    });
  }

  async connectGitHub(githubData: { username: string; profileData?: any }) {
    return this.request('/verify/social/github', {
      method: 'POST',
      body: JSON.stringify(githubData),
    });
  }

  async getVerificationStatus() {
    return this.request('/verify/status', {
      method: 'GET',
    });
  }

  async recalculateReputation() {
    return this.request('/verify/reputation/recalculate', {
      method: 'POST',
    });
  }

  // Reputation endpoints
  async getReputation(userId?: string) {
    const endpoint = userId ? `/verify/reputation/${userId}` : '/verify/reputation';
    return this.request(endpoint, {
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
  async uploadFile(file: File, folder?: string): Promise<{ url: string; publicId: string; width: number; height: number }> {
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
