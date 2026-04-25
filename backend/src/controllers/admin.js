import User from '../models/User.js';
import Job from '../models/Job.js';
import Contract from '../models/Contract.js';
import Review from '../models/Review.js';
import Reputation from '../models/Reputation.js';
import VerificationRequest from '../models/VerificationRequest.js';
import AdminAction from '../models/AdminAction.js';
import AdminNotification from '../models/AdminNotification.js';
import Dispute from '../models/Dispute.js';
import PlatformSettings from '../models/PlatformSettings.js';
import Community from '../models/Community.js';
import Transaction from '../models/Transaction.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import ReputationService from '../services/reputation.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { clearCache } from '../middleware/cache.js';
import stripe from '../config/stripe.js';
import { getStripeCurrency } from '../config/currency.js';

// Helper to get the freelancer's net payout for a transaction
const getNetPayoutAmount = (tx) => {
  if (!tx) return 0;
  if (typeof tx.netAmount === 'number' && tx.netAmount > 0) return tx.netAmount;
  const amount = typeof tx.amount === 'number' ? tx.amount : 0;
  const platformFee = typeof tx.platformFee === 'number' ? tx.platformFee : 0;
  return Math.max(amount - platformFee, 0);
};

// ─── Helper: Log Admin Action ──────────────────────────────────────────────
const logAction = async (adminId, actionType, targetId, targetType, reason, metadata = {}) => {
  try {
    await AdminAction.create({ adminId, actionType, targetId, targetType, reason, metadata });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// ─── Helper: Auto Risk Evaluation ─────────────────────────────────────────
const evalRisk = (user, settings) => {
  if (!user) return 'low';
  const reportThreshold = settings?.autoFlagReportCount || 3;
  if (user.reportCount >= reportThreshold) return 'high';
  if (user.warningCount >= 2) return 'medium';
  return 'low';
};

const FEATURED_VISUALIZATION_REQUIREMENTS = {
  minLocalScore: 80,
  minCompletedJobs: 10,
  minAverageRating: 4.5,
};

const getFeaturedVisualizationEligibility = (profile) => {
  if (!profile) {
    return {
      eligible: false,
      requirements: FEATURED_VISUALIZATION_REQUIREMENTS,
      metrics: {
        localScore: 0,
        completedJobs: 0,
        averageRating: 0,
      },
      reasons: ['Freelancer profile not found.'],
    };
  }

  const localScore = Number(profile.localScore || 0);
  const completedJobs = Number(profile.completedJobs || 0);
  const averageRating = Number(profile.ratings?.average || 0);

  const reasons = [];
  if (localScore < FEATURED_VISUALIZATION_REQUIREMENTS.minLocalScore) {
    reasons.push(`Local score must be at least ${FEATURED_VISUALIZATION_REQUIREMENTS.minLocalScore}.`);
  }
  if (completedJobs < FEATURED_VISUALIZATION_REQUIREMENTS.minCompletedJobs) {
    reasons.push(`Completed jobs must be at least ${FEATURED_VISUALIZATION_REQUIREMENTS.minCompletedJobs}.`);
  }
  if (averageRating < FEATURED_VISUALIZATION_REQUIREMENTS.minAverageRating) {
    reasons.push(`Average rating must be at least ${FEATURED_VISUALIZATION_REQUIREMENTS.minAverageRating}.`);
  }

  return {
    eligible: reasons.length === 0,
    requirements: FEATURED_VISUALIZATION_REQUIREMENTS,
    metrics: { localScore, completedJobs, averageRating },
    reasons,
  };
};

// ══════════════════════════════════════════════════════════════════
// 1. ANALYTICS
// ══════════════════════════════════════════════════════════════════

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, newUsers30d, totalJobs, activeJobs, completedJobs,
      totalContracts, disputedContracts, activeContracts,
      totalRevenue, bannedUsers, pendingVerifications,
      flaggedJobs, openDisputes, totalCommunities
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: thirtyDaysAgo } }),
      Job.countDocuments({ isDeleted: { $ne: true } }),
      Job.countDocuments({ status: 'open', isDeleted: { $ne: true } }),
      Job.countDocuments({ status: 'completed' }),
      Contract.countDocuments({}),
      Contract.countDocuments({ status: 'disputed' }),
      Contract.countDocuments({ status: 'active' }),
      Contract.aggregate([{ $group: { _id: null, total: { $sum: '$platformFee.amount' } } }]),
      User.countDocuments({ isBanned: true }),
      VerificationRequest.countDocuments({ status: 'pending' }),
      Job.countDocuments({ isFlagged: true }),
      Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } }),
      Community.countDocuments({})
    ]);

    // Freelancers vs Clients
    const roleBreakdown = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // GMV - total contract amounts
    const gmvAgg = await Contract.aggregate([
      { $match: { status: { $in: ['completed', 'active'] } } },
      { $group: { _id: null, gmv: { $sum: '$amount.total' } } }
    ]);

    // Regional insights - top cities (clients/freelancers)
    const topCities = await User.aggregate([
      { $match: { 'location.city': { $exists: true, $ne: null } } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Jobs by category
    const jobsByCategory = await Job.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Monthly signups trend (last 6 months)
    const signupTrend = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(now - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // High risk users count
    const highRiskUsers = await User.countDocuments({ riskLevel: 'high' });
    const mediumRiskUsers = await User.countDocuments({ riskLevel: 'medium' });

    // Aggregate processing (Stripe) fees from Transaction ledger
    const processingAgg = await Transaction.aggregate([
      { $match: { processingFee: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$processingFee' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsers30d,
          bannedUsers,
          pendingVerifications,
          highRiskUsers,
          mediumRiskUsers,
          totalCommunities
        },
        marketplace: {
          totalJobs, activeJobs, completedJobs,
          flaggedJobs,
          conversionRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : 0
        },
        contracts: {
          totalContracts, activeContracts, disputedContracts,
          openDisputes,
          disputeRate: totalContracts > 0 ? ((disputedContracts / totalContracts) * 100).toFixed(1) : 0
        },
        revenue: {
          gmv: gmvAgg[0]?.gmv || 0,
          platformFees: totalRevenue[0]?.total || 0,
          processingFees: processingAgg[0]?.total || 0,
        },
        insights: {
          roleBreakdown,
          topCities,
          jobsByCategory,
          signupTrend
        }
      }
    });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 2. USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════

export const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, role, riskLevel, isBanned,
      isSuspended, verification, search, sortBy = 'createdAt', order = 'desc'
    } = req.query;

    const filter = { role: { $ne: 'admin' } };
    if (role) filter.role = role;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (isBanned !== undefined) filter.isBanned = isBanned === 'true';
    if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash -emailOtp -emailOtpExpiry -resetPasswordOtp -resetPasswordOtpExpiry')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
    });
  } catch (err) { next(err); }
};

export const getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash -emailOtp -emailOtpExpiry -resetPasswordOtp -resetPasswordOtpExpiry');
    if (!user) return next(new AppError('User not found', 404));

    const userObj = user.toObject();
    let freelancerProfile = null;
    if (user.role === 'freelancer') {
      freelancerProfile = await FreelancerProfile.findOne({ userId: req.params.id })
        .select('_id localScore completedJobs ratings');
      userObj.freelancerProfile = freelancerProfile;
      userObj.featuredVisualizationEligibility = getFeaturedVisualizationEligibility(freelancerProfile);
    }

    const [jobs, contracts, reviews, reputation, verifications, auditLogs] = await Promise.all([
      Job.find({ clientId: req.params.id }).sort({ createdAt: -1 }).limit(10),
      Contract.find({ $or: [{ clientId: req.params.id }, { freelancerId: req.params.id }] })
        .sort({ createdAt: -1 }).limit(10),
      Review.find({ reviewedUserId: req.params.id }).sort({ createdAt: -1 }).limit(10),
      Reputation.findOne({ userId: req.params.id }),
      VerificationRequest.find({ userId: req.params.id }).sort({ createdAt: -1 }),
      AdminAction.find({ targetId: req.params.id, targetType: 'user' }).sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      success: true,
      data: { user: userObj, jobs, contracts, reviews, reputation, verifications, auditLogs }
    });
  } catch (err) { next(err); }
};

