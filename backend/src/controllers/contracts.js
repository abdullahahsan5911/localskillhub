import Contract from '../models/Contract.js';
import Job from '../models/Job.js';
import Proposal from '../models/Proposal.js';
import { AppError } from '../middleware/errorHandler.js';

export const getContracts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {
      $or: [
        { clientId: req.user.id },
        { freelancerId: req.user.id }
      ]
    };
    if (status) query.status = status;

    const contracts = await Contract.find(query)
      .populate('jobId', 'title')
      .populate('clientId', 'name avatar')
      .populate('freelancerId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: { contracts } });
  } catch (error) {
    next(error);
  }
};

export const getContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('jobId')
      .populate('clientId')
      .populate('freelancerId');

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const createContract = async (req, res, next) => {
  try {
    const contract = await Contract.create(req.body);
    res.status(201).json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const updateContract = async (req, res, next) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const signContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    const userType = contract.clientId.toString() === req.user.id.toString() ? 'client' : 'freelancer';
    
    contract.signatures[userType] = {
      signed: true,
      signedAt: Date.now(),
      ipAddress: req.ip
    };
    
    await contract.save();
    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const submitMilestone = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    const milestone = contract.milestones.id(req.params.milestoneId);
    
    milestone.status = 'submitted';
    milestone.submittedAt = Date.now();
    milestone.deliverables = req.body.deliverables;
    
    await contract.save();
    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const approveMilestone = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    const milestone = contract.milestones.id(req.params.milestoneId);
    
    milestone.status = 'approved';
    milestone.approvedAt = Date.now();
    
    await contract.save();
    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const requestRevision = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    const milestone = contract.milestones.id(req.params.milestoneId);
    
    milestone.status = 'revision-requested';
    milestone.feedback = req.body.feedback;
    
    await contract.save();
    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const releasePayment = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    const milestone = contract.milestones.id(req.params.milestoneId);
    
    milestone.status = 'paid';
    milestone.paidAt = Date.now();
    contract.totalPaid += milestone.amount;
    
    await contract.save();
    res.json({ status: 'success', message: 'Payment released', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const initiateDispute = async (req, res, next) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        status: 'disputed',
        disputeReason: req.body.reason
      },
      { new: true }
    );
    
    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};
