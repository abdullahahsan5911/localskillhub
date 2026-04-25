import BanAppeal from '../models/BanAppeal.js';
import User from '../models/User.js';
import AdminAction from '../models/AdminAction.js';
import { AppError } from '../middleware/errorHandler.js';

// ══════════════════════════════════════════════════════════════════
// BANNED USER ENDPOINTS (Public - No protect middleware needed)
// ══════════════════════════════════════════════════════════════════

/**
 * @desc    Submit a ban appeal
 * @route   POST /api/appeals/ban
 * @access  Private (Banned users only)
 */
export const submitBanAppeal = async (req, res, next) => {
  try {
    const { appealMessage } = req.body;

    if (!appealMessage || appealMessage.trim().length < 50) {
      return next(new AppError('Appeal message must be at least 50 characters long', 400));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.isBanned) {
      return next(new AppError('You are not banned', 400));
    }

    // Check if user already has a pending appeal
    const existingAppeal = await BanAppeal.findOne({
      userId: req.user._id,
      status: 'pending'
    });

    if (existingAppeal) {
      return next(new AppError('You already have a pending appeal. Please wait for admin review.', 400));
    }

    // Create new appeal
    const appeal = await BanAppeal.create({
      userId: req.user._id,
      banDate: user.updatedAt, // Use user's updated date as ban date (could be improved with explicit ban date)
      banReason: user.suspensionReason || 'Account violation',
      appealMessage: appealMessage.trim(),
      lastAppealAt: new Date()
    });

    res.status(201).json({
      status: 'success',
      message: 'Appeal submitted successfully. An admin will review your appeal soon.',
      data: appeal
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user's ban appeal status
 * @route   GET /api/appeals/ban/status
 * @access  Private (Banned users)
 */
export const getBanAppealStatus = async (req, res, next) => {
  try {
    const appeal = await BanAppeal.findOne({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    if (!appeal) {
      return res.json({
        status: 'success',
        data: null,
        message: 'No appeal found'
      });
    }

    res.json({
      status: 'success',
      data: appeal
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all ban appeals (Admin only)
 * @route   GET /api/appeals/ban
 * @access  Private/Admin
 */
export const getAllBanAppeals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const filter = {};

    if (status && ['pending', 'approved', 'rejected', 'reopen'].includes(status)) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    const total = await BanAppeal.countDocuments(filter);
    const appeals = await BanAppeal.find(filter)
      .populate('userId', 'name email avatar role')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      data: appeals,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        pendingCount: await BanAppeal.countDocuments({ status: 'pending' })
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Review and approve/reject ban appeal
 * @route   POST /api/appeals/ban/:appealId/review
 * @access  Private/Admin
 */
export const reviewBanAppeal = async (req, res, next) => {
  try {
    const { decision, adminReview } = req.body; // decision: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      return next(new AppError('Decision must be either "approved" or "rejected"', 400));
    }

    const appeal = await BanAppeal.findById(req.params.appealId);
    if (!appeal) {
      return next(new AppError('Appeal not found', 404));
    }

    if (appeal.status !== 'pending') {
      return next(new AppError('This appeal has already been reviewed', 400));
    }

    const user = await User.findById(appeal.userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update appeal
    appeal.status = decision;
    appeal.reviewedAt = new Date();
    appeal.reviewedBy = req.user._id;
    appeal.adminReview = adminReview || null;
    await appeal.save();

    // If approved, unban user
    if (decision === 'approved') {
      user.isBanned = false;
      user.isActive = true;
      user.suspensionReason = null;
      await user.save();

      // Log admin action
      await AdminAction.create({
        adminId: req.user._id,
        actionType: 'UNBAN_USER',
        targetId: user._id,
        targetType: 'user',
        reason: `Ban appeal approved - ${adminReview || 'No review provided'}`,
        metadata: { appealId: appeal._id }
      });

      // Notify user (could send email here)
      console.log(`✅ User ${user.email} ban appeal approved`);
    } else {
      console.log(`❌ User ${user.email} ban appeal rejected`);
    }

    res.json({
      status: 'success',
      message: `Appeal ${decision} successfully`,
      data: appeal
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reopen a rejected appeal
 * @route   POST /api/appeals/ban/:appealId/reopen
 * @access  Private (Appeal owner or admin)
 */
export const reopenBanAppeal = async (req, res, next) => {
  try {
    const appeal = await BanAppeal.findById(req.params.appealId);

    if (!appeal) {
      return next(new AppError('Appeal not found', 404));
    }

    // Check authorization
    if (appeal.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to reopen this appeal', 403));
    }

    if (appeal.status !== 'rejected') {
      return next(new AppError('Only rejected appeals can be reopened', 400));
    }

    // Check if 30 days have passed since last appeal
    const daysSinceAppeal = (new Date() - appeal.lastAppealAt) / (1000 * 60 * 60 * 24);
    if (daysSinceAppeal < 30) {
      return next(new AppError(
        `You can reopen your appeal after ${Math.ceil(30 - daysSinceAppeal)} days`,
        400
      ));
    }

    appeal.status = 'reopen';
    appeal.lastAppealAt = new Date();
    appeal.reviewedAt = null;
    appeal.reviewedBy = null;
    appeal.adminReview = null;
    await appeal.save();

    res.json({
      status: 'success',
      message: 'Appeal reopened. Admin will review again soon.',
      data: appeal
    });
  } catch (err) {
    next(err);
  }
};
