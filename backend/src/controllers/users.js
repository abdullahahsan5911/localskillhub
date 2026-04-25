import User from '../models/User.js';
import Job from '../models/Job.js';
import Follow from '../models/Follow.js';
import Reputation from '../models/Reputation.js';
import VerificationRequest from '../models/VerificationRequest.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import { AppError } from '../middleware/errorHandler.js';

// @desc    Get all users (ADMIN ONLY - prevents data scraping)
// @route   GET /api/users
// @access  Admin Only
export const getUsers = async (req, res, next) => {
  try {
    // ✅ SECURITY: Check if user is admin
    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can access user list', 403));
    }

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
      .select('-passwordHash -firebaseUid')
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

// @desc    Get public user profile (anyone can access - safe data only)
// @route   GET /api/users/:id
// @access  Public (but filtered)
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // CRITICAL: Prevent viewing banned user profiles
    if (user.isBanned) {
      return next(new AppError('User profile not found', 404));
    }

    // ✅ SECURITY: Return only safe public data
    res.json({
      status: 'success',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (ownership check + admin override)
// @route   PUT /api/users/:id
// @access  Private (own profile or admin)
export const updateUser = async (req, res, next) => {
  try {
    // ✅ SECURITY: Check ownership OR admin role
    if (req.params.id !== req.user.id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to update this user', 403));
    }

    // ✅ SECURITY: Prevent privilege escalation (non-admins can't change role)
    if (req.body.role && req.user.role !== 'admin') {
      return next(new AppError('Cannot modify role', 403));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash -firebaseUid');

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete onboarding
// @route   POST /api/users/onboarding/complete
// @access  Private
export const completeOnboarding = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        'onboarding.completed': true,
        'onboarding.skipped': false,
        'onboarding.completedAt': new Date(),
        'onboarding.lastStep': 3,
        // Keep legacy field in sync
        'onboardingCompleted': true
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash -firebaseUid');

    res.json({
      status: 'success',
      message: 'Onboarding completed successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Skip onboarding
// @route   POST /api/users/onboarding/skip
// @access  Private
export const skipOnboarding = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        'onboarding.completed': false,
        'onboarding.skipped': true,
        'onboarding.skippedAt': new Date(),
        'onboarding.lastStep': req.body.lastStep || 1
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash -firebaseUid');

    res.json({
      status: 'success',
      message: 'Onboarding skipped',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account (permanent delete)
// @route   DELETE /api/users/:id
// @access  Private (own account or admin)
export const deleteUser = async (req, res, next) => {
  try {
    // ✅ SECURITY: Check ownership OR admin role
    if (req.params.id !== req.user.id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this user', 403));
    }

    const userId = req.params.id;
    const targetUser = await User.findById(userId).select('role');

    if (!targetUser) {
      return next(new AppError('User not found', 404));
    }

    // 1. If freelancer, delete freelancer profile
    if (targetUser.role === 'freelancer') {
      await FreelancerProfile.findOneAndDelete({ userId });
    }

    // 2. Delete verification requests
    await VerificationRequest.deleteMany({ userId });

    // 3. Delete reputation data
    await Reputation.deleteMany({ userId });

    // 4. Delete follows
    await Follow.deleteMany({ $or: [{ followerId: userId }, { followedId: userId }] });

    // 5. Delete specific jobs (if client)
    if (targetUser.role === 'client') {
      await Job.deleteMany({ clientId: userId });
    }

    // 6. Finally delete the user itself
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      message: 'Account and all associated data deleted successfully'
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

    // Check already following using Follow collection
    const existing = await Follow.findOne({ followerId: currentId, followingId: targetId });
    if (existing) {
      return res.json({ status: 'success', message: 'Already following this user' });
    }

    // Create follow relation (normalized)
    await Follow.create({ followerId: currentId, followingId: targetId });

    // Maintain legacy arrays for backward compatibility
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

    // Remove normalized follow relation
    await Follow.findOneAndDelete({ followerId: currentId, followingId: targetId });

    // Maintain legacy arrays for backward compatibility
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

// @desc    Get follower/following counts for a user
// @route   GET /api/users/:id/follow/stats
// @access  Private
export const getFollowStats = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const [followers, following] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId })
    ]);

    res.json({
      status: 'success',
      data: {
        userId,
        followers,
        following
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get online users list
// @route   GET /api/users/presence/online
// @access  Private
export const getOnlineUsers = async (req, res, next) => {
  try {
    // Get online users from Socket.IO presence data
    const presenceData = global.presenceData;
    if (!presenceData) {
      return res.json({
        status: 'success',
        data: { onlineUsers: [] }
      });
    }

    const onlineUserIds = presenceData.getOnlineUsers();
    
    // Fetch minimal user data for online users
    const users = await User.find({ _id: { $in: onlineUserIds } })
      .select('_id name avatar role');

    res.json({
      status: 'success',
      data: { 
        onlineUsers: users,
        count: onlineUserIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's online status and last active time
// @route   GET /api/users/:id/presence
// @access  Private
export const getUserPresence = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('_id name lastActive isActive');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get real-time status from Socket.IO
    const presenceData = global.presenceData;
    let isOnline = false;
    let lastSeen = user.lastActive;

    if (presenceData) {
      const status = presenceData.getOnlineStatus(userId);
      isOnline = status.status === 'online';
      if (status.lastSeen) {
        lastSeen = status.lastSeen;
      }
    }

    const formatLastSeen = (date) => {
      if (!date) return null;
      const now = new Date();
      const diff = now - new Date(date);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    };

    res.json({
      status: 'success',
      data: {
        userId,
        isOnline,
        lastSeen,
        lastSeenFormatted: formatLastSeen(lastSeen),
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user's last active timestamp
// @route   POST /api/users/presence/update
// @access  Private
export const updateUserPresence = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      lastActive: new Date()
    });

    res.json({
      status: 'success',
      message: 'Presence updated'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user reputation
// @route   GET /api/users/:id/reputation
// @access  Public
export const getReputation = async (req, res, next) => {
  try {
    const reputation = await Reputation.findOne({ userId: req.params.id })
      .populate('userId', 'name email avatar role');
    
    if (!reputation) {
      return res.json({ 
        status: 'success', 
        data: { 
          userId: req.params.id,
          globalScore: 0,
          localScore: 0,
          trustScore: 0,
          communicationRating: 0,
          qualityRating: 0,
          reliabilityRating: 0,
          completedJobs: 0,
          totalReviews: 0,
          successRate: 0
        } 
      });
    }
    
    res.json({ status: 'success', data: reputation });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Request GitHub verification (Freelancers Only)
// @desc    Check if GitHub username exists
// @route   POST /api/users/verify/github/check
// @access  Protected (Freelancers only)
export const checkGithubAccount = async (req, res, next) => {
  try {
    const { githubUsername } = req.body;

    if (!githubUsername || githubUsername.trim().length === 0) {
      return next(new AppError('GitHub username is required', 400));
    }

    const cleanUsername = githubUsername.trim();

    // Validate GitHub username format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(cleanUsername)) {
      return next(new AppError('Invalid GitHub username. Username can only contain letters, numbers, and hyphens.', 400));
    }

    // Fetch GitHub profile data
    let githubData;
    try {
      const url = `https://api.github.com/users/${encodeURIComponent(cleanUsername)}`;
      const response = await fetch(url);
      if (!response.ok) {
        return next(new AppError(`GitHub user "${cleanUsername}" not found. Please check the username and try again.`, 404));
      }
      githubData = await response.json();
    } catch (err) {
      return next(new AppError('Failed to fetch GitHub profile. Please try again later.', 500));
    }

    res.json({
      status: 'success',
      message: `GitHub account "${cleanUsername}" found!`,
      data: {
        username: githubData.login,
        profileUrl: githubData.html_url,
        publicRepos: githubData.public_repos,
        followers: githubData.followers,
        bio: githubData.bio,
        avatarUrl: githubData.avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify and link GitHub account (must call checkGithubAccount first)
// @route   POST /api/users/verify/github
// @access  Protected (Freelancers only)
export const verifyGithub = async (req, res, next) => {
  try {
    const { enteredUsername, token } = req.body;
    const userId = req.user._id;

    // Only freelancers can verify GitHub
    if (req.user.role !== 'freelancer') {
      return next(new AppError('Only freelancers can verify GitHub account', 403));
    }

    if (!enteredUsername || enteredUsername.trim().length === 0) {
      return next(new AppError('GitHub username is required', 400));
    }

    const cleanUsername = enteredUsername.trim();

    // Validate GitHub username format
    if (!/^[a-zA-Z0-9-]+$/.test(cleanUsername)) {
      return next(new AppError('Invalid GitHub username format. Username can only contain letters, numbers, and hyphens.', 400));
    }

    if (!token) {
      return next(new AppError('GitHub authorization token is required', 400));
    }

    // Verify the token by fetching authenticated user's data from GitHub
    let authenticatedUser;
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!response.ok) {
        return next(new AppError('Invalid or expired GitHub token', 401));
      }
      authenticatedUser = await response.json();
    } catch (err) {
      return next(new AppError('Failed to validate GitHub token', 500));
    }

    // Verify that the authenticated user matches the entered username (case-insensitive)
    if (authenticatedUser.login.toLowerCase() !== cleanUsername.toLowerCase()) {
      return next(new AppError(
        `The GitHub account you authorized (@${authenticatedUser.login}) doesn't match the account you entered (@${cleanUsername}). Please authorize the correct GitHub account.`,
        400
      ));
    }

    // Check if this user already has a GitHub verification
    const existingVerification = await VerificationRequest.findOne({
      userId,
      type: 'github',
      status: { $in: ['pending', 'approved'] }
    });
    if (existingVerification) {
      return next(new AppError('You already have a pending or approved GitHub verification', 400));
    }

    // Check if this GitHub username is already verified on a DIFFERENT account
    const takenByOther = await User.findOne({
      'socialLinks.github': { $regex: new RegExp(`^https://github\.com/${cleanUsername}$`, 'i') },
      _id: { $ne: userId }
    });
    if (takenByOther) {
      return next(new AppError(`GitHub account @${cleanUsername} is already linked to another account.`, 400));
    }

    // Fetch full GitHub profile data
    let githubData;
    try {
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!response.ok) {
        return next(new AppError(`GitHub user "${cleanUsername}" not found`, 404));
      }
      githubData = await response.json();
    } catch (err) {
      return next(new AppError('Failed to fetch GitHub profile', 500));
    }

    // Create verification request with GitHub data (auto-approved since user authorized)
    const verificationRequest = await VerificationRequest.create({
      userId,
      type: 'github',
      status: 'approved', // Auto-approve since user authorized via OAuth
      submittedData: {
        username: cleanUsername,
        profileUrl: githubData.html_url,
        publicRepos: githubData.public_repos,
        followers: githubData.followers,
        following: githubData.following,
        bio: githubData.bio,
        company: githubData.company,
        location: githubData.location,
        blog: githubData.blog,
        createdAt: githubData.created_at,
        updatedAt: githubData.updated_at,
        avatarUrl: githubData.avatar_url,
        authorizedViaOAuth: true
      }
    });

    // Update user's GitHub social link and add verified badge
    req.user.socialLinks = req.user.socialLinks || {};
    req.user.socialLinks.github = githubData.html_url;
    
    // Auto-add GitHub badge when OAuth authorized
    req.user.verifiedBadges = req.user.verifiedBadges || [];
    const githubBadgeExists = req.user.verifiedBadges.some((b) => b.type === 'github');
    if (!githubBadgeExists) {
      req.user.verifiedBadges.push({
        type: 'github',
        verifiedAt: new Date(),
        data: { username: cleanUsername, profileUrl: githubData.html_url }
      });
    }
    
    await req.user.save();

    res.status(201).json({
      status: 'success',
      message: 'GitHub account authorized and verified successfully!',
      data: {
        verificationId: verificationRequest._id,
        status: verificationRequest.status,
        githubData: {
          username: cleanUsername,
          profileUrl: githubData.html_url,
          publicRepos: githubData.public_repos,
          followers: githubData.followers,
          bio: githubData.bio,
          avatarUrl: githubData.avatar_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify GitHub for users who signed in via GitHub OAuth (SSO)
// @route   POST /api/users/verify/github/sso
// @access  Protected (Freelancers who signed in with GitHub only)
export const verifyGithubSso = async (req, res, next) => {
  try {
    const { enteredUsername } = req.body;
    const userId = req.user._id;

    if (req.user.role !== 'freelancer') {
      return next(new AppError('Only freelancers can verify GitHub account', 403));
    }

    if (!enteredUsername || enteredUsername.trim().length === 0) {
      return next(new AppError('GitHub username is required', 400));
    }

    const cleanUsername = enteredUsername.trim();

    if (!/^[a-zA-Z0-9-]+$/.test(cleanUsername)) {
      return next(new AppError('Invalid GitHub username format', 400));
    }

    // Check if this user already has a GitHub verification
    const existingVerification = await VerificationRequest.findOne({
      userId,
      type: 'github',
      status: { $in: ['pending', 'approved'] }
    });
    if (existingVerification) {
      return next(new AppError('You already have a pending or approved GitHub verification', 400));
    }

    const badgeExists = req.user.verifiedBadges?.some(b => b.type === 'github');
    if (badgeExists) {
      return next(new AppError('GitHub already verified on your account', 400));
    }

    // Check if this GitHub username is already verified on a DIFFERENT account
    const takenByOther = await User.findOne({
      'socialLinks.github': { $regex: new RegExp(`^https://github\.com/${cleanUsername}$`, 'i') },
      _id: { $ne: userId }
    });
    if (takenByOther) {
      return next(new AppError(`GitHub account @${cleanUsername} is already linked to another account.`, 400));
    }

    // Fetch public GitHub profile to confirm the username exists
    let githubData;
    try {
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`);
      if (!response.ok) {
        return next(new AppError(`GitHub user "${cleanUsername}" not found`, 404));
      }
      githubData = await response.json();
    } catch (err) {
      return next(new AppError('Failed to fetch GitHub profile', 500));
    }

    // User is authenticated via GitHub SSO — we trust ownership
    const verificationRequest = await VerificationRequest.create({
      userId,
      type: 'github',
      status: 'approved',
      submittedData: {
        username: cleanUsername,
        profileUrl: githubData.html_url,
        publicRepos: githubData.public_repos,
        followers: githubData.followers,
        bio: githubData.bio,
        avatarUrl: githubData.avatar_url,
        authorizedViaOAuth: true,
        verificationMethod: 'github-sso'
      }
    });

    req.user.socialLinks = req.user.socialLinks || {};
    req.user.socialLinks.github = githubData.html_url;
    req.user.verifiedBadges = req.user.verifiedBadges || [];
    req.user.verifiedBadges.push({
      type: 'github',
      verifiedAt: new Date(),
      data: { username: cleanUsername, profileUrl: githubData.html_url }
    });
    await req.user.save();

    res.status(201).json({
      status: 'success',
      message: 'GitHub account verified successfully!',
      data: {
        verificationId: verificationRequest._id,
        status: 'approved',
        githubData: {
          username: cleanUsername,
          profileUrl: githubData.html_url,
          publicRepos: githubData.public_repos,
          followers: githubData.followers,
          bio: githubData.bio,
          avatarUrl: githubData.avatar_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit verified badge application (after completing all verifications)
// @route   POST /api/users/verification/submit-verified-badge
// @access  Private
export const submitVerifiedBadge = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if user is freelancer or client
    if (!['freelancer', 'client'].includes(req.user.role)) {
      return next(new AppError('Only freelancers and clients can submit verified badge applications', 403));
    }

    // Check if already verified
    const alreadyVerified = req.user.verifiedBadges?.some(b => b.type === 'verified');
    if (alreadyVerified) {
      return next(new AppError('You are already verified', 400));
    }

    // Check if email is verified
    if (!req.user.isEmailVerified) {
      return next(new AppError('Email verification is required', 400));
    }

    // Check if phone is verified
    if (!req.user.isPhoneVerified) {
      return next(new AppError('Phone verification is required', 400));
    }

    // Check if freelancer has GitHub verified (Badge OR OAuth)
    if (req.user.role === 'freelancer') {
      const hasGithubBadge = req.user.verifiedBadges?.some(b => b.type === 'github');
      const isGithubOAuth = req.user.provider === 'github';
      
      if (!hasGithubBadge && !isGithubOAuth) {
        return next(new AppError('GitHub verification is required for freelancers', 400));
      }
    }

    // Check for existing pending application
    const existingApplication = await VerificationRequest.findOne({
      userId,
      type: 'verified_badge',
      status: { $in: ['pending', 'approved'] }
    });
    if (existingApplication) {
      return next(new AppError('You already have a pending or approved verified badge application', 400));
    }

    // Create verification request with 1-day auto-approval timer
    const autoApproveAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const verificationRequest = await VerificationRequest.create({
      userId,
      type: 'verified_badge',
      status: 'pending',
      autoApproveAt,
      submittedData: {
        role: req.user.role,
        submittedAt: new Date(),
        verifications: {
          emailVerified: true,
          phoneVerified: true,
          githubVerified: req.user.role === 'freelancer'
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Verified badge application submitted successfully',
      data: {
        verificationRequest,
        autoApproveAt,
        message: 'Your application will be automatically approved in 24 hours if admin does not take action'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's verification status
// @route   GET /api/users/me/verification-status
// @access  Private
export const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const applicationStatus = await VerificationRequest.findOne({
      userId,
      type: 'verified_badge',
      status: { $in: ['pending', 'approved'] }
    });

    const isVerified = req.user.verifiedBadges?.some(b => b.type === 'verified') || false;
    const isGithubVerified = req.user.verifiedBadges?.some(b => b.type === 'github') || req.user.provider === 'github' || false;

    res.json({
      status: 'success',
      data: {
        isVerified,
        emailVerified: req.user.isEmailVerified || false,
        phoneVerified: req.user.isPhoneVerified || false,
        githubVerified: isGithubVerified,
        application: applicationStatus ? {
          id: applicationStatus._id,
          status: applicationStatus.status,
          submittedAt: applicationStatus.createdAt,
          autoApproveAt: applicationStatus.autoApproveAt,
          autoApproved: applicationStatus.autoApproved
        } : null,
        canSubmit: req.user.isEmailVerified && req.user.isPhoneVerified && 
                   (req.user.role === 'client' || isGithubVerified) &&
                   !isVerified && !applicationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
