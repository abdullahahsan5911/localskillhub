import Proposal from '../models/Proposal.js';
import Job from '../models/Job.js';
import { AppError } from '../middleware/errorHandler.js';

// @desc    Get proposals
// @route   GET /api/proposals
// @access  Private
export const getProposals = async (req, res, next) => {
  try {
    const { jobId, status } = req.query;

    const query = {};
    
    // If user is freelancer, show their proposals
    // If user is client, show proposals for their jobs
    if (req.user.role === 'freelancer') {
      query.freelancerId = req.user.id;
    } else if (req.user.role === 'client') {
      const jobs = await Job.find({ clientId: req.user.id }).select('_id');
      query.jobId = { $in: jobs.map(j => j._id) };
    }

    if (jobId) query.jobId = jobId;
    if (status) query.status = status;

    const proposals = await Proposal.find(query)
      .populate('jobId', 'title budget')
      .populate('freelancerId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { proposals }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single proposal
// @route   GET /api/proposals/:id
// @access  Private
export const getProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('jobId')
      .populate('freelancerId', 'name avatar location verifiedBadges');

    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }

    res.json({
      status: 'success',
      data: { proposal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create proposal
// @route   POST /api/proposals
// @access  Private (Freelancer/Both)
export const createProposal = async (req, res, next) => {
  try {
    const { jobId } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    if (job.status !== 'open') {
      return next(new AppError('Job is not accepting proposals', 400));
    }

    // Check if already proposed
    const existingProposal = await Proposal.findOne({
      jobId,
      freelancerId: req.user.id
    });

    if (existingProposal) {
      return next(new AppError('You have already submitted a proposal for this job', 400));
    }

    const proposal = await Proposal.create({
      freelancerId: req.user.id,
      ...req.body
    });

    // Update job applicants count
    job.applicants += 1;
    job.proposals.push(proposal._id);
    await job.save();

    res.status(201).json({
      status: 'success',
      data: { proposal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update proposal
// @route   PUT /api/proposals/:id
// @access  Private (Freelancer/Both)
export const updateProposal = async (req, res, next) => {
  try {
    let proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }

    if (proposal.freelancerId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    if (proposal.status !== 'sent') {
      return next(new AppError('Cannot edit proposal after it has been reviewed', 400));
    }

    proposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      data: { proposal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Withdraw proposal
// @route   DELETE /api/proposals/:id
// @access  Private (Freelancer/Both)
export const deleteProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }

    if (proposal.freelancerId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    await proposal.deleteOne();

    res.json({
      status: 'success',
      message: 'Proposal withdrawn'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept proposal
// @route   POST /api/proposals/:id/accept
// @access  Private (Client/Both)
export const acceptProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('jobId');

    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }

    if (proposal.jobId.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    proposal.status = 'accepted';
    proposal.respondedAt = Date.now();
    await proposal.save();

    // Update job
    proposal.jobId.status = 'in-progress';
    proposal.jobId.hiredFreelancer = proposal.freelancerId;
    await proposal.jobId.save();

    // Reject other proposals
    await Proposal.updateMany(
      { jobId: proposal.jobId._id, _id: { $ne: proposal._id } },
      { status: 'rejected' }
    );

    res.json({
      status: 'success',
      data: { proposal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject proposal
// @route   POST /api/proposals/:id/reject
// @access  Private (Client/Both)
export const rejectProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('jobId');

    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }

    if (proposal.jobId.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    proposal.status = 'rejected';
    proposal.respondedAt = Date.now();
    await proposal.save();

    res.json({
      status: 'success',
      data: { proposal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw proposal
// @route   POST /api/proposals/:id/withdraw
// @access  Private (Freelancer/Both)
export const withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }

    if (proposal.freelancerId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    proposal.status = 'withdrawn';
    await proposal.save();

    res.json({
      status: 'success',
      data: { proposal }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add negotiation message
// @route   POST /api/proposals/:id/negotiate
// @access  Private
export const addNegotiation = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }

    const by = req.user.role === 'freelancer' || proposal.freelancerId.toString() === req.user.id.toString()
      ? 'freelancer'
      : 'client';

    proposal.negotiationHistory.push({
      by,
      message: req.body.message,
      proposedAmount: req.body.proposedAmount
    });

    await proposal.save();

    res.json({
      status: 'success',
      data: { proposal }
    });
  } catch (error) {
    next(error);
  }
};