export const banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Ban reason is required', 400));

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, isSuspended: false, isActive: false, suspensionReason: reason },
      { new: true }
    );
    if (!user) return next(new AppError('User not found', 404));

    await logAction(req.user._id, 'BAN_USER', user._id, 'user', reason, { name: user.name, email: user.email });
    res.json({ success: true, message: 'User banned', data: user });
  } catch (err) { next(err); }
};

export const unbanUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, isSuspended: false, isActive: true, suspensionReason: null },
      { new: true }
    );
    if (!user) return next(new AppError('User not found', 404));
    await logAction(req.user._id, 'UNBAN_USER', user._id, 'user', reason || 'Admin activation');
    res.json({ success: true, message: 'User activated', data: user });
  } catch (err) { next(err); }
};

export const suspendUser = async (req, res, next) => {
  try {
    const { reason, suspendedUntil } = req.body;
    if (!reason) return next(new AppError('Suspension reason is required', 400));

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true, isActive: false, suspensionReason: reason, suspendedUntil: suspendedUntil || null },
      { new: true }
    );
    if (!user) return next(new AppError('User not found', 404));
    await logAction(req.user._id, 'SUSPEND_USER', user._id, 'user', reason, { suspendedUntil });
    res.json({ success: true, message: 'User suspended', data: user });
  } catch (err) { next(err); }
};

/**
 * Remove suspension from user (unsuspend)
 */
export const removeSuspension = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false, isActive: true, suspensionReason: null, suspendedUntil: null },
      { new: true }
    );
    if (!user) return next(new AppError('User not found', 404));
    await logAction(req.user._id, 'REMOVE_SUSPENSION', user._id, 'user', 'Suspension removed');
    res.json({ success: true, message: 'User suspension removed', data: user });
  } catch (err) { next(err); }
};

export const warnUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Warning reason is required', 400));

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    // Store old risk level to detect changes
    const oldRiskLevel = user.riskLevel;

    // Add warning to warnings array
    user.warnings.push({
      reason,
      issuedBy: req.user._id
    });
    user.warningCount = user.warnings.length;

    // Auto-upgrade risk level
    const settings = await PlatformSettings.findOne();
    user.riskLevel = evalRisk(user, settings);
    await user.save();

    await logAction(req.user._id, 'WARN_USER', user._id, 'user', reason);
    
    // Send notification if risk level changed
    if (oldRiskLevel !== user.riskLevel) {
      try {
        const { sendRiskLevelNotification } = await import('../services/email.service.js');
        await sendRiskLevelNotification(user.email, user.name, user.riskLevel, `Warning issued: ${reason}`);
      } catch (emailErr) {
        console.error('Failed to send risk level notification email:', emailErr);
      }
    }
    
    res.json({ success: true, message: 'Warning issued', data: user });
  } catch (err) { next(err); }
};

/**
 * Remove warning from user
 */
export const removeWarning = async (req, res, next) => {
  try {
    const { warningIndex } = req.body;
    if (warningIndex === undefined) return next(new AppError('Warning index is required', 400));

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    if (warningIndex < 0 || warningIndex >= user.warnings.length) {
      return next(new AppError('Invalid warning index', 400));
    }

    const removedWarning = user.warnings[warningIndex];
    const oldRiskLevel = user.riskLevel;
    
    user.warnings.splice(warningIndex, 1);
    user.warningCount = user.warnings.length;

    // Recalculate risk level
    const settings = await PlatformSettings.findOne();
    user.riskLevel = evalRisk(user, settings);
    await user.save();

    await logAction(req.user._id, 'REMOVE_WARNING', user._id, 'user', `Removed warning: ${removedWarning.reason}`);
    
    // Send notification if risk level improved
    if (oldRiskLevel !== user.riskLevel) {
      try {
        const { sendRiskLevelNotification } = await import('../services/email.service.js');
        await sendRiskLevelNotification(user.email, user.name, user.riskLevel, `Warning removed: ${removedWarning.reason}`);
      } catch (emailErr) {
        console.error('Failed to send risk level notification email:', emailErr);
      }
    }
    
    res.json({ success: true, message: 'Warning removed', data: user });
  } catch (err) { next(err); }
};

export const setRiskLevel = async (req, res, next) => {
  try {
    const { riskLevel, reason } = req.body;
    if (!['low', 'medium', 'high'].includes(riskLevel)) return next(new AppError('Invalid risk level', 400));

    const user = await User.findByIdAndUpdate(req.params.id, { riskLevel }, { new: true });
    if (!user) return next(new AppError('User not found', 404));
    
    await logAction(req.user._id, 'SET_RISK_LEVEL', user._id, 'user', reason, { riskLevel });
    
    // Send risk level notification email
    try {
      const { sendRiskLevelNotification } = await import('../services/email.service.js');
      await sendRiskLevelNotification(user.email, user.name, riskLevel, reason);
    } catch (emailErr) {
      console.error('Failed to send risk level notification email:', emailErr);
      // Don't fail the request if email fails
    }
    
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const addAdminNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { adminNotes: note }, { new: true });
    if (!user) return next(new AppError('User not found', 404));
    await logAction(req.user._id, 'ADD_ADMIN_NOTE', user._id, 'user', 'Admin note updated');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const assignBadge = async (req, res, next) => {
  try {
    const { badgeType, action } = req.body;
    const validBadges = ['verified', 'top_freelancer', 'rising_talent', 'local_verified', 'trusted_client', 'featured_visualization'];
    if (!validBadges.includes(badgeType)) return next(new AppError('Invalid badge type', 400));

    if (action === 'add') {
      if (badgeType === 'featured_visualization') {
        const user = await User.findById(req.params.id).select('role');
        if (!user) return next(new AppError('User not found', 404));
        if (user.role !== 'freelancer') {
          return next(new AppError('Featured visualization badge can only be assigned to freelancers', 400));
        }

        const profile = await FreelancerProfile.findOne({ userId: req.params.id })
          .select('localScore completedJobs ratings');
        const eligibility = getFeaturedVisualizationEligibility(profile);

        if (!eligibility.eligible) {
          return next(new AppError(`Freelancer is not eligible for featured visualization badge. ${eligibility.reasons.join(' ')}`, 400));
        }
      }

      // Use findOneAndUpdate to bypass validation of unrelated fields (e.g. legacy coordinates)
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.params.id, 'adminBadges.type': { $ne: badgeType } },
        { 
          $push: { 
            adminBadges: { 
              type: badgeType, 
              assignedBy: req.user._id,
              assignedAt: new Date()
            } 
          } 
        },
        { new: true }
      );

      // If updatedUser is null, it means either user not found OR condition failed (badge exists)
      // So verify if user exists to return correct error or just return current state
      if (!updatedUser) {
        const user = await User.findById(req.params.id);
        if (!user) return next(new AppError('User not found', 404));
        return res.json({ success: true, data: user });
      }

      await logAction(req.user._id, 'ASSIGN_BADGE', updatedUser._id, 'user', null, { badgeType });
      await clearCache('cache:*/api/freelancers*');
      return res.json({ success: true, data: updatedUser });

    } else if (action === 'remove') {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $pull: { adminBadges: { type: badgeType } } },
        { new: true }
      );

      if (!updatedUser) return next(new AppError('User not found', 404));

      await logAction(req.user._id, 'REMOVE_BADGE', updatedUser._id, 'user', null, { badgeType });
      await clearCache('cache:*/api/freelancers*');
      return res.json({ success: true, data: updatedUser });
    }
    
    // Fallback if action is unknown (should be validated earlier but safe)
    res.json({ success: false, message: 'Invalid action' });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 3. VERIFICATION
// ══════════════════════════════════════════════════════════════════

export const getAllVerifications = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20, type } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (type) filter.type = type;

    const total = await VerificationRequest.countDocuments(filter);
    const verifications = await VerificationRequest.find(filter)
      .populate('userId', 'name email avatar role')
      .populate('companyId', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true, data: verifications,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
};

