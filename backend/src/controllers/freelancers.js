import FreelancerProfile from '../models/FreelancerProfile.js';
import User from '../models/User.js';
import Reputation from '../models/Reputation.js';
import ReputationService from '../services/reputation.service.js';
import Contract from '../models/Contract.js';
import { AppError } from '../middleware/errorHandler.js';

const VALID_SKILL_LEVELS = new Set(['beginner', 'intermediate', 'expert']);

const countPortfolioAppreciations = (portfolio = []) => {
  if (!Array.isArray(portfolio)) return 0;
  return portfolio.reduce((sum, item) => {
    const appreciations = Array.isArray(item?.appreciations) ? item.appreciations.length : 0;
    return sum + appreciations;
  }, 0);
};

const sanitizeFreelancerProfilePayload = (payload = {}) => {
  const sanitized = { ...payload };

  if (Array.isArray(payload.tools)) {
    sanitized.tools = payload.tools
      .map((tool) => (typeof tool === 'string' ? tool.trim() : String(tool || '').trim()))
      .filter(Boolean);
  }

  if (Array.isArray(payload.skills)) {
    sanitized.skills = payload.skills
      .map((skill) => {
        const name = typeof skill?.name === 'string' ? skill.name.trim() : '';
        const rawLevel = typeof skill?.level === 'string' ? skill.level : '';
        const level = VALID_SKILL_LEVELS.has(rawLevel) ? rawLevel : 'intermediate';

        if (!name) {
          return null;
        }

        return { ...skill, name, level };
      })
      .filter(Boolean);
  }

  return sanitized;
};

