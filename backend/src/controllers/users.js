import User from '../models/User.js';
import Job from '../models/Job.js';
import { AppError } from '../middleware/errorHandler.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, city } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (city) query['location.city'] = city;

    const users = await User.find(query)
      .select('-passwordHash')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res, next) => {
  try {
    // Only allow user to update their own profile
    if (req.params.id !== req.user.id.toString()) {
      return next(new AppError('Not authorized to update this user', 403));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash');

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
export const deleteUser = async (req, res, next) => {
  try {
    // Only allow user to delete their own profile
    if (req.params.id !== req.user.id.toString()) {
      return next(new AppError('Not authorized to delete this user', 403));
    }

    await User.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      status: 'success',
      message: 'User account deactivated'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user.id;

    if (targetId === currentId.toString()) {
      return next(new AppError('You cannot follow yourself', 400));
    }

    const target = await User.findById(targetId);
    if (!target) return next(new AppError('User not found', 404));

    // Check already following
    if (target.followers.map(f => f.toString()).includes(currentId.toString())) {
      return next(new AppError('Already following this user', 400));
    }

    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentId } });
    await User.findByIdAndUpdate(currentId, { $addToSet: { following: targetId } });

    res.json({ status: 'success', message: 'Followed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
export const unfollowUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user.id;

    await User.findByIdAndUpdate(targetId, { $pull: { followers: currentId } });
    await User.findByIdAndUpdate(currentId, { $pull: { following: targetId } });

    res.json({ status: 'success', message: 'Unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bookmark a job for the current user
// @route   POST /api/users/me/bookmarks
// @access  Private
export const addJobBookmark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    if (!jobId) {
      return next(new AppError('Job ID is required', 400));
    }

    const job = await Job.findById(jobId).select('_id');
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { savedJobs: jobId } });

    res.json({ status: 'success', message: 'Job bookmarked' });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a bookmarked job for the current user
// @route   DELETE /api/users/me/bookmarks/:jobId
// @access  Private
export const removeJobBookmark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    if (!jobId) {
      return next(new AppError('Job ID is required', 400));
    }

    await User.findByIdAndUpdate(userId, { $pull: { savedJobs: jobId } });

    res.json({ status: 'success', message: 'Job removed from bookmarks' });
  } catch (error) {
    next(error);
  }
};