export const approveVerification = async (req, res, next) => {
  try {
    const { badgeType } = req.body;
    const vr = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate('userId');
    if (!vr) return next(new AppError('Verification request not found', 404));

    // Add verified badge to user
    if (vr.userId) {
      let badge;
      if (badgeType) {
        badge = badgeType;
      } else if (vr.type === 'verified_badge') {
        badge = 'verified';
      } else {
        // Determine badge type based on verification type
        if (vr.type === 'identity') badge = 'id';
        else if (vr.type === 'company') badge = 'employer';
        else if (vr.type === 'github') badge = 'github';
        else badge = 'selfie';
      }
      
      await User.findByIdAndUpdate(vr.userId._id, {
        $push: { verifiedBadges: { type: badge, verifiedAt: new Date(), verifiedBy: req.user._id.toString() } }
      });
    }

    await logAction(req.user._id, 'APPROVE_VERIFICATION', vr._id, 'verification', 'Approved', { userId: vr.userId?._id });

    // Send notification
    try {
      if (vr.userId) {
        await AdminNotification.create({
          userId: vr.userId?._id,
          type: 'verification_approved',
          title: 'Verification Approved',
          message: 'Your verification application has been approved. You now have a verified badge.',
          severity: 'info',
          icon: 'check-circle'
        });
      }
    } catch (notifErr) {
      console.error('Failed to send verification approval notification:', notifErr);
    }

    res.json({ success: true, message: 'Verification approved', data: vr });
  } catch (err) { next(err); }
};

export const rejectVerification = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Rejection reason is required', 400));

    const vr = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    if (!vr) return next(new AppError('Verification request not found', 404));
    await logAction(req.user._id, 'REJECT_VERIFICATION', vr._id, 'verification', reason);
    
    // Send notification
    try {
      if (vr.userId) {
        await AdminNotification.create({
          userId: vr.userId,
          type: 'verification_rejected',
          title: 'Verification Rejected',
          message: `Your verification application was rejected: ${reason}`,
          severity: 'warning',
          icon: 'x-circle'
        });
      }
    } catch (notifErr) {
      console.error('Failed to send verification rejection notification:', notifErr);
    }

    res.json({ success: true, message: 'Verification rejected', data: vr });
  } catch (err) { next(err); }
};

export const requestReupload = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Reason for re-upload is required', 400));

    const vr = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'pending', rejectionReason: reason },
      { new: true }
    );
    if (!vr) return next(new AppError('Verification request not found', 404));
    await logAction(req.user._id, 'REQUEST_REUPLOAD', vr._id, 'verification', reason);
    res.json({ success: true, message: 'Re-upload requested', data: vr });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 4. JOB MODERATION
// ══════════════════════════════════════════════════════════════════

