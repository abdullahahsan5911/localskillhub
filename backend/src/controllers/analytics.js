import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Proposal from '../models/Proposal.js';
import Contract from '../models/Contract.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import User from '../models/User.js';
import Reputation from '../models/Reputation.js';

/**
 * Freelancer Dashboard Analytics
 * Returns: Profile views, proposal success, earnings forecast, local leaderboard
 */
export const getFreelancerAnalytics = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Freelancer profile not found'
      });
    }

    // Get all proposals
    const proposals = await Proposal.find({ freelancerId: req.user.id });
    const acceptedProposals = proposals.filter(p => p.status === 'accepted');
    const viewedProposals = proposals.filter(p => p.viewedAt);
    const shortlistedProposals = proposals.filter(p => p.status === 'shortlisted');
    
    // Get contracts and earnings
    const contracts = await Contract.find({ freelancerId: req.user.id });
    const activeContracts = contracts.filter(c => c.status === 'active');
    const completedContracts = contracts.filter(c => c.status === 'completed');
    
    // Calculate earnings
    const currentMonthEarnings = contracts
      .filter(c => {
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        const completedDate = c.actualEndDate || c.updatedAt;
        const contractMonth = new Date(completedDate).getMonth();
        const contractYear = new Date(completedDate).getFullYear();
        return month === contractMonth && year === contractYear && c.status === 'completed';
      })
      .reduce((sum, c) => sum + (c.amount?.total || 0), 0);
    
    // Get last 6 months earnings for forecast
    const earningsHistory = await getEarningsHistory(req.user.id, 6);
    const earningsForecast = calculateEarningsForecast(earningsHistory);
    
    // Calculate local leaderboard rank
    const localRank = await getLocalLeaderboardRank(req.user.id, user.location?.city);
    
    // Get reputation score
    const reputation = await Reputation.findOne({ userId: req.user.id });

    const analytics = {
      // Profile metrics
      profileViews: profile.profileViews || 0,
      profileCompleteness: calculateProfileCompleteness(profile),
      
      // Proposal metrics
      proposalsSent: proposals.length,
      proposalsViewed: viewedProposals.length,
      proposalsShortlisted: shortlistedProposals.length,
      proposalsAccepted: acceptedProposals.length,
      proposalSuccessRate: proposals.length > 0 
        ? parseFloat((acceptedProposals.length / proposals.length * 100).toFixed(2)) 
        : 0,
      proposalViewRate: proposals.length > 0
        ? parseFloat((viewedProposals.length / proposals.length * 100).toFixed(2))
        : 0,
      
      // Job/Contract metrics
      activeContracts: activeContracts.length,
      completedJobs: profile.completedJobs || 0,
      successRate: profile.successRate || 0,
      
      // Earnings
      totalEarnings: profile.totalEarnings || 0,
      currentMonthEarnings,
      earningsHistory,
      earningsForecast,
      
      // Ratings & Reputation
      averageRating: profile.ratings?.average || 0,
      totalReviews: profile.ratings?.count || 0,
      ratingDistribution: profile.ratings?.distribution || {},
      reputationScore: reputation?.overallScore || 0,
      localTrustScore: reputation?.localTrustScore || 0,
      skillTrustScore: reputation?.skillTrustScore || 0,
      
      // Performance
      responseTime: profile.responseTime || 24,
      onTimeDeliveryRate: calculateOnTimeDeliveryRate(completedContracts),
      
      // Local rankings
      localRank,
      localScore: profile.localScore || 0,
      globalScore: profile.globalScore || 0
    };

    res.json({
      status: 'success',
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Client Dashboard Analytics
 * Returns: Jobs posted, proposals received, interview rate, hire rate, spend insights
 */
export const getClientAnalytics = async (req, res, next) => {
  try {
    const jobs = await Job.find({ clientId: req.user.id });
    const openJobs = jobs.filter(j => j.status === 'open');
    const activeJobs = jobs.filter(j => j.status === 'in-progress');
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const cancelledJobs = jobs.filter(j => j.status === 'cancelled');

    // Get all proposals for client's jobs
    const proposals = await Proposal.find({
      jobId: { $in: jobs.map(j => j._id) }
    });
    
    const shortlistedProposals = proposals.filter(p => p.status === 'shortlisted');
    const interviewedProposals = proposals.filter(p => 
      p.status === 'shortlisted' || p.status === 'accepted'
    );

    // Get contracts and spending
    const contracts = await Contract.find({ clientId: req.user.id });
    const activeContracts = contracts.filter(c => c.status === 'active');
    const completedContracts = contracts.filter(c => c.status === 'completed');
    
    // Calculate spending
    const totalSpent = contracts
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + (c.amount?.total || 0), 0);
    
    const currentMonthSpent = contracts
      .filter(c => {
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        const completedDate = c.actualEndDate || c.updatedAt;
        const contractMonth = new Date(completedDate).getMonth();
        const contractYear = new Date(completedDate).getFullYear();
        return month === contractMonth && year === contractYear && c.status === 'completed';
      })
      .reduce((sum, c) => sum + (c.amount?.total || 0), 0);
    
    const pendingPayments = contracts
      .filter(c => c.paymentStatus === 'escrow' || c.paymentStatus === 'pending')
      .reduce((sum, c) => sum + (c.amount?.total || 0), 0);
    
    // Get spend history (last 6 months)
    const spendHistory = await getSpendHistory(req.user.id, 6);
    
    // Calculate rates
    const interviewRate = proposals.length > 0
      ? parseFloat((interviewedProposals.length / proposals.length * 100).toFixed(2))
      : 0;
    
    const hireRate = jobs.length > 0
      ? parseFloat((completedJobs.length / jobs.length * 100).toFixed(2))
      : 0;
    
    const proposalsToHireRate = proposals.length > 0
      ? parseFloat((completedContracts.length / proposals.length * 100).toFixed(2))
      : 0;

    const analytics = {
      // Job metrics
      jobsPosted: jobs.length,
      openJobs: openJobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      cancelledJobs: cancelledJobs.length,
      
      // Proposal metrics
      totalProposalsReceived: proposals.length,
      avgProposalsPerJob: jobs.length > 0 
        ? parseFloat((proposals.length / jobs.length).toFixed(2)) 
        : 0,
      shortlistedProposals: shortlistedProposals.length,
      
      // Rates
      interviewRate,  // % of proposals that were interviewed/shortlisted
      hireRate,       // % of jobs that resulted in completed work
      proposalsToHireRate, // % of proposals that resulted in hire
      
      // Spending insights
      totalSpent,
      currentMonthSpent,
      pendingPayments,
      spendHistory,
      avgJobValue: completedJobs.length > 0
        ? parseFloat((totalSpent / completedJobs.length).toFixed(2))
        : 0,
      
      // Contract metrics
      activeContracts: activeContracts.length,
      completedContracts: completedContracts.length,
      
      // Time metrics
      avgTimeToHire: calculateAvgTimeToHire(jobs, contracts)
    };

    res.json({
      status: 'success',
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalJobs,
      activeJobs,
      totalFreelancers,
      totalContracts,
      totalEarnings
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
      FreelancerProfile.countDocuments(),
      Contract.countDocuments(),
      FreelancerProfile.aggregate([
        { $group: { _id: null, total: { $sum: '$totalEarnings' } } }
      ])
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalJobs,
          activeJobs,
          totalFreelancers,
          totalContracts,
          totalEarnings: totalEarnings[0]?.total || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Local Leaderboard
 * Returns top freelancers in a specific city
 */
export const getLocalLeaderboard = async (req, res, next) => {
  try {
    const { city, limit = 10 } = req.query;
    
    if (!city) {
      return res.status(400).json({
        status: 'error',
        message: 'City parameter is required'
      });
    }

    // Find top freelancers in the city
    const users = await User.find({
      'location.city': city,
      role: { $in: ['freelancer', 'both'] }
    }).select('_id');

    const leaderboard = await FreelancerProfile.find({
      userId: { $in: users.map(u => u._id) }
    })
    .populate('userId', 'name avatar location')
    .sort({ localScore: -1 })
    .limit(parseInt(limit));

    res.json({
      status: 'success',
      data: {
        city,
        leaderboard: leaderboard.map((profile, index) => ({
          rank: index + 1,
          userId: profile.userId._id,
          name: profile.userId.name,
          avatar: profile.userId.avatar,
          title: profile.title,
          localScore: profile.localScore,
          globalScore: profile.globalScore,
          averageRating: profile.ratings?.average || 0,
          completedJobs: profile.completedJobs || 0,
          skills: profile.skills.slice(0, 5).map(s => s.name)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Helper Functions ====================

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(profile) {
  let score = 0;
  const maxScore = 100;

  // Basic info (30 points)
  if (profile.title) score += 10;
  if (profile.bio && profile.bio.length > 50) score += 10;
  if (profile.avatar) score += 10;

  // Skills (15 points)
  if (profile.skills && profile.skills.length > 0) score += 10;
  if (profile.skills && profile.skills.length >= 5) score += 5;

  // Portfolio (20 points)
  if (profile.portfolio && profile.portfolio.length > 0) score += 15;
  if (profile.portfolio && profile.portfolio.length >= 3) score += 5;

  // Rates (10 points)
  if (profile.rates && profile.rates.minRate) score += 10;

  // Availability (10 points)
  if (profile.availability && profile.availability.status) score += 10;

  // Education/Certifications (10 points)
  if (profile.education && profile.education.length > 0) score += 5;
  if (profile.certifications && profile.certifications.length > 0) score += 5;

  // Languages (5 points)
  if (profile.languages && profile.languages.length > 0) score += 5;

  return Math.min(score, maxScore);
}

/**
 * Get earnings history for last N months
 */
async function getEarningsHistory(userId, months = 6) {
  const history = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const earnings = await Contract.aggregate([
      {
        $match: {
          freelancerId: userId,
          status: 'completed',
          $or: [
            { actualEndDate: { $gte: monthStart, $lte: monthEnd } },
            { 
              actualEndDate: { $exists: false },
              updatedAt: { $gte: monthStart, $lte: monthEnd }
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount.total' }
        }
      }
    ]);

    history.push({
      month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
      earnings: earnings[0]?.total || 0
    });
  }

  return history;
}

/**
 * Calculate earnings forecast based on historical data
 */
function calculateEarningsForecast(earningsHistory) {
  if (earningsHistory.length < 3) {
    return { nextMonth: 0, confidence: 'low' };
  }

  // Simple moving average of last 3 months
  const last3Months = earningsHistory.slice(-3);
  const average = last3Months.reduce((sum, month) => sum + month.earnings, 0) / 3;

  // Calculate trend
  const firstHalf = earningsHistory.slice(0, Math.floor(earningsHistory.length / 2));
  const secondHalf = earningsHistory.slice(Math.floor(earningsHistory.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, m) => sum + m.earnings, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, m) => sum + m.earnings, 0) / secondHalf.length;
  
  const trend = secondAvg > firstAvg ? 'growing' : secondAvg < firstAvg ? 'declining' : 'stable';
  const growthRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) : 0;

  return {
    nextMonth: parseFloat(average.toFixed(2)),
    confidence: earningsHistory.length >= 6 ? 'high' : 'medium',
    trend,
    growthRate: parseFloat((growthRate * 100).toFixed(2))
  };
}

/**
 * Get local leaderboard rank for a user
 */
async function getLocalLeaderboardRank(userId, city) {
  if (!city) return null;

  try {
    const users = await User.find({
      'location.city': city,
      role: { $in: ['freelancer', 'both'] }
    }).select('_id');

    const profiles = await FreelancerProfile.find({
      userId: { $in: users.map(u => u._id) }
    })
    .sort({ localScore: -1 })
    .select('userId localScore');

    const rank = profiles.findIndex(p => p.userId.toString() === userId.toString());
    
    return rank >= 0 ? {
      rank: rank + 1,
      totalFreelancers: profiles.length,
      city,
      percentile: parseFloat(((profiles.length - rank) / profiles.length * 100).toFixed(2))
    } : null;
  } catch (error) {
    console.error('Error calculating local rank:', error);
    return null;
  }
}

/**
 * Calculate on-time delivery rate
 */
function calculateOnTimeDeliveryRate(completedContracts) {
  if (completedContracts.length === 0) return 100;

  const onTimeDeliveries = completedContracts.filter(c => {
    if (!c.endDate || !c.actualEndDate) return true;
    return new Date(c.actualEndDate) <= new Date(c.endDate);
  }).length;

  return parseFloat((onTimeDeliveries / completedContracts.length * 100).toFixed(2));
}

/**
 * Get spend history for client (last N months)
 */
async function getSpendHistory(clientId, months = 6) {
  const history = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const spending = await Contract.aggregate([
      {
        $match: {
          clientId,
          status: 'completed',
          $or: [
            { actualEndDate: { $gte: monthStart, $lte: monthEnd } },
            { 
              actualEndDate: { $exists: false },
              updatedAt: { $gte: monthStart, $lte: monthEnd }
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount.total' },
          count: { $sum: 1 }
        }
      }
    ]);

    history.push({
      month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
      spent: spending[0]?.total || 0,
      jobs: spending[0]?.count || 0
    });
  }

  return history;
}

/**
 * Calculate average time to hire
 */
function calculateAvgTimeToHire(jobs, contracts) {
  const hiredJobs = jobs.filter(j => 
    contracts.some(c => c.jobId?.toString() === j._id.toString())
  );

  if (hiredJobs.length === 0) return 0;

  const totalDays = hiredJobs.reduce((sum, job) => {
    const contract = contracts.find(c => c.jobId?.toString() === job._id.toString());
    if (!contract) return sum;
    
    const jobDate = new Date(job.createdAt);
    const contractDate = new Date(contract.createdAt);
    const days = Math.floor((contractDate - jobDate) / (1000 * 60 * 60 * 24));
    
    return sum + days;
  }, 0);

  return parseFloat((totalDays / hiredJobs.length).toFixed(1));
}
