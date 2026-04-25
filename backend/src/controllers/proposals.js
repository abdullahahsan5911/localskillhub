import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import Job from '../models/Job.js';
import Contract from '../models/Contract.js';
import { AppError } from '../middleware/errorHandler.js';
import PlatformSettings from '../models/PlatformSettings.js';

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
    // Validate and sanitize proposed rate amount
    if (req.body.proposedRate && req.body.proposedRate.amount !== undefined && req.body.proposedRate.amount !== null) {
      req.body.proposedRate.amount = Math.max(0, Number(req.body.proposedRate.amount) || 0);
    }

    // Validate estimated duration
    if (req.body.estimatedDuration && req.body.estimatedDuration.value !== undefined && req.body.estimatedDuration.value !== null) {
      req.body.estimatedDuration.value = Math.max(1, Number(req.body.estimatedDuration.value) || 1);
    }

    const { jobId } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    if (job.status !== 'open') {
      return next(new AppError('Job is not accepting proposals', 400));
    }

    const settings = await PlatformSettings.findOne();
    if (settings && settings.maxProposalsPerJob) {
      if (job.proposals.length >= settings.maxProposalsPerJob) {
        return next(new AppError(`This job has reached its maximum limit of ${settings.maxProposalsPerJob} proposals.`, 403));
      }
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

    // If already accepted, just return existing contract (idempotent behavior)
    if (proposal.status === 'accepted') {
      const existingContract = await Contract.findOne({ proposalId: proposal._id });
      const canPay =
        !!existingContract &&
        existingContract.paymentStatus === 'pending' &&
        existingContract.status === 'draft';
      return res.json({
        status: 'success',
        data: { proposal, contract: existingContract, canPay },
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Reload proposal and job within the transaction
      const txProposal = await Proposal.findById(req.params.id)
        .populate('jobId')
        .session(session);

      if (!txProposal) {
        throw new AppError('Proposal not found', 404);
      }

      if (txProposal.jobId.clientId.toString() !== req.user.id.toString()) {
        throw new AppError('Not authorized', 403);
      }

      const job = txProposal.jobId;

      console.log('Hiring:', {
        proposalId: txProposal._id.toString(),
        jobId: job._id.toString(),
        clientId: req.user.id.toString(),
      });

      // Prevent hiring if job is no longer open or already has a hired freelancer
      if (job.status !== 'open' || job.hiredFreelancer) {
        throw new AppError('Job is not accepting new hires', 400);
      }

      txProposal.status = 'accepted';
      txProposal.respondedAt = Date.now();
      await txProposal.save({ session });

      job.status = 'in-progress';
      job.hiredFreelancer = txProposal.freelancerId;
      await job.save({ session });

      // Reject other proposals for this job
      await Proposal.updateMany(
        { jobId: job._id, _id: { $ne: txProposal._id } },
        { status: 'rejected' },
        { session }
      );

      // Ensure a contract exists for this accepted proposal (backend-driven contract creation)
      let contract = await Contract.findOne({ proposalId: txProposal._id }).session(session);

      if (!contract) {
        const totalAmount =
          (txProposal.proposedRate && txProposal.proposedRate.amount) ||
          (job.budget && job.budget.amount) ||
          0;

        const currency =
          (txProposal.proposedRate && txProposal.proposedRate.currency) ||
          (job.budget && job.budget.currency) ||
          'USD';

        const type =
          (txProposal.proposedRate && txProposal.proposedRate.type) ||
          (job.budget && job.budget.type) ||
          'fixed';

        let milestones = [];
        if (Array.isArray(txProposal.milestones) && txProposal.milestones.length > 0) {
          milestones = txProposal.milestones.map((m) => ({
            title: m.title || 'Milestone',
            description: m.description,
            amount: m.amount,
            dueDate: m.deliveryDate,
            status: 'pending',
          }));
        } else {
          milestones = [
            {
              title: 'Project Delivery',
              amount: totalAmount,
              status: 'pending',
            },
          ];
        }

        contract = await Contract.create(
          [
            {
              jobId: job._id,
              proposalId: txProposal._id,
              clientId: job.clientId,
              freelancerId: txProposal.freelancerId,
              title: `Contract for ${job.title}`,
              description: txProposal.coverLetter,
              amount: {
                total: totalAmount,
                type,
                currency,
              },
              milestones,
              offerStatus: 'accepted',
              paymentStatus: 'pending',
              status: 'draft',
            },
          ],
          { session }
        );

        contract = contract[0];
      }

      // Edge-case safety: if the contract is already in escrow, treat it as funded
      if (contract.paymentStatus === 'escrow') {
        await session.commitTransaction();
        session.endSession();

        const canPay = false;

        return res.json({
          status: 'success',
          data: { proposal: txProposal, contract, canPay },
        });
      }

      await session.commitTransaction();
      session.endSession();

      const canPay =
        contract.paymentStatus === 'pending' && contract.status === 'draft';

      res.json({
        status: 'success',
        data: { proposal: txProposal, contract, canPay },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
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
