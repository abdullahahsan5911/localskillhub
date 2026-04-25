import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedDashboardRouteProps {
  children: React.ReactNode;
  allowSkipped?: boolean; // if true, allow access even if skipped (just show reminder)
}

/**
 * Protects dashboard routes from users who haven't completed onboarding
 * - Admins always get access
 * - Non-admins must complete OR skip onboarding
 * - If allowSkipped=true, user can access but will see reminder
 */
export const ProtectedDashboardRoute = ({ 
  children, 
  allowSkipped = true 
}: ProtectedDashboardRouteProps) => {
  const { user } = useAuth();

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins always get access (no onboarding needed)
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  // For non-admins, check onboarding
  const isOnboardingComplete = user.onboardingCompleted;
  const isOnboardingSkipped = (user as any).onboarding?.skipped;

  // If not complete and not skipped, redirect to onboarding
  if (!isOnboardingComplete && !isOnboardingSkipped) {
    return <Navigate to="/onboarding" replace />;
  }

  // If skipped but allowSkipped=false, also redirect
  if (isOnboardingSkipped && !allowSkipped) {
    return <Navigate to="/onboarding" replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedDashboardRoute;