export const getAllJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, isFlagged, search, category } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (isFlagged !== undefined) filter.isFlagged = isFlagged === 'true';
    if (category) filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('clientId', 'name email avatar riskLevel')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Auto-sync job status with related contracts: if any job has a completed
    // contract, ensure its status is "completed" in DB and in the response.
    try {
      const pendingJobs = jobs.filter((j) => j.status !== 'completed');
      if (pendingJobs.length > 0) {
        const jobIds = pendingJobs.map((j) => j._id);
        const completedContracts = await Contract.find({
          jobId: { $in: jobIds },
          status: 'completed',
        }).select('jobId');

        const completedJobIds = Array.from(
          new Set(completedContracts.map((c) => c.jobId.toString()))
        );

        if (completedJobIds.length > 0) {
          await Job.updateMany(
            { _id: { $in: completedJobIds } },
            { status: 'completed' }
          );

          jobs.forEach((j) => {
            if (completedJobIds.includes(j._id.toString())) {
              j.status = 'completed';
            }
          });
        }
      }
    } catch (syncErr) {
      console.error('Failed to auto-sync job status with contracts:', syncErr?.message || syncErr);
    }

    res.json({
      success: true, data: jobs,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
};

export const flagJob = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Flag reason is required', 400));

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { isFlagged: true, flagReason: reason, flaggedAt: new Date() },
      { new: true }
    ).populate('clientId', '_id name email');
    
    if (!job) return next(new AppError('Job not found', 404));
    
    // Notify job client with personal notification
    if (job.clientId) {
      try {
        const AdminNotification = (await import('../models/AdminNotification.js')).default;
        
        await AdminNotification.create({
          userId: job.clientId._id,
          type: 'job_flagged',
          title: '🚩 Job Flagged for Review',
          message: `Your job "${job.title}" has been flagged for review: ${reason}`,
          severity: 'warning',
          icon: '🚩',
          jobId: job._id,
          jobTitle: job.title,
          reason: reason
        });

        // Send real-time notification only to that user
        const io = req.app.get('io');
        if (io) {
          io.to(job.clientId._id.toString()).emit('adminNotification', {
            type: 'job_flagged',
            title: '🚩 Job Flagged for Review',
            message: `Your job "${job.title}" has been flagged for review`,
            jobId: job._id,
            jobTitle: job.title,
            severity: 'warning'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to notify client about flagged job:', notifyErr.message);
      }
    }
    
    await logAction(req.user._id, 'FLAG_JOB', job._id, 'job', reason, { title: job.title });
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

export const unflagJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { isFlagged: false, flagReason: null, flaggedAt: null },
      { new: true }
    );
    if (!job) return next(new AppError('Job not found', 404));
    await logAction(req.user._id, 'UNFLAG_JOB', job._id, 'job', 'Unflagged by admin');
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

export const featureJob = async (req, res, next) => {
  try {
    const { isFeatured } = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, { isFeatured }, { new: true });
    if (!job) return next(new AppError('Job not found', 404));
    await logAction(req.user._id, 'FEATURE_JOB', job._id, 'job', null, { isFeatured });
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Deletion reason is required', 400));

    const job = await Job.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true, status: 'closed' }, 
      { new: true }
    ).populate('clientId', '_id name email');
    
    if (!job) return next(new AppError('Job not found', 404));
    
    // Notify job client with personal notification
    if (job.clientId) {
      try {
        const AdminNotification = (await import('../models/AdminNotification.js')).default;
        
        await AdminNotification.create({
          userId: job.clientId._id,
          type: 'job_deleted',
          title: '❌ Job Deleted',
          message: `Your job "${job.title}" has been deleted from the platform. Reason: ${reason}`,
          severity: 'danger',
          icon: '❌',
          jobId: job._id,
          jobTitle: job.title,
          reason: reason
        });

        // Send real-time notification only to that user
        const io = req.app.get('io');
        if (io) {
          io.to(job.clientId._id.toString()).emit('adminNotification', {
            type: 'job_deleted',
            title: '❌ Job Deleted',
            message: `Your job "${job.title}" has been deleted from the platform`,
            jobId: job._id,
            jobTitle: job.title,
            severity: 'danger'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to notify client about deleted job:', notifyErr.message);
      }
    }
    
    await logAction(req.user._id, 'DELETE_JOB', job._id, 'job', reason, { title: job.title });
    res.json({ success: true, message: 'Job removed' });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 5. CONTRACTS & DISPUTES
// ══════════════════════════════════════════════════════════════════

export const getAllContracts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      offerStatus,
      hiringOnly,
    } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (offerStatus) filter.offerStatus = offerStatus;
    if (hiringOnly === 'true') filter.isHiringRequest = true;

    const total = await Contract.countDocuments(filter);
    const contracts = await Contract.find(filter)
      .populate('clientId', 'name email avatar')
      .populate('freelancerId', 'name email avatar')
      .populate('jobId', 'title category')
      .populate('hiringContext.companyId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true, data: contracts,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
};

export const getContractDetail = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('clientId', 'name email avatar riskLevel')
      .populate('freelancerId', 'name email avatar riskLevel')
      .populate('jobId', 'title category budget')
      .populate('hiringContext.companyId', 'name logo');
    if (!contract) return next(new AppError('Contract not found', 404));

    const [dispute, reviews] = await Promise.all([
      Dispute.findOne({ contractId: req.params.id }),
      Review.find({ contractId: req.params.id }).populate('reviewerId', 'name avatar')
    ]);

    res.json({ success: true, data: { contract, dispute, reviews } });
  } catch (err) { next(err); }
};

// Get contract earnings breakdown with real Stripe data
const buildContractEarningsSnapshot = (contract, transaction) => {
  const jobPrice = transaction?.amount ?? contract.amount?.total ?? 0;
  const currency = contract.amount?.currency || 'USD';
  const platformFeeAmount = transaction?.platformFee ?? contract.platformFee?.amount ?? 0;
  const platformFeePercentage = contract.platformFee?.percentage ?? null;
  const processingFee = transaction?.processingFee ?? 0;
  const clientTotal = transaction?.clientTotal ?? (jobPrice + processingFee);
  const stripeProcessingFee = transaction?.actualStripeFee ?? 0;

  return {
    contractAmount: jobPrice,
    currency,
    platformFeePercentage: platformFeePercentage ?? undefined,
    platformFeeAmount,
    freelancerNetAmount: jobPrice - platformFeeAmount,
    processingFee,
    clientTotal,
    stripeProcessingFee,
    stripeProcessingFeePercentage: jobPrice > 0 && stripeProcessingFee > 0
      ? (stripeProcessingFee / jobPrice) * 100
      : 0,
    adminEarningsAfterStripe: platformFeeAmount - stripeProcessingFee,
    stripeChargeId: transaction?.stripeChargeId || null,
    paymentStatus: contract.paymentStatus,
    transactionStatus: transaction?.status,
  };
};

export const getContractEarnings = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('freelancerId', 'name email');
    if (!contract) return next(new AppError('Contract not found', 404));

    // Fetch transaction to get Stripe charge + financial truth for this contract
    const transaction = await Transaction.findOne({ contractId: req.params.id });
    const earnings = buildContractEarningsSnapshot(contract, transaction);

    // If we don't yet have an actualStripeFee stored but there is a Stripe charge,
    // fetch the fee from the balance_transaction and persist it for future reads.
    if (transaction && earnings.stripeProcessingFee === 0 && transaction.stripeChargeId && stripe) {
      try {
        const charge = await stripe.charges.retrieve(transaction.stripeChargeId, {
          expand: ['balance_transaction'],
        });

        const bt = charge && charge.balance_transaction;
        if (bt && typeof bt.fee === 'number') {
          const fee = bt.fee / 100;
          earnings.stripeProcessingFee = fee;
          // Persist for next time so we don't need to hit Stripe again.
          transaction.actualStripeFee = fee;
          await transaction.save();
        }
      } catch (stripeErr) {
        console.error(
          `⚠️ Failed to fetch Stripe charge ${transaction.stripeChargeId}:`,
          stripeErr && stripeErr.message ? stripeErr.message : stripeErr
        );
      }
    }

    if (earnings.contractAmount > 0 && earnings.stripeProcessingFee > 0) {
      earnings.stripeProcessingFeePercentage =
        (earnings.stripeProcessingFee / earnings.contractAmount) * 100;
    }

    earnings.adminEarningsAfterStripe = earnings.platformFeeAmount - earnings.stripeProcessingFee;

    res.json({
      success: true,
      data: {
        contract: {
          _id: contract._id,
          title: contract.title,
          status: contract.status,
          clientId: contract.clientId,
          freelancerId: contract.freelancerId,
        },
        earnings,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const forceReleaseEscrow = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Reason is required for escrow release', 400));

    const contract = await Contract.findById(req.params.id);
    if (!contract) return next(new AppError('Contract not found', 404));

    // Determine platform fee from settings
    const settings = await PlatformSettings.findOne();
    const platformFeePercentage = settings?.platformFeePercentage || 3;
    const contractTotal = contract.amount?.total || 0;
    const platformFee = (contractTotal * platformFeePercentage) / 100;
    const freelancerNet = contractTotal - platformFee;

    // Fetch the linked transaction record
    const transaction = await Transaction.findOne({ contractId: contract._id });

    let stripeTransferResult = null;
    let stripeError = null;

    // ── Real Stripe Transfer to freelancer ────────────────────────
    if (stripe && transaction?.stripeChargeId && freelancerNet > 0) {
      try {
        const freelancerProfile = await FreelancerProfile.findOne({ userId: contract.freelancerId });
        if (freelancerProfile?.stripeAccountId && freelancerProfile?.payoutsEnabled) {
          const currency = getStripeCurrency(contract.amount?.currency);
          const amountMinorUnits = Math.round(freelancerNet * 100);
          const transfer = await stripe.transfers.create({
            amount: amountMinorUnits,
            currency,
            destination: freelancerProfile.stripeAccountId,
            source_transaction: transaction.stripeChargeId,
            metadata: {
              contractId: contract._id.toString(),
              adminRelease: 'true',
              platformFeePercentage: String(platformFeePercentage),
              reason,
            },
          });
          stripeTransferResult = transfer.id;

          // Update transaction record with real Stripe data
          if (transaction) {
            transaction.status = 'released';
            transaction.payoutStatus = 'paid_out';
            transaction.stripeTransferId = transfer.id;
            transaction.platformFee = platformFee;
            transaction.netAmount = freelancerNet;
            await transaction.save();
          }
        } else {
          stripeError = 'Freelancer has not completed Stripe onboarding — DB status updated but no transfer sent.';
          // Still update transaction status so the platform state is consistent
          if (transaction) {
            transaction.status = 'released';
            transaction.platformFee = platformFee;
            transaction.netAmount = freelancerNet;
            await transaction.save();
          }
        }
      } catch (stripeErr) {
        stripeError = stripeErr.message || 'Stripe transfer failed';
        console.error('⚠️ Stripe transfer failed during admin force-release:', stripeErr.message);
        // Still mark transaction released in DB so admin action is recorded
        if (transaction) {
          transaction.status = 'released';
          transaction.platformFee = platformFee;
          transaction.netAmount = freelancerNet;
          await transaction.save();
        }
      }
    } else if (transaction && transaction.status !== 'released') {
      // No Stripe charge on record — just update DB
      transaction.status = 'released';
      transaction.platformFee = platformFee;
      transaction.netAmount = freelancerNet;
      await transaction.save();
    }

    // Update contract
    await Contract.findByIdAndUpdate(
      contract._id,
      { paymentStatus: 'released', status: 'completed', actualEndDate: new Date() },
      { new: true }
    );

    // Also mark the underlying job as completed so it moves out of active lists
    try {
      await Job.findByIdAndUpdate(contract.jobId, { status: 'completed' });
    } catch (jobErr) {
      console.error('Failed to update job status after admin force-release:', jobErr?.message || jobErr);
    }

    // Update freelancer stats and reputation after admin force-completes the contract
    try {
      const freelancerId = contract.freelancerId;
      const [completedCount, totalCount, totalEarningsAgg] = await Promise.all([
        Contract.countDocuments({ freelancerId, status: 'completed' }),
        Contract.countDocuments({ freelancerId, status: { $in: ['active', 'completed', 'cancelled'] } }),
        Contract.aggregate([
          { $match: { freelancerId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalPaid' } } }
        ])
      ]);

      const profile = await FreelancerProfile.findOne({ userId: freelancerId });
      if (profile) {
        profile.completedJobs = completedCount;
        profile.successRate = totalCount > 0
          ? parseFloat(((completedCount / totalCount) * 100).toFixed(2))
          : 0;
        profile.totalEarnings = totalEarningsAgg[0]?.total || 0;
        await profile.save();
      }

      await ReputationService.updateAfterJobCompletion(freelancerId);
    } catch (statsErr) {
      console.error('Failed to update freelancer stats after admin completion:', statsErr?.message || statsErr);
    }

    // Notify freelancer
    try {
      const io = req.app?.get('io');
      await AdminNotification.create({
        userId: contract.freelancerId,
        type: 'payment_released',
        title: '💸 Payment Released by Admin',
        message: `Admin has released your payment for contract. Net earnings: $${freelancerNet.toFixed(2)} (after ${platformFeePercentage}% platform fee).${stripeTransferResult ? ' Stripe transfer initiated.' : ''}`,
        severity: 'info',
        icon: '💸',
        contractId: contract._id,
      });
      if (io) {
        io.to(contract.freelancerId.toString()).emit('adminNotification', {
          type: 'payment_released',
          title: '💸 Payment Released',
          message: `Admin released payment for your contract. $${freelancerNet.toFixed(2)} is on its way.`,
          severity: 'info',
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify freelancer about admin force-release:', notifyErr.message);
    }

    await logAction(req.user._id, 'FORCE_RELEASE_ESCROW', contract._id, 'contract', reason, {
      amount: contractTotal,
      platformFee,
      freelancerNet,
      stripeTransferId: stripeTransferResult,
      freelancerId: contract.freelancerId,
    });

    res.json({
      success: true,
      message: stripeError
        ? `Escrow released in DB but Stripe transfer skipped: ${stripeError}`
        : stripeTransferResult
          ? `Escrow released. Stripe transfer ${stripeTransferResult} sent to freelancer.`
          : 'Escrow released in DB. No Stripe charge found to transfer from.',
      data: contract,
      stripeTransferId: stripeTransferResult,
      stripeError: stripeError || undefined,
    });
  } catch (err) { next(err); }
};

export const refundClient = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Reason is required for refund', 400));

    const contract = await Contract.findById(req.params.id);
    if (!contract) return next(new AppError('Contract not found', 404));

    // Fetch the linked transaction record
    const transaction = await Transaction.findOne({ contractId: contract._id });

    let stripeRefundId = null;
    let stripeError = null;

    // ── Real Stripe Refund to client ──────────────────────────────
    if (stripe && transaction?.stripeChargeId) {
      try {
        const refund = await stripe.refunds.create({
          charge: transaction.stripeChargeId,
          reason: 'duplicate',
          metadata: {
            contractId: contract._id.toString(),
            adminRefund: 'true',
            adminId: req.user._id.toString(),
            reason,
          },
        });
        stripeRefundId = refund.id;

        if (transaction) {
          transaction.status = 'refunded';
          transaction.refundId = refund.id;
          transaction.refundedAt = new Date();
          transaction.refundReason = reason;
          await transaction.save();
        }
      } catch (stripeErr) {
        stripeError = stripeErr.message || 'Stripe refund failed';
        console.error('⚠️ Stripe refund failed during admin refund:', stripeErr.message);
        // Still update DB status for admin record-keeping
        if (transaction) {
          transaction.status = 'refunded';
          transaction.refundReason = reason;
          transaction.refundedAt = new Date();
          await transaction.save();
        }
      }
    } else if (transaction) {
      // No Stripe charge — just mark refunded in DB
      transaction.status = 'refunded';
      transaction.refundReason = reason;
      transaction.refundedAt = new Date();
      await transaction.save();
    }

    // Update contract
    await Contract.findByIdAndUpdate(
      contract._id,
      { paymentStatus: 'refunded', status: 'cancelled', actualEndDate: new Date() },
      { new: true }
    );

    // Notify client
    try {
      const io = req.app?.get('io');
      await AdminNotification.create({
        userId: contract.clientId,
        type: 'payment_refunded',
        title: '↩️ Refund Issued',
        message: `Admin has issued a refund for your contract "${contract.title}". Funds will return to your original payment method.${stripeRefundId ? ' Stripe refund ID: ' + stripeRefundId : ''}`,
        severity: 'info',
        icon: '↩️',
        contractId: contract._id,
      });
      if (io) {
        io.to(contract.clientId.toString()).emit('adminNotification', {
          type: 'payment_refunded',
          title: '↩️ Refund Issued',
          message: `Refund for "${contract.title}" has been issued by admin.`,
          severity: 'info',
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify client about admin refund:', notifyErr.message);
    }

    await logAction(req.user._id, 'REFUND_CLIENT', contract._id, 'contract', reason, {
      amount: contract.amount?.total,
      clientId: contract.clientId,
      stripeRefundId,
    });

    res.json({
      success: true,
      message: stripeError
        ? `Refund recorded in DB but Stripe refund failed: ${stripeError}`
        : stripeRefundId
          ? `Stripe refund ${stripeRefundId} issued to client.`
          : 'Refund recorded in DB. No Stripe charge found to refund.',
      data: contract,
      stripeRefundId: stripeRefundId || undefined,
      stripeError: stripeError || undefined,
    });
  } catch (err) { next(err); }
};

export const freezeContract = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Reason is required to freeze', 400));

    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      { status: 'disputed', paymentStatus: 'disputed' },
      { new: true }
    );
    if (!contract) return next(new AppError('Contract not found', 404));

    // Create corresponding Dispute record
    try {
      await Dispute.create({
        contractId: contract._id,
        raisedBy: req.user._id,
        raisedByRole: 'admin',
        reason: `Admin freeze: ${reason}`,
        status: 'open'
      });
    } catch (err) {
      console.error('Failed to create dispute record:', err.message);
    }

    await logAction(req.user._id, 'FREEZE_CONTRACT', contract._id, 'contract', reason);
    res.json({ success: true, message: 'Contract frozen and dispute opened', data: contract });
  } catch (err) { next(err); }
};

// NOTE: Per-contract platform fee adjustments are intentionally disabled.
// Platform fee is controlled globally via PlatformSettings.platformFeePercentage.
export const adjustContractFee = async (req, res, next) => {
  return next(
    new AppError(
      'Per-contract platform fees are disabled. Update the global Platform Fee in Admin Settings instead.',
      400
    )
  );
};

// ══════════════════════════════════════════════════════════════════
// 6. DISPUTES
// ══════════════════════════════════════════════════════════════════

export const getAllDisputes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Dispute.countDocuments(filter);
    const disputes = await Dispute.find(filter)
      .populate('contractId', 'title amount status')
      .populate('raisedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true, data: disputes,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
};

export const getDisputeDetail = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('contractId')
      .populate('raisedBy', 'name email avatar')
      .populate('reviewedBy', 'name');
    if (!dispute) return next(new AppError('Dispute not found', 404));

    const contract = await Contract.findById(dispute.contractId?._id)
      .populate('clientId', 'name email avatar')
      .populate('freelancerId', 'name email avatar');

    res.json({ success: true, data: { dispute, contract } });
  } catch (err) { next(err); }
};

export const resolveDispute = async (req, res, next) => {
  try {
    const { resolutionType, freelancerAmount, clientAmount, notes, reason } = req.body;
    if (!resolutionType) return next(new AppError('Resolution type required', 400));
    if (!reason) return next(new AppError('Resolution reason required', 400));

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        adminNotes: notes,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        resolution: {
          type: resolutionType,
          freelancerAmount,
          clientAmount,
          notes,
          resolvedBy: req.user._id,
          resolvedAt: new Date()
        }
      },
      { new: true }
    ).populate('contractId');
    if (!dispute) return next(new AppError('Dispute not found', 404));

    const contract = await Contract.findById(dispute.contractId);
    if (!contract) return next(new AppError('Contract not found', 404));

    // Get dynamic platform fee percentage from settings
    const settings = await PlatformSettings.findOne();
    const platformFeePercentage = settings?.platformFeePercentage || 3;

    // Determine payment status based on resolution
    const payStatus = resolutionType === 'full_release' ? 'released'
      : resolutionType === 'full_refund' ? 'refunded'
      : 'released'; // partial split treated as released

    // Get transaction record if it exists
    const transaction = await Transaction.findOne({ contractId: contract._id });

    // Handle Stripe fund movements if payment was in escrow
    if (contract.paymentStatus === 'escrow' && contract.stripePaymentIntentId && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(contract.stripePaymentIntentId);
        
        if (paymentIntent.status === 'succeeded' && paymentIntent.latest_charge) {
          const chargeId = paymentIntent.latest_charge;

          if (resolutionType === 'full_refund') {
            // Issue full refund to client
            const refund = await stripe.refunds.create({
              charge: chargeId,
              reason: 'dispute_resolution'
            });
            
            if (transaction) {
              transaction.status = 'refunded';
              transaction.refundId = refund.id;
              transaction.refundedAt = new Date();
              transaction.refundReason = reason;
              transaction.disputeId = dispute._id;
              await transaction.save();
            }
          } else if (resolutionType === 'partial_split') {
            // For partial split, calculate amounts after platform fee
            const contractTotal = contract.amount?.total || 0;
            const platformFee = (contractTotal * platformFeePercentage) / 100;
            const amountAfterFee = contractTotal - platformFee;
            
            const freelancerPayout = freelancerAmount || (amountAfterFee / 2);
            const clientRefund = contractTotal - freelancerPayout;
            
            if (clientRefund > 0) {
              const refund = await stripe.refunds.create({
                charge: chargeId,
                amount: Math.round(clientRefund * 100), // Convert to cents
                reason: 'dispute_resolution'
              });
              
              if (transaction) {
                transaction.status = 'partial_refund';
                transaction.partialRefundAmount = clientRefund;
                transaction.partialRefundId = refund.id;
                transaction.partialRefundedAt = new Date();
                transaction.disputeId = dispute._id;
                await transaction.save();
              }
            }

            // Transfer freelancer portion to their Stripe account if auto-payout is enabled
            if (process.env.AUTO_PAYOUTS === 'true' && transaction) {
              try {
                const freelancerProfile = await FreelancerProfile.findOne({ userId: contract.freelancerId });
                if (freelancerProfile?.stripeAccountId) {
                  const currency = getStripeCurrency(contract.amount?.currency);
                  const freelancerPayoutMinorUnits = Math.round(freelancerPayout * 100);

                  if (freelancerPayoutMinorUnits > 0) {
                    const transfer = await stripe.transfers.create({
                      amount: freelancerPayoutMinorUnits,
                      currency,
                      destination: freelancerProfile.stripeAccountId,
                      source_transaction: chargeId,
                      metadata: { disputeId: dispute._id.toString(), resolutionType, platformFeePercentage }
                    });
                    
                    transaction.stripeTransferId = transfer.id;
                    transaction.payoutStatus = 'paid_out';
                    await transaction.save();
                  }
                }
              } catch (err) {
                console.error('Error creating Stripe transfer for partial split:', err);
                if (transaction) {
                  transaction.payoutStatus = 'failed';
                  await transaction.save();
                }
              }
            }
          } else if (resolutionType === 'full_release') {
            // Transfer freelancer amount after deducting platform fee
            try {
              const freelancerProfile = await FreelancerProfile.findOne({ userId: contract.freelancerId });
              if (freelancerProfile?.stripeAccountId) {
                const contractTotal = contract.amount?.total || 0;
                const platformFee = (contractTotal * platformFeePercentage) / 100;
                const freelancerNet = contractTotal - platformFee;
                const currency = getStripeCurrency(contract.amount?.currency);
                const amountMinorUnits = Math.round(freelancerNet * 100);

                if (amountMinorUnits > 0) {
                  const transfer = await stripe.transfers.create({
                    amount: amountMinorUnits,
                    currency,
                    destination: freelancerProfile.stripeAccountId,
                    source_transaction: chargeId,
                    metadata: { 
                      disputeId: dispute._id.toString(), 
                      resolutionType: 'full_release',
                      platformFeePercentage,
                      platformFeeAmount: platformFee
                    }
                  });
                  
                  if (transaction) {
                    transaction.status = 'released';
                    transaction.stripeTransferId = transfer.id;
                    transaction.payoutStatus = 'paid_out';
                    transaction.platformFee = platformFee;
                    transaction.netAmount = freelancerNet;
                    transaction.disputeId = dispute._id;
                    await transaction.save();
                  }
                }
              }
            } catch (err) {
              console.error('Error creating Stripe transfer for full release:', err);
              if (transaction) {
                transaction.payoutStatus = 'failed';
                await transaction.save();
              }
            }
          }
        }
      } catch (stripeErr) {
        console.error('Stripe error during dispute resolution:', stripeErr.message);
        // Continue with contract update even if Stripe fails
      }
    }

    // Update contract with resolution
    await Contract.findByIdAndUpdate(dispute.contractId, {
      status: 'completed',
      paymentStatus: payStatus,
      disputeReason: reason,
      disputeResolvedAt: new Date()
    });

    // Keep the parent job status in sync with the contract resolution
    try {
      if (payStatus === 'released') {
        await Job.findByIdAndUpdate(contract.jobId, { status: 'completed' });
      } else if (payStatus === 'refunded') {
        await Job.findByIdAndUpdate(contract.jobId, { status: 'cancelled' });
      }
    } catch (jobErr) {
      console.error('Failed to update job status after dispute resolution:', jobErr?.message || jobErr);
    }

    // Notify both parties
    try {
      const io = req.app.get('io');
      const notifMsg = `Dispute resolved - Admin decision: ${resolutionType.replace('_', ' ')}`;

      for (const userId of [contract.clientId, contract.freelancerId]) {
        await AdminNotification.create({
          userId,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          message: notifMsg,
          severity: 'info',
          icon: '⚖️',
          contractId: contract._id
        });

        if (io) {
          io.to(userId.toString()).emit('adminNotification', {
            type: 'dispute_resolved',
            title: '⚖️ Dispute Resolved',
            message: notifMsg,
            contractId: contract._id
          });
        }
      }
    } catch (notifyErr) {
      console.error('Failed to notify parties about dispute resolution:', notifyErr.message);
    }

    await logAction(req.user._id, 'RESOLVE_DISPUTE', dispute._id, 'dispute', reason, { resolutionType, freelancerAmount, clientAmount });
    res.json({ success: true, message: 'Dispute resolved', data: dispute });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 7. REVIEWS
// ══════════════════════════════════════════════════════════════════

export const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isFlagged } = req.query;
    const filter = {};
    if (isFlagged !== undefined) filter.isFlagged = isFlagged === 'true';

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('reviewerId', 'name avatar')
      .populate('reviewedUserId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: reviews, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Reason required', 400));
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));
    await logAction(req.user._id, 'DELETE_REVIEW', review._id, 'review', reason);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};

