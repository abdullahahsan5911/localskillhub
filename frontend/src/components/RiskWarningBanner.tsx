import { AlertTriangle, XCircle } from 'lucide-react';

interface RiskWarningBannerProps {
  riskLevel: 'low' | 'medium' | 'high';
  restrictedActions?: string[];
  compact?: boolean;
}

const RISK_CONFIG = {
  high: {
    title: 'Account Flagged',
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    badgeColor: 'bg-red-100 text-red-700',
    message: 'Your account has been flagged with high risk. You are currently restricted from performing the following actions:',
    actions: [
      '🚫 Posting new jobs',
      '🚫 Submitting proposals',
      '🚫 Sending messages',
      '🚫 Making payments'
    ]
  },
  medium: {
    title: 'Account Under Review',
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
    badgeColor: 'bg-amber-100 text-amber-700',
    message: 'Your account is under review. You have the following restrictions:',
    actions: [
      '⚠️ Job posting requires admin approval'
    ]
  },
  low: {
    title: 'Account Active',
    icon: null,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
    badgeColor: 'bg-green-100 text-green-700',
    message: 'Your account is in good standing.',
    actions: []
  }
};

export function RiskWarningBanner({ 
  riskLevel = 'low', 
  restrictedActions,
  compact = false 
}: RiskWarningBannerProps) {
  const config = RISK_CONFIG[riskLevel];
  const Icon = config.icon;

  if (riskLevel === 'low') return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
        {Icon && <Icon size={18} className={config.textColor} />}
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>{config.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-5`}>
      <div className="flex items-start gap-3 mb-4">
        {Icon && <Icon size={20} className={config.textColor} />}
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${config.textColor} mb-1`}>{config.title}</h3>
          <p className={`text-sm ${config.textColor} opacity-90`}>{config.message}</p>
        </div>
      </div>

      {(restrictedActions || config.actions).length > 0 && (
        <div className="space-y-2 ml-7">
          {(restrictedActions || config.actions).map((action, idx) => (
            <div key={idx} className={`flex items-center gap-2 text-sm ${config.textColor}`}>
              {action}
            </div>
          ))}
        </div>
      )}

      {riskLevel === 'medium' || riskLevel === 'high' ? (
        <div className={`mt-4 p-3 rounded-lg bg-white border ${config.borderColor}`}>
          <p className={`text-xs ${config.textColor}`}>
            <strong>Need help?</strong> Contact our support team at{' '}
            <a href="mailto:support@localskillhub.com" className="underline hover:no-underline">
              support@localskillhub.com
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Inline badge for displaying risk status
 */
export function RiskBadge({ riskLevel }: { riskLevel: 'low' | 'medium' | 'high' }) {
  if (riskLevel === 'low') return null;

  const config = RISK_CONFIG[riskLevel];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
      {config.icon && <config.icon size={14} />}
      {riskLevel === 'high' ? 'High Risk' : 'Under Review'}
    </span>
  );
}

/**
 * Action blocker component
 */
export function RiskBlockedAction({ 
  riskLevel, 
  action, 
  children 
}: { 
  riskLevel: 'low' | 'medium' | 'high'; 
  action: 'job' | 'proposal' | 'message' | 'payment';
  children: React.ReactNode;
}) {
  const isBlocked = () => {
    if (riskLevel === 'low') return false;
    if (riskLevel === 'high') return true; // All actions blocked
    if (riskLevel === 'medium' && action === 'job') return true; // Only job posting for medium
    return false;
  };

  const getMessage = () => {
    if (riskLevel === 'high') {
      const messages = {
        job: 'Your account is flagged. You cannot post jobs.',
        proposal: 'Your account is flagged. You cannot submit proposals.',
        message: 'Your account is flagged. You cannot send messages.',
        payment: 'Your account is flagged. You cannot make payments.'
      };
      return messages[action];
    }
    if (riskLevel === 'medium' && action === 'job') {
      return 'Job posting requires admin approval. Please contact support.';
    }
    return '';
  };

  if (!isBlocked()) return <>{children}</>;

  return (
    <div className="relative group">
      <div className="opacity-60 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 max-w-xs text-center">
          {getMessage()}
        </div>
      </div>
    </div>
  );
}
