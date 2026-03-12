import FreelancerProfile from '../models/FreelancerProfile.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

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

    res.json({
      status: 'success',
      data: {
        freelancers,
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

    // Increment profile views
    freelancer.profileViews += 1;
    await freelancer.save();

    res.json({
      status: 'success',
      data: { freelancer }
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

    const profile = await FreelancerProfile.create({
      userId: req.user.id,
      ...req.body
    });

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
    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
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