export const flagReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { isFlagged: true, flagReason: reason }, { new: true });
    if (!review) return next(new AppError('Review not found', 404));
    await logAction(req.user._id, 'FLAG_REVIEW', review._id, 'review', reason);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 8. REPUTATION
// ══════════════════════════════════════════════════════════════════

export const getAllReputations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sortBy = 'overallScore', order = 'desc' } = req.query;
    const total = await Reputation.countDocuments();
    const reputations = await Reputation.find()
      .populate('userId', 'name email avatar role riskLevel')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: reputations, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const getUserReputation = async (req, res, next) => {
  try {
    const reputation = await Reputation.findOne({ userId: req.params.userId })
      .populate('userId', 'name email avatar role');
    if (!reputation) return next(new AppError('Reputation record not found', 404));
    res.json({ success: true, data: reputation });
  } catch (err) { next(err); }
};

export const adjustReputationScore = async (req, res, next) => {
  try {
    const { field, value, reason } = req.body;
    if (!field || value === undefined || !reason) return next(new AppError('field, value, and reason are required', 400));

    const updateObj = {};
    updateObj[field] = value;
    const reputation = await Reputation.findOneAndUpdate(
      { userId: req.params.userId }, updateObj, { new: true }
    );
    if (!reputation) return next(new AppError('Reputation not found', 404));
    await logAction(req.user._id, 'ADJUST_REPUTATION_SCORE', reputation._id, 'reputation', reason, { field, value, userId: req.params.userId });
    res.json({ success: true, data: reputation });
  } catch (err) { next(err); }
};

