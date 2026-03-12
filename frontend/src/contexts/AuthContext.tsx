import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'client' | 'freelancer' | 'both';
  avatar?: string;
  interests?: string[];
  isEmailVerified?: boolean;
  location?: any;
  onboardingCompleted?: boolean;
  provider?: 'local' | 'google' | 'github';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ emailVerificationRequired: boolean; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
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
