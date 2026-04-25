import { useState } from 'react';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OnboardingReminderProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

export const OnboardingReminder = ({ isVisible, onDismiss }: OnboardingReminderProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (!isVisible || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-3 md:p-4">
      <div className="max-w-7xl mx-auto flex items-start md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 md:mt-0 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Complete your profile setup
            </p>
            <p className="text-xs text-amber-800 mt-0.5 hidden sm:block">
              Finish your onboarding to unlock all features and improve your visibility
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
          >
            Complete
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
            aria-label="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
