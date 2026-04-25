import Job from '../models/Job.js';
import { AppError } from '../middleware/errorHandler.js';
import GeoLocationService from '../services/geolocation.service.js';
import PlatformSettings from '../models/PlatformSettings.js';

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = 'open', category, skills, city, search, clientId, companyId } = req.query;

    const query = {};
    
    // Exclude deleted jobs from public listings
    query.isDeleted = { $ne: true };
    
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (companyId) query.companyId = companyId;
    if (category) query.category = category;
    if (skills) query.skills = { $in: Array.isArray(skills) ? skills : [skills] };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const jobs = await Job.find(query)
      .populate('clientId', 'name avatar location')
      .populate('hiredFreelancer', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ isFeatured: -1, createdAt: -1 });

    const count = await Job.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        jobs,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'name avatar location verifiedBadges')
      .populate('proposals');

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.json({
      status: 'success',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get jobs posted by the current client
// @route   GET /api/jobs/my
// @access  Private (Client/Both)
export const getMyJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};

    // For company clients, show jobs for their company; otherwise show personal jobs
    if (req.user.accountType === 'company' && req.user.companyId) {
      query.companyId = req.user.companyId;
    } else {
      query.clientId = req.user.id;
    }
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('clientId', 'name avatar location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Job.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        jobs,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create job
// @route   POST /api/jobs
// @access  Private (Client/Both)
export const createJob = async (req, res, next) => {
  try {
    // Validate and sanitize budget
    if (req.body.budget) {
      if (req.body.budget.amount !== undefined && req.body.budget.amount !== null) {
        req.body.budget.amount = Math.max(0, Number(req.body.budget.amount) || 0);
      }
      if (req.body.budget.min !== undefined && req.body.budget.min !== null) {
        req.body.budget.min = Math.max(0, Number(req.body.budget.min) || 0);
      }
      if (req.body.budget.max !== undefined && req.body.budget.max !== null) {
        req.body.budget.max = Math.max(0, Number(req.body.budget.max) || 0);
      }
    }

    const normalizedLocation = req.body.location
      ? await GeoLocationService.normalizeLocation(req.body.location)
      : undefined;

    let postedByType = 'user';
    let companyId;

    if (req.user.accountType === 'company' && req.user.companyId) {
      postedByType = 'company';
      companyId = req.user.companyId;
    }

    const settings = await PlatformSettings.findOne();
    if (settings && settings.maxActiveJobsPerClient) {
      const activeJobCount = await Job.countDocuments({
        clientId: req.user.id,
        status: 'open'
      });

      if (activeJobCount >= settings.maxActiveJobsPerClient) {
        return next(new AppError(`You cannot have more than ${settings.maxActiveJobsPerClient} active jobs. Please close an existing job first.`, 403));
      }
    }

    const job = await Job.create({
      ...req.body,
      clientId: req.user.id,
      postedByType,
      companyId,
      location: normalizedLocation || req.body.location,
    });

    res.status(201).json({
      status: 'success',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Client/Both)
export const updateJob = async (req, res, next) => {
  try {
    // Validate and sanitize budget
    if (req.body.budget) {
      if (req.body.budget.amount !== undefined && req.body.budget.amount !== null) {
        req.body.budget.amount = Math.max(0, Number(req.body.budget.amount) || 0);
      }
      if (req.body.budget.min !== undefined && req.body.budget.min !== null) {
        req.body.budget.min = Math.max(0, Number(req.body.budget.min) || 0);
      }
      if (req.body.budget.max !== undefined && req.body.budget.max !== null) {
        req.body.budget.max = Math.max(0, Number(req.body.budget.max) || 0);
      }
    }

    let job = await Job.findById(req.params.id);

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Check ownership
    if (job.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized to update this job', 403));
    }

    const updatePayload = { ...req.body };
    if (req.body.location) {
      updatePayload.location = await GeoLocationService.normalizeLocation(req.body.location);
    }

    job = await Job.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Client/Both)
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    if (job.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized to delete this job', 403));
    }

    await job.deleteOne();

    res.json({
      status: 'success',
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
export const searchJobs = async (req, res, next) => {
  try {
    const { q, minBudget, maxBudget } = req.query;

    const query = { status: 'open' };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    if (minBudget || maxBudget) {
      query['budget.amount'] = {};
      if (minBudget) query['budget.amount'].$gte = Number(minBudget);
      if (maxBudget) query['budget.amount'].$lte = Number(maxBudget);
    }

    const jobs = await Job.find(query)
      .populate('clientId', 'name avatar')
      .limit(20)
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { jobs }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby jobs
// @route   GET /api/jobs/nearby
// @access  Public
export const getNearbyJobs = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return next(new AppError('Please provide latitude and longitude', 400));
    }

    const jobs = await Job.find({
      status: 'open',
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('clientId', 'name avatar')
    .limit(20);

    res.json({
      status: 'success',
      data: { jobs }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite freelancers to job
// @route   POST /api/jobs/:id/invite
// @access  Private (Client/Both)
export const inviteFreelancers = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    if (job.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    const { freelancerIds } = req.body;
    
    job.invitedFreelancers = [...new Set([...job.invitedFreelancers, ...freelancerIds])];
    await job.save();

    // TODO: Send invitation emails/notifications

    res.json({
      status: 'success',
      message: 'Invitations sent',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};
