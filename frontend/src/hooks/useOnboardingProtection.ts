import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UseOnboardingProtectionOptions {
  requireCompletion?: boolean;
  redirectTo?: string;
  message?: string;
}

/**
 * Hook to protect routes that require onboarding completion
 * Can optionally enforce onboarding or just warn the user
 */
export const useOnboardingProtection = (options: UseOnboardingProtectionOptions = {}) => {
  const { requireCompletion = false, redirectTo = '/onboarding', message } = options;
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const isCompleted = user.onboardingCompleted;
    
    // If route requires completion and user hasn't completed, redirect
    if (requireCompletion && !isCompleted) {
      if (message) {
        console.warn(message);
      }
      navigate(redirectTo, { replace: true });
    }
  }, [user, requireCompletion, redirectTo, navigate, message]);

  return {
    isOnboardingComplete: user?.onboardingCompleted ?? false,
    user
  };
};