export const recalculateReputationScore = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) return next(new AppError('User not found', 404));

    // Recalculate reputation based on actual data
    const reputation = await ReputationService.recalculateReputation(userId);
    
    await logAction(req.user._id, 'RECALCULATE_REPUTATION', reputation._id, 'reputation', 'Admin triggered reputation recalculation', { userId });
    
    res.json({ 
      success: true, 
      message: 'Reputation scores recalculated successfully',
      data: reputation 
    });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 9. COMMUNITIES
// ══════════════════════════════════════════════════════════════════

export const getAllCommunities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isSuspended } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';

    const total = await Community.countDocuments(filter);
    const communities = await Community.find(filter)
      .populate('ownerId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: communities, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const deleteCommunity = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Reason required', 400));
    const community = await Community.findByIdAndDelete(req.params.id);
    if (!community) return next(new AppError('Community not found', 404));
    await logAction(req.user._id, 'DELETE_COMMUNITY', community._id, 'community', reason, { name: community.name });
    res.json({ success: true, message: 'Community deleted' });
  } catch (err) { next(err); }
};

export const suspendCommunity = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Reason required', 400));
    const community = await Community.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true });
    if (!community) return next(new AppError('Community not found', 404));
    await logAction(req.user._id, 'SUSPEND_COMMUNITY', community._id, 'community', reason);
    res.json({ success: true, data: community });
  } catch (err) { next(err); }
};

