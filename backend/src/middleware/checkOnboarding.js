/**
 * Middleware to check if user has completed onboarding
 * Optionally enforces onboarding completion for certain routes
 */

export const checkOnboarding = (options = {}) => {
  const { requireCompletion = false } = options;

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Let protect middleware handle unauthenticated users
    }

    const { onboarding, onboardingCompleted } = req.user;
    
    // Check new onboarding object or legacy field
    const isCompleted = onboarding?.completed || onboardingCompleted;
    const isSkipped = onboarding?.skipped;

    req.onboardingStatus = {
      completed: isCompleted,
      skipped: isSkipped,
      lastStep: onboarding?.lastStep || 1
    };

    // If route requires onboarding completion, block access if not completed AND not skipped
    if (requireCompletion && !isCompleted && !isSkipped) {
      return res.status(403).json({
        status: 'error',
        code: 'ONBOARDING_REQUIRED',
        message: 'Please complete onboarding to access this feature',
        data: {
          onboardingStatus: req.onboardingStatus,
          onboardingUrl: '/onboarding'
        }
      });
    }

    next();
  };
};

/**
 * Middleware to prevent access to onboarding if already completed
 */
export const preventOnboardingReentry = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const { onboarding, onboardingCompleted } = req.user;
  const isCompleted = onboarding?.completed || onboardingCompleted;

  if (isCompleted) {
    return res.status(400).json({
      status: 'error',
      message: 'Onboarding already completed',
      data: { redirectTo: '/' }
    });
  }

  next();
};