// @desc    Get all freelancers
// @route   GET /api/freelancers
// @access  Public
export const getFreelancers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      skills,
      minRate,
      maxRate,
      city,
      state,
      country,
      search,
      availability,
      verifiedOnly = 'false',
      sort = '-localScore',
      completeOnly = 'true',
    } = req.query;

    const query = {};
    const requireCompleteProfile = completeOnly !== 'false';
    const verifiedOnlyEnabled = verifiedOnly === 'true';
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 12;

    if (requireCompleteProfile) {
      query['portfolio.0'] = { $exists: true };
      query['portfolio.0.images.0'] = { $exists: true };
      query['skills.0'] = { $exists: true };
      query.title = { $exists: true, $ne: '' };
    }
    if (skills) {
      query['skills.name'] = { $in: Array.isArray(skills) ? skills : [skills] };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { 'skills.name': { $regex: search, $options: 'i' } },
      ];
    }
    
    if (minRate) {
      query['rates.minRate'] = { $gte: Number(minRate) };
    }

    if (maxRate) {
      query['rates.maxRate'] = { $lte: Number(maxRate) };
    }

    if (availability) {
      query['availability.status'] = availability;
    }

    const userQuery = {};

    if (city) {
      userQuery['location.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      userQuery['location.state'] = { $regex: state, $options: 'i' };
    }

    if (country) {
      userQuery['location.country'] = { $regex: country, $options: 'i' };
    }

    // CRITICAL: Exclude banned users from public listings
    userQuery.isBanned = { $ne: true };

    if (verifiedOnlyEnabled) {
      userQuery.$or = [
        { isEmailVerified: true },
        { isPhoneVerified: true },
      ];
    }

    if (Object.keys(userQuery).length > 0) {
      const matchedUsers = await User.find(userQuery).select('_id');
      query.userId = { $in: matchedUsers.map((user) => user._id) };
    }

    const freelancers = await FreelancerProfile.find(query)
      .populate({
        path: 'userId',
        select: '-passwordHash'
      })
      .limit(pageSize)
      .skip((pageNumber - 1) * pageSize)
      .sort(sort);

    const count = await FreelancerProfile.countDocuments(query);

    const freelancersWithStats = freelancers.map((profile) => {
      const plain = profile.toObject();
      return {
        ...plain,
        appreciationsCount: countPortfolioAppreciations(plain.portfolio),
      };
    });

    res.json({
      status: 'success',
      data: {
        freelancers: freelancersWithStats,
        totalPages: Math.ceil(count / pageSize),
        currentPage: pageNumber,
        total: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single freelancer
// @route   GET /api/freelancers/:id
// @access  Public
export const getFreelancer = async (req, res, next) => {
  try {
    const freelancer = await FreelancerProfile.findOne({ userId: req.params.id })
      .populate('userId', '-passwordHash')
      .populate('endorsements.endorsedBy', 'name avatar');

    if (!freelancer) {
      return next(new AppError('Freelancer profile not found', 404));
    }

    // CRITICAL: Prevent viewing banned user profiles
    if (freelancer.userId && freelancer.userId.isBanned) {
      return next(new AppError('This freelancer profile is not available', 404));
    }

    // Increment profile views and lazily refresh derived stats/trust scores
    try {
      const freelancerId = freelancer.userId?._id || freelancer.userId;

      // Recompute completed jobs & success rate from contracts as source of truth
      const [completedCount, totalCount] = await Promise.all([
        Contract.countDocuments({ freelancerId, status: 'completed' }),
        Contract.countDocuments({ freelancerId, status: { $in: ['active', 'completed', 'cancelled'] } })
      ]);

      const calculatedSuccessRate = totalCount > 0
        ? parseFloat(((completedCount / totalCount) * 100).toFixed(2))
        : 0;

      freelancer.completedJobs = completedCount;
      freelancer.successRate = calculatedSuccessRate;

      // Always increment profile views when profile is opened
      freelancer.profileViews = (freelancer.profileViews || 0) + 1;

      await freelancer.save();

      // Ensure reputation and trust scores are up to date (reviews + contracts)
      await ReputationService.recalculateReputation(freelancerId);
    } catch (statsErr) {
      console.error('Failed to refresh freelancer stats on profile view:', statsErr?.message || statsErr);
    }

    const freelancerData = freelancer.toObject();
    freelancerData.appreciationsCount = countPortfolioAppreciations(freelancerData.portfolio);

    res.json({
      status: 'success',
      data: { freelancer: freelancerData }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create freelancer profile
// @route   POST /api/freelancers/profile
// @access  Private (Freelancer/Both)
export const createFreelancerProfile = async (req, res, next) => {
  try {
    const existingProfile = await FreelancerProfile.findOne({ userId: req.user.id });
    
    if (existingProfile) {
      return next(new AppError('Profile already exists', 400));
    }

    const payload = sanitizeFreelancerProfilePayload(req.body);

    const profile = await FreelancerProfile.create({
      userId: req.user.id,
      ...payload
    });

    // Ensure Reputation record exists for this freelancer
    let reputation = await Reputation.findOne({ userId: req.user.id });
    if (!reputation) {
      reputation = await Reputation.create({
        userId: req.user.id
      });
    }

    // Calculate and populate reputation scores based on existing data
    try {
      await ReputationService.recalculateReputation(req.user.id);
    } catch (error) {
      console.error('Failed to calculate initial reputation scores:', error);
      // Don't fail profile creation if reputation calculation fails
    }

    res.status(201).json({
      status: 'success',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update freelancer profile
// @route   PUT /api/freelancers/profile
// @access  Private (Freelancer/Both)
export const updateFreelancerProfile = async (req, res, next) => {
  try {
    const payload = sanitizeFreelancerProfilePayload(req.body);

    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId: req.user.id },
      payload,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    res.json({
      status: 'success',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add portfolio item
// @route   POST /api/freelancers/portfolio
// @access  Private (Freelancer/Both)
export const addPortfolioItem = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    profile.portfolio.push(req.body);
    await profile.save();

    res.status(201).json({
      status: 'success',
      data: { portfolio: profile.portfolio }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update portfolio item
// @route   PUT /api/freelancers/portfolio/:itemId
// @access  Private (Freelancer/Both)
export const updatePortfolioItem = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    const item = profile.portfolio.id(req.params.itemId);
    if (!item) {
      return next(new AppError('Portfolio item not found', 404));
    }

    Object.assign(item, req.body);
    await profile.save();

    res.json({
      status: 'success',
      data: { portfolio: profile.portfolio }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete portfolio item
// @route   DELETE /api/freelancers/portfolio/:itemId
// @access  Private (Freelancer/Both)
export const deletePortfolioItem = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    profile.portfolio.pull(req.params.itemId);
    await profile.save();

    res.json({
      status: 'success',
      message: 'Portfolio item removed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add appreciation to a portfolio item
// @route   POST /api/freelancers/portfolio/:itemId/appreciate
// @access  Private (Any authenticated user)
export const addAppreciation = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Find profile that owns this portfolio item
    const profile = await FreelancerProfile.findOne({ 'portfolio._id': itemId }).populate('userId', '_id');

    if (!profile) {
      return next(new AppError('Portfolio item not found', 404));
    }

    const item = profile.portfolio.id(itemId);
    if (!item) {
      return next(new AppError('Portfolio item not found', 404));
    }

    // Prevent users from appreciating their own work
    if (profile.userId && profile.userId._id && profile.userId._id.toString() === req.user.id.toString()) {
      return next(new AppError('You cannot appreciate your own work', 400));
    }

    if (!item.appreciations) {
      item.appreciations = [];
    }

    const alreadyAppreciated = item.appreciations.some(
      (userId) => userId.toString() === req.user.id.toString()
    );

    if (!alreadyAppreciated) {
      item.appreciations.push(req.user.id);
      await profile.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        appreciated: true,
        count: item.appreciations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove appreciation from a portfolio item
// @route   DELETE /api/freelancers/portfolio/:itemId/appreciate
// @access  Private (Any authenticated user)
export const removeAppreciation = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const profile = await FreelancerProfile.findOne({ 'portfolio._id': itemId });

    if (!profile) {
      return next(new AppError('Portfolio item not found', 404));
    }

    const item = profile.portfolio.id(itemId);
    if (!item) {
      return next(new AppError('Portfolio item not found', 404));
    }

    if (item.appreciations && item.appreciations.length > 0) {
      item.appreciations = item.appreciations.filter(
        (userId) => userId.toString() !== req.user.id.toString()
      );
      await profile.save();
    }

    res.json({
      status: 'success',
      data: {
        appreciated: false,
        count: item.appreciations ? item.appreciations.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add endorsement
// @route   POST /api/freelancers/:id/endorse
// @access  Private
export const addEndorsement = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.params.id });

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    // Check if already endorsed
    const alreadyEndorsed = profile.endorsements.some(
      e => e.endorsedBy.toString() === req.user.id.toString()
    );

    if (alreadyEndorsed) {
      return next(new AppError('You have already endorsed this freelancer', 400));
    }

    profile.endorsements.push({
      endorsedBy: req.user.id,
      skill: req.body.skill,
      message: req.body.message
    });

    await profile.save();

    res.status(201).json({
      status: 'success',
      data: { endorsements: profile.endorsements }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search freelancers
// @route   GET /api/freelancers/search
// @access  Public
export const searchFreelancers = async (req, res, next) => {
  try {
    const { q, lat, lng, radius = 50 } = req.query;

    const query = {};

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { 'skills.name': { $regex: q, $options: 'i' } }
      ];
    }

    // CRITICAL: Exclude banned users
    const bannedUsers = await User.find({ isBanned: true }).select('_id');
    const bannedUserIds = bannedUsers.map(u => u._id);
    query.userId = { $nin: bannedUserIds };

    const freelancers = await FreelancerProfile.find(query)
      .populate('userId', '-passwordHash')
      .limit(20);

    res.json({
      status: 'success',
      data: { freelancers }
    });
  } catch (error) {
    next(error);
  }
};
