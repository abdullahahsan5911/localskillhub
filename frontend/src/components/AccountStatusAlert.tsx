import { AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AccountStatusAlert() {
  const { user } = useAuth();

  if (!user) return null;

  // Show banner if user is banned
  if (user.isBanned) {
    return (
      <div className="bg-red-50 border-b-2 border-red-500 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold">Your account has been banned</p>
            <p className="text-red-700 text-sm">You cannot perform any activities. Please contact support@localskillhub.com for more information.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show banner if user is suspended
  if (user.isSuspended) {
    const suspendedUntil = user.suspendedUntil 
      ? new Date(user.suspendedUntil).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'indefinitely';

    return (
      <div className="bg-orange-50 border-b-2 border-orange-500 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-orange-800 font-semibold">Your account is temporarily suspended</p>
            <p className="text-orange-700 text-sm">
              You can still login but cannot post jobs, submit proposals, or send messages until {suspendedUntil}.
              {user.riskLevel && (
                <span> Risk Level: <strong>{user.riskLevel.toUpperCase()}</strong></span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if user has high warning count
  if (user.warningCount && user.warningCount > 0) {
    return (
      <div className="bg-yellow-50 border-b-2 border-yellow-500 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-800 font-semibold">Account Warning</p>
            <p className="text-yellow-700 text-sm">
              You have {user.warningCount} warning{user.warningCount > 1 ? 's' : ''} on your account. 
              {user.riskLevel === 'high' && ' You are at high risk of suspension. Please follow community guidelines.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
