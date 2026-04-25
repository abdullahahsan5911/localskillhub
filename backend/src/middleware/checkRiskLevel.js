/**
 * Middleware: Check risk level and restrict actions accordingly
 * 
 * Risk Levels:
 * - LOW: No restrictions
 * - MEDIUM: Cannot post jobs (must be approved by admin)
 * - HIGH: Cannot post jobs, cannot submit proposals
 */

export const checkRiskForJobPosting = (req, res, next) => {
  if (!req.user) {
    return next(new Error('Authentication required'));
  }

  const riskLevel = req.user.riskLevel || 'low';

  if (riskLevel === 'high') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been flagged with high risk. You cannot post jobs. Please contact support to resolve this issue.',
      code: 'HIGH_RISK_JOB_POSTING_BLOCKED'
    });
  }

  if (riskLevel === 'medium') {
    return res.status(403).json({
      success: false,
      message: 'Your account is under review. Job posting requires admin approval. Please contact support.',
      code: 'MEDIUM_RISK_JOB_POSTING_REQUIRES_APPROVAL'
    });
  }

  // Low risk - allow
  next();
};

export const checkRiskForProposalSubmission = (req, res, next) => {
  if (!req.user) {
    return next(new Error('Authentication required'));
  }

  const riskLevel = req.user.riskLevel || 'low';

  if (riskLevel === 'high') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been flagged with high risk. You cannot submit proposals at this time. Please contact support.',
      code: 'HIGH_RISK_PROPOSAL_BLOCKED'
    });
  }

  // Medium and Low can submit proposals
  next();
};

export const checkRiskForMessaging = (req, res, next) => {
  if (!req.user) {
    return next(new Error('Authentication required'));
  }

  const riskLevel = req.user.riskLevel || 'low';

  if (riskLevel === 'high') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been flagged with high risk. Messaging is restricted. Please contact support.',
      code: 'HIGH_RISK_MESSAGING_BLOCKED'
    });
  }

  // Medium and Low can message
  next();
};

export const checkRiskForPayments = (req, res, next) => {
  if (!req.user) {
    return next(new Error('Authentication required'));
  }

  const riskLevel = req.user.riskLevel || 'low';

  if (riskLevel === 'high') {
    return res.status(403).json({
      success: false,
      message: 'Your account has high risk. Payment transactions are restricted. Please contact support.',
      code: 'HIGH_RISK_PAYMENT_BLOCKED'
    });
  }

  // Medium - allow with warning (could log extra monitoring)
  // Low - no restrictions
  next();
};

/**
 * Middleware: Add risk assessment info to user object
 * Useful for conditional UI rendering
 */
export const enrichUserWithRiskInfo = (req, res, next) => {
  if (req.user) {
    const riskLevel = req.user.riskLevel || 'low';
    
    req.user.riskAssessment = {
      level: riskLevel,
      canPostJobs: riskLevel === 'low',
      canSubmitProposals: riskLevel !== 'high',
      canMessage: riskLevel !== 'high',
      canMakePayments: riskLevel !== 'high',
      status: 
        riskLevel === 'high' ? 'RESTRICTED' :
        riskLevel === 'medium' ? 'PENDING_APPROVAL' :
        'NORMAL'
    };
  }
  next();
};