export const restoreCommunity = async (req, res, next) => {
  try {
    const community = await Community.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
    if (!community) return next(new AppError('Community not found', 404));
    await logAction(req.user._id, 'RESTORE_COMMUNITY', community._id, 'community', 'Restored by admin');
    res.json({ success: true, data: community });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 10. PLATFORM SETTINGS
// ══════════════════════════════════════════════════════════════════

export const getSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({ superAdminId: req.user._id });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      'platformFeePercentage', 'escrowEnabled', 'maxProposalsPerJob',
      'maxActiveJobsPerClient', 'maintenanceMode', 'maintenanceMessage',
      'allowNewRegistrations', 'autoFlagReportCount', 'autoFlagRefundCount',
      'emailNotificationsEnabled'
    ];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    updates.lastUpdatedBy = req.user._id;

    const settings = await PlatformSettings.findOneAndUpdate({}, updates, { new: true, upsert: true });
    await logAction(req.user._id, 'UPDATE_SETTINGS', settings._id, 'settings', null, updates);
    
    // Broadcast setting changes via Socket.io
    const io = req.app.get('io');
    if (io && Object.keys(updates).length > 0) {
      io.emit('platformSettingsUpdated', { updates });
    }

    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 11. AUDIT LOGS
// ══════════════════════════════════════════════════════════════════

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, actionType, targetType, targetId } = req.query;
    const filter = {};
    if (actionType) filter.actionType = actionType;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;

    const total = await AdminAction.countDocuments(filter);
    const logs = await AdminAction.find(filter)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 12. PAYMENTS / ESCROW OVERVIEW
// ══════════════════════════════════════════════════════════════════

