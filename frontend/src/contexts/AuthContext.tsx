import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import api from '@/lib/api';
import { getGuestSavedJobs, clearGuestSavedJobs, getGuestFollows, clearGuestFollows } from '@/lib/guestStorage';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'client' | 'freelancer' | 'admin' ;
  accountType?: 'individual' | 'company';
  companyId?: string | null;
  avatar?: string;
  interests?: string[];
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  phone?: string;
  location?: any;
  onboardingCompleted?: boolean;
  provider?: 'local' | 'google' | 'github';
  verifiedBadges?: Array<{ type: string; verifiedAt: string }>;
  adminBadges?: Array<{ type: string; assignedAt: string; assignedBy: string }>;
  // Account status
  isBanned?: boolean;
  isSuspended?: boolean;
  suspendedUntil?: string | null;
  warningCount?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  // Optional relational fields returned from backend
  followers?: string[];
  following?: string[];
  savedJobs?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ emailVerificationRequired: boolean; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, password: string) => Promise<void>;
  requestPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (otp: string) => Promise<void>;
  resendPhoneOtp: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const saveSession = (userData: User, token: string) => {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', token);
  localStorage.setItem('isAuthenticated', 'true');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncGuestData = async (userData: User) => {
    try {
      const jobIds = getGuestSavedJobs();
      const followIds = getGuestFollows();

      if (jobIds.length === 0 && followIds.length === 0) return;

      const bookmarkPromises = jobIds.map((jobId) => api.bookmarkJob(jobId));
      const followPromises = followIds
        .filter((id) => id && id !== userData._id)
        .map((id) => api.followUser(id));

      if (bookmarkPromises.length || followPromises.length) {
        await Promise.all([...bookmarkPromises, ...followPromises]);
      }

      clearGuestSavedJobs();
      clearGuestFollows();

      // Refresh user so savedJobs/following from guest actions
      // are reflected in the dashboard immediately after login
      try {
        const response = await api.getMe();
        if (response.status === 'success' && response.data) {
          const updatedUser = (response.data as any).user;
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Failed to refresh user after syncing guest data:', err);
      }
    } catch (error) {
      console.error('Failed to sync guest saved data:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const isAuth = localStorage.getItem('isAuthenticated') === 'true';
        if (token && isAuth) {
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          }
          try {
            const response = await api.getMe();
            if (response.status === 'success' && response.data) {
              const userData = (response.data as any).user;
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch {
            api.clearToken();
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const applySession = (userData: User, token: string) => {
    if (token) api.setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    saveSession(userData, token);
    syncGuestData(userData);
  };

  // ── Email + Password Login ──────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      if (response.status === 'success') {
        const userData = (response.data as any)?.user;
        const token = (response as any).token;
        applySession(userData, token);
      }
    } catch (err: any) {
      // Pass through structured errors (e.g. EMAIL_NOT_VERIFIED)
      throw err;
    }
  };

  // ── Email + Password Register ───────────────────────────────
  const register = async (name: string, email: string, password: string) => {
    const response = await api.register({ name, email, password });
    // Backend returns { data: { emailVerificationRequired: true, email } }
    const data = (response.data as any) || (response as any).data || {};
    return {
      emailVerificationRequired: true,
      email: data.email || email,
    };
  };

  // ── OTP Verification ────────────────────────────────────────
  const verifyOtp = async (email: string, otp: string) => {
    const response = await api.verifyOtp({ email, otp });
    if (response.status === 'success') {
      const userData = (response.data as any)?.user;
      const token = (response as any).token;
      applySession(userData, token);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────
  const resendOtp = async (email: string) => {
    await api.resendOtp(email);
  };

   // ── Forgot / Reset Password via OTP ────────────────────────
  const forgotPassword = async (email: string) => {
    await api.forgotPassword(email);
  };

  const resetPassword = async (email: string, otp: string, password: string) => {
    await api.resetPassword({ email, otp, password });
  };

  // ── Phone Verification (Firebase OTP) ───────────────────────
  const requestPhoneOtp = async (phone: string) => {
    const response = await api.requestPhoneOtp(phone);
    if (response.status === 'success') {
      // Update user with phone number
      if (user) {
        setUser({ ...user, phone });
      }
    }
  };

  const verifyPhoneOtp = async (otp: string) => {
    const response = await api.verifyPhoneOtp(otp);
    if (response.status === 'success') {
      const userData = (response.data as any)?.user;
      if (userData) {
        applySession(userData, (response as any).token || localStorage.getItem('token'));
      }
    }
  };

  const resendPhoneOtp = async () => {
    await api.resendPhoneOtp();
  };

  // ── Google OAuth ────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      const response = await api.oauthLogin({ idToken, provider: 'google' });
      if (response.status === 'success') {
        const userData = (response.data as any)?.user;
        const token = (response as any).token;
        applySession(userData, token);
      }
    } catch (error: any) {
      await signOut(auth).catch(() => {});
      throw error;
    }
  };

  // ── GitHub OAuth ────────────────────────────────────────────
  const loginWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      const response = await api.oauthLogin({ idToken, provider: 'github' });
      if (response.status === 'success') {
        const userData = (response.data as any)?.user;
        const token = (response as any).token;
        applySession(userData, token);
      }
    } catch (error: any) {
      await signOut(auth).catch(() => {});
      throw error;
    }
  };

  // ── Logout ──────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('onboarding');
    api.clearToken();
    signOut(auth).catch(() => {});
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.getMe();
      if (response.status === 'success' && response.data) {
        const userData = (response.data as any).user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user, isAuthenticated, isLoading,
        login, register, verifyOtp, resendOtp,
        forgotPassword, resetPassword,
        requestPhoneOtp, verifyPhoneOtp, resendPhoneOtp,
        loginWithGoogle, loginWithGithub,
        logout, updateUser, refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
