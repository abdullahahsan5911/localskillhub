// API Configuration and Service Layer
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null;

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
        throw new Error(data.message || 'API request failed');
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
    
    if (response.data && (response.data as any).token) {
      this.setToken((response.data as any).token);
    }
    
    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.data && (response.data as any).token) {
      this.setToken((response.data as any).token);
    }
    
    return response;
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
  async getJobs(params?: { category?: string; location?: string; search?: string; page?: number }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
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

  async getNearbyJobs(lat: number, lng: number, radius: number = 50) {
    return this.request(`/jobs/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
      method: 'GET',
    });
  }

  // Freelancer endpoints
  async getFreelancers(params?: { skills?: string; location?: string; page?: number }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
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

  async sendMessage(messageData: { conversationId: string; content: string }) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
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

  // Community endpoints
  async getLeaderboard(type: 'local' | 'global' = 'local', location?: string) {
    const queryString = location ? `?location=${location}` : '';
    return this.request(`/community/leaderboard/${type}${queryString}`, {
      method: 'GET',
    });
  }

  async getBadges(userId: string) {
    return this.request(`/community/badges/${userId}`, {
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