export const getEscrowOverview = async (req, res, next) => {
  try {
    const [escrowContracts, totalEscrow] = await Promise.all([
      Contract.find({ paymentStatus: { $in: ['escrow', 'disputed'] } })
        .populate('clientId', 'name email')
        .populate('freelancerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Contract.aggregate([
        { $match: { paymentStatus: { $in: ['escrow', 'disputed'] } } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ])
    ]);

    const contractIds = escrowContracts.map(c => c._id);
    const transactions = contractIds.length
      ? await Transaction.find({ contractId: { $in: contractIds } }).lean()
      : [];
    const txMap = new Map(transactions.map(tx => [tx.contractId.toString(), tx]));

    const contractsWithFinancials = escrowContracts.map(contract => ({
      ...contract,
      financials: buildContractEarningsSnapshot(contract, txMap.get(contract._id.toString())),
    }));

    res.json({
      success: true,
      data: {
        contracts: contractsWithFinancials,
        totalHeld: totalEscrow[0]?.total || 0,
      },
    });
  } catch (err) { next(err); }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    // Build filter — search by Stripe IDs or user name/email via join
    const filter = {};
    if (search) {
      filter.$or = [
        { stripePaymentIntentId: { $regex: search, $options: 'i' } },
        { stripeChargeId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Transaction.countDocuments(filter);
    const txs = await Transaction.find(filter)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .populate('contractId', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const data = txs.map((tx) => {
      let type = 'other';
      if (tx.status === 'held') type = 'escrow_lock';
      else if (tx.status === 'released') type = 'escrow_release';
      else if (tx.status === 'refunded' || tx.status === 'partial_refund') type = 'refund';
      else if (tx.payoutStatus === 'paid_out') type = 'payout';

      let statusLabel = 'held';
      if (tx.status === 'released') statusLabel = 'released';
      else if (tx.status === 'refunded') statusLabel = 'refunded';
      else if (tx.status === 'partial_refund') statusLabel = 'partial_refund';

      return {
        _id: tx._id,
        createdAt: tx.createdAt,
        type,
        sender: tx.fromUserId || null,
        receiver: tx.toUserId || null,
        contractId: tx.contractId?._id || null,
        contractTitle: tx.contractId?.title || null,
        // Financial breakdown
        jobPrice: tx.amount || 0,
        processingFee: tx.processingFee || 0,
        platformFee: tx.platformFee || 0,
        netAmount: tx.netAmount || 0,
        actualStripeFee: tx.actualStripeFee || 0,
        // clientTotal is the real amount Stripe charged (job + processing fee)
        clientTotal: typeof tx.clientTotal === 'number' && tx.clientTotal > 0
          ? tx.clientTotal
          : (tx.amount || 0),
        // Stripe references for linking to dashboard
        stripePaymentIntentId: tx.stripePaymentIntentId || null,
        stripeChargeId: tx.stripeChargeId || null,
        stripeTransferId: tx.stripeTransferId || null,
        refundId: tx.refundId || null,
        status: statusLabel,
        payoutStatus: tx.payoutStatus || 'pending',
      };
    });

    res.json({
      success: true,
      data,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 13. ESCROW HOLD / UNHOLD
// ══════════════════════════════════════════════════════════════════

export const holdEscrow = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new AppError('Hold reason is required', 400));

    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        isHeldByAdmin: true,
        holdReason: reason,
        heldAt: new Date(),
        heldBy: req.user._id
      },
      { new: true }
    ).populate('freelancerId', '_id name');

    if (!contract) return next(new AppError('Contract not found', 404));

    // Notify freelancer
    try {
      const AdminNotification = (await import('../models/AdminNotification.js')).default;
      const io = req.app.get('io');

      await AdminNotification.create({
        userId: contract.freelancerId._id,
        type: 'payment_held',
        title: '⚠️ Payment Held by Admin',
        message: `Your payment for contract "${contract.title}" has been placed on hold by an admin. Reason: ${reason}`,
        severity: 'warning',
        icon: '⚠️',
        contractId: contract._id,
        contractTitle: contract.title,
        reason
      });

      if (io) {
        io.to(contract.freelancerId._id.toString()).emit('adminNotification', {
          type: 'payment_held',
          title: '⚠️ Payment Held by Admin',
          message: `Your payment for "${contract.title}" has been held. Reason: ${reason}`,
          contractId: contract._id,
          severity: 'warning'
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify freelancer about escrow hold:', notifyErr.message);
    }

    await logAction(req.user._id, 'HOLD_ESCROW', contract._id, 'contract', reason);
    res.json({ success: true, message: 'Escrow payment held by admin', data: contract });
  } catch (err) { next(err); }
};

export const unholdEscrow = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        isHeldByAdmin: false,
        holdReason: null,
        heldAt: null,
        heldBy: null
      },
      { new: true }
    ).populate('freelancerId', '_id name');

    if (!contract) return next(new AppError('Contract not found', 404));

    // Notify freelancer
    try {
      const AdminNotification = (await import('../models/AdminNotification.js')).default;
      const io = req.app.get('io');

      await AdminNotification.create({
        userId: contract.freelancerId._id,
        type: 'payment_unhold',
        title: '✅ Payment Hold Removed',
        message: `The admin hold on your payment for contract "${contract.title}" has been lifted. You can now proceed normally.`,
        severity: 'info',
        icon: '✅',
        contractId: contract._id,
        contractTitle: contract.title,
        reason: reason || 'Resolved by admin'
      });

      if (io) {
        io.to(contract.freelancerId._id.toString()).emit('adminNotification', {
          type: 'payment_unhold',
          title: '✅ Payment Hold Removed',
          message: `Hold on payment for "${contract.title}" has been lifted.`,
          contractId: contract._id,
          severity: 'info'
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify freelancer about escrow unhold:', notifyErr.message);
    }

    await logAction(req.user._id, 'UNHOLD_ESCROW', contract._id, 'contract', reason || 'Unhold by admin');
    res.json({ success: true, message: 'Escrow hold removed', data: contract });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 14. PAYMENT STATS
// ══════════════════════════════════════════════════════════════════

export const getPaymentStats = async (req, res, next) => {
  try {
    const [
      totalInEscrowAgg,
      totalReleasedAgg,
      totalPlatformFeesAgg,
      totalClientPaidAgg,
      totalRefundedAgg,
      escrowCount,
      releasedCount,
      disputedCount,
      pendingWithdrawals,
      heldByAdminCount,
      // Real Stripe amounts from Transaction ledger
      txClientTotalAgg,
      txActualStripeFeeAgg,
      txPlatformFeeAgg,
      txNetAmountHeldAgg,
    ] = await Promise.all([
      // Contract-based (job price only, no Stripe processing fee)
      Contract.aggregate([
        { $match: { paymentStatus: { $in: ['escrow', 'disputed'] } } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ]),
      Contract.aggregate([
        { $match: { paymentStatus: 'released' } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ]),
      Contract.aggregate([
        { $match: { paymentStatus: { $in: ['released', 'escrow'] } } },
        { $group: { _id: null, total: { $sum: '$platformFee.amount' } } }
      ]),
      Contract.aggregate([
        { $match: { paymentStatus: { $in: ['escrow', 'released', 'refunded', 'disputed'] } } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ]),
      Contract.aggregate([
        { $match: { paymentStatus: 'refunded' } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ]),
      Contract.countDocuments({ paymentStatus: { $in: ['escrow', 'disputed'] } }),
      Contract.countDocuments({ paymentStatus: 'released' }),
      Contract.countDocuments({ paymentStatus: 'disputed' }),
      // Withdrawals that freelancers have requested but admins have not yet processed
      Transaction.countDocuments({ status: 'released', payoutStatus: 'requested' }),
      Contract.countDocuments({ isHeldByAdmin: true }),
      // Transaction-ledger aggregations (real Stripe data)
      // Sum of clientTotal = actual amounts Stripe charged (job + processing fee)
      Transaction.aggregate([
        { $match: { clientTotal: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$clientTotal' } } }
      ]),
      // Sum of actualStripeFee = real Stripe processing fees
      Transaction.aggregate([
        { $match: { actualStripeFee: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$actualStripeFee' } } }
      ]),
      // Sum of platformFee from Transaction ledger
      Transaction.aggregate([
        { $match: { platformFee: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } }
      ]),
      // Net amount held (what freelancers will receive from currently-held transactions)
      Transaction.aggregate([
        { $match: { status: 'held', netAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]),
    ]);

    const paymentStatusBreakdown = await Contract.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, volume: { $sum: '$amount.total' } } }
    ]);

    res.json({
      success: true,
      data: {
        // Contract-model aggregations (job price, no Stripe processing fee)
        totalClientPaid: totalClientPaidAgg[0]?.total || 0,
        totalInEscrow: totalInEscrowAgg[0]?.total || 0,
        totalReleased: totalReleasedAgg[0]?.total || 0,
        totalPlatformFees: totalPlatformFeesAgg[0]?.total || 0,
        totalRefunded: totalRefundedAgg[0]?.total || 0,
        escrowCount,
        releasedCount,
        disputedCount,
        pendingWithdrawals,
        heldByAdminCount,
        paymentStatusBreakdown,
        // Real Stripe Transaction-ledger amounts
        totalActualClientCharges: txClientTotalAgg[0]?.total || 0,
        totalActualStripeFees: txActualStripeFeeAgg[0]?.total || 0,
        totalActualPlatformFees: txPlatformFeeAgg[0]?.total || 0,
        totalNetAmountHeld: txNetAmountHeldAgg[0]?.total || 0,
      }
    });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════════════════════════════
// 15. WITHDRAWAL REQUESTS (ADMIN APPROVAL)
// ══════════════════════════════════════════════════════════════════

// List aggregated withdrawal requests grouped by freelancer
export const getWithdrawalRequests = async (req, res, next) => {
  try {
    const agg = await Transaction.aggregate([
      {
        $match: {
          status: 'released',
          payoutStatus: 'requested',
          toUserId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$toUserId',
          totalAmount: {
            $sum: {
              $cond: [
                { $gt: ['$netAmount', 0] },
                '$netAmount',
                { $ifNull: ['$amount', 0] },
              ],
            },
          },
          txCount: { $sum: 1 },
          latestAt: { $max: '$createdAt' },
        },
      },
      { $sort: { latestAt: -1 } },
    ]);

    const userIds = agg.map((a) => a._id).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('name email role');
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const data = agg.map((row) => {
      const u = userMap.get(row._id.toString());
      return {
        userId: row._id,
        totalAmount: row.totalAmount || 0,
        txCount: row.txCount || 0,
        latestAt: row.latestAt,
        user: u
          ? { _id: u._id, name: u.name, email: u.email, role: u.role }
          : null,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Approve and process a freelancer's withdrawal request by creating Stripe transfers
export const approveWithdrawalRequest = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payments are not configured', 500));
    }

    const freelancerId = req.params.userId;
    const profile = await FreelancerProfile.findOne({ userId: freelancerId });

    if (!profile || !profile.stripeAccountId) {
      return next(new AppError('Freelancer does not have a Stripe Connect account', 400));
    }

    if (!profile.payoutsEnabled) {
      return next(new AppError('Freelancer has not completed Stripe payouts onboarding', 400));
    }

    const pendingTxs = await Transaction.find({
      toUserId: freelancerId,
      status: 'released',
      payoutStatus: 'requested',
    }).populate('contractId');

    if (!pendingTxs.length) {
      return next(new AppError('No requested withdrawals found for this freelancer', 400));
    }

    await Transaction.updateMany(
      {
        _id: { $in: pendingTxs.map((tx) => tx._id) },
        payoutStatus: 'requested',
      },
      { $set: { payoutStatus: 'processing' } }
    );

    const transfers = [];
    const failedTransfers = [];

    for (const tx of pendingTxs) {
      const contract = tx.contractId instanceof Contract ? tx.contractId : null;

      const currency = getStripeCurrency(
        contract && contract.amount && contract.amount.currency
      );

      const netAmount = getNetPayoutAmount(tx);
      const amountInMinorUnits = Math.round(netAmount * 100);

      if (!currency || amountInMinorUnits <= 0) {
        continue;
      }

      try {
        const transfer = await stripe.transfers.create({
          amount: amountInMinorUnits,
          currency,
          destination: profile.stripeAccountId,
          source_transaction: tx.stripeChargeId || undefined,
        });

        tx.stripeTransferId = transfer.id;
        tx.payoutStatus = 'paid_out';
        await tx.save();

        transfers.push({
          transactionId: tx._id,
          transferId: transfer.id,
          amount: netAmount,
        });
      } catch (err) {
        console.error('Error creating Stripe transfer for admin-approved payout:', err);
        if (tx.payoutStatus !== 'paid_out') {
          tx.payoutStatus = 'failed';
          await tx.save();
        }
        failedTransfers.push({
          transactionId: tx._id,
          error: err?.message || 'Stripe transfer failed',
        });
      }
    }

    const totalWithdrawn = transfers.reduce((sum, t) => sum + t.amount, 0);

    // If every attempted transfer failed, surface this clearly to the admin
    if (!transfers.length && failedTransfers.length) {
      const firstError = failedTransfers[0].error;
      return next(
        new AppError(
          `Stripe could not process this withdrawal. Most common reason in test mode is insufficient Stripe balance. Details: ${firstError}`,
          400
        )
      );
    }

    // Notify freelancer (non-blocking)
    try {
      const io = req.app?.get('io');
      await AdminNotification.create({
        userId: freelancerId,
        type: 'withdrawal_initiated',
        title: '🏦 Withdrawal Approved',
        message: `An admin approved your withdrawal of $${totalWithdrawn.toFixed(
          2
        )}. Funds typically arrive within 3–5 business days.`,
        severity: 'info',
        icon: '🏦',
        reason: `${transfers.length} payout(s) processed by admin approval`,
      });

      if (io) {
        io.to(freelancerId.toString()).emit('adminNotification', {
          type: 'withdrawal_initiated',
          title: '🏦 Withdrawal Approved',
          message: `$${totalWithdrawn.toFixed(
            2
          )} withdrawal approved — arrives in 3–5 business days`,
          severity: 'info',
        });
      }
    } catch (notifyErr) {
      console.error('Failed to send withdrawal approval notification:', notifyErr.message);
    }

    res.json({
      success: true,
      data: {
        userId: freelancerId,
        totalWithdrawn,
        transferCount: transfers.length,
        failedTransfers,
      },
    });
  } catch (err) {
    next(err);
  }
};

