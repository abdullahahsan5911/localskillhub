import Job from '../models/Job.js';
import Proposal from '../models/Proposal.js';
import Contract from '../models/Contract.js';
import FreelancerProfile from '../models/FreelancerProfile.js';

export const getFreelancerAnalytics = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id });
    
    const proposals = await Proposal.find({ freelancerId: req.user.id });
    const acceptedProposals = proposals.filter(p => p.status === 'accepted');
    
    const contracts = await Contract.find({ freelancerId: req.user.id });
    const completedContracts = contracts.filter(c => c.status === 'completed');

    const analytics = {
      profileViews: profile?.profileViews || 0,
      proposalsSent: proposals.length,
      proposalsAccepted: acceptedProposals.length,
      successRate: proposals.length > 0 ? (acceptedProposals.length / proposals.length * 100).toFixed(2) : 0,
      completedJobs: profile?.completedJobs || 0,
      totalEarnings: profile?.totalEarnings || 0,
      averageRating: profile?.ratings.average || 0,
      localRank: null, // Calculate rank
      responseTime: profile?.responseTime || 24
    };

    res.json({
      status: 'success',
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
};

export const getClientAnalytics = async (req, res, next) => {
  try {
    const jobs = await Job.find({ clientId: req.user.id });
    const activeJobs = jobs.filter(j => j.status === 'in-progress');
    const completedJobs = jobs.filter(j => j.status === 'completed');

    const proposals = await Proposal.find({
      jobId: { $in: jobs.map(j => j._id) }
    });

    const contracts = await Contract.find({ clientId: req.user.id });
    const totalSpent = contracts.reduce((sum, c) => sum + c.totalPaid, 0);

    const analytics = {
      jobsPosted: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      totalProposals: proposals.length,
      avgProposalsPerJob: jobs.length > 0 ? (proposals.length / jobs.length).toFixed(2) : 0,
      totalSpent,
      hireRate: jobs.length > 0 ? (completedJobs.length / jobs.length * 100).toFixed(2) : 0
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
