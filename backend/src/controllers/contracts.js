import Contract from '../models/Contract.js';
import Job from '../models/Job.js';
import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Transaction from '../models/Transaction.js';
import PlatformSettings from '../models/PlatformSettings.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import Dispute from '../models/Dispute.js';
import AdminNotification from '../models/AdminNotification.js';
import ReputationService from '../services/reputation.service.js';
import stripe from '../config/stripe.js';
import { getStripeCurrency } from '../config/currency.js';
import { AppError } from '../middleware/errorHandler.js';

const sanitizeMilestones = (milestones = []) => {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return [];
  }

  return milestones
    .filter((m) => m && Number(m.amount) > 0)
    .map((m) => ({
      title: m.title || 'Milestone',
      description: m.description || '',
      amount: Number(m.amount),
      dueDate: m.dueDate || undefined,
      status: 'pending',
    }));
};

const notifyUser = async (req, userId, payload) => {
  if (!userId) return;

  await AdminNotification.create({
    userId,
    ...payload,
  });

  const io = req.app?.get('io');
  if (io) {
    io.to(userId.toString()).emit('adminNotification', payload);
  }
};

const notifyAdmins = async (req, payload) => {
  const admins = await User.find({ role: 'admin' }).select('_id');
  await Promise.all(admins.map((admin) => notifyUser(req, admin._id, payload)));
};

// Shared helper to move a successful Stripe PaymentIntent into escrow state for a contract.
// Used by both the synchronous confirm endpoint and the asynchronous Stripe webhook handler.
const handleSuccessfulContractPayment = async (paymentIntent, existingContract = null) => {
  const contractId = paymentIntent?.metadata?.contractId;

  if (!contractId && !existingContract) {
    return null;
  }

  const contract = existingContract || (await Contract.findById(contractId));

  if (!contract) {
    return null;
  }

  // Idempotency guard: if already escrowed or released, just return
  // If already escrowed or released, don't double-apply
  if (contract.paymentStatus === 'escrow' || contract.paymentStatus === 'released') {
    return contract;
  }

  // Determine platform fee percentage (default 3%)
  let platformFeePercentage = 3;
  const settings = await PlatformSettings.findOne();
  if (settings?.platformFeePercentage) {
    platformFeePercentage = settings.platformFeePercentage;
  }

  const totalAmount = contract.amount?.total || 0; // Job price only
  const platformFee = (totalAmount * platformFeePercentage) / 100;
  const netAmount = totalAmount - platformFee;

  // Derive what the client actually paid from the PaymentIntent.
  // We intentionally allow the charged amount (clientTotal) to be greater
  // than the job price so Stripe processing fees are covered by the client.
  // Use exact Stripe amount divided by 100 to get the real charge
  const clientTotal = typeof paymentIntent.amount === 'number'
    ? paymentIntent.amount / 100
    : totalAmount;
  const processingFee = clientTotal - totalAmount;

  console.log('DEBUG handleSuccessfulContractPayment:', {
    contractId,
    totalAmount,
    paymentIntentAmount: paymentIntent?.amount,
    clientTotal,
    processingFee,
  });

  // Estimated processing fee we calculated at PaymentIntent creation time.
  // This comes from metadata and is kept separate from both processingFee
  // (extra charged to client) and actualStripeFee (real Stripe cost).
  const estimatedProcessingFee = paymentIntent?.metadata?.estimatedProcessingFee
    ? parseFloat(paymentIntent.metadata.estimatedProcessingFee)
    : 0;

  contract.paymentStatus = 'escrow';
  contract.status = 'active';
  contract.platformFee.percentage = platformFeePercentage;
  contract.platformFee.amount = platformFee;
  await contract.save();

  // Idempotent transaction write based on stripePaymentIntentId
  if (paymentIntent?.id) {
    const tx = await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        $setOnInsert: {
          contractId: contract._id,
          fromUserId: contract.clientId,
          toUserId: contract.freelancerId,
          amount: totalAmount,
          status: 'held',
          stripePaymentIntentId: paymentIntent.id,
        },
        $set: {
          platformFee,
          netAmount,
          processingFee,
          clientTotal,
          estimatedProcessingFee,
          stripeChargeId: paymentIntent.latest_charge || undefined,
        },
      },
      { upsert: true, new: true }
    );

    // Best-effort: fetch the real Stripe fee from the balance transaction
    // and store it as actualStripeFee on the Transaction for analytics.
    if (tx && paymentIntent.latest_charge && stripe) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge, {
          expand: ['balance_transaction'],
        });
        const bt = charge && charge.balance_transaction;
        if (bt && typeof bt.fee === 'number') {
          tx.actualStripeFee = bt.fee / 100;
          await tx.save();
        }
      } catch (err) {
        console.error('Failed to update actualStripeFee from Stripe charge:', err?.message || err);
      }
    }
  }

  return contract;
};

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
      .populate('hiringContext.companyId', 'name logo')
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
      .populate('freelancerId')
      .populate('hiringContext.companyId', 'name logo');

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    // ✅ SECURITY: Only client, freelancer, or admin can view contract
    if (
      contract.clientId._id.toString() !== req.user.id.toString() &&
      contract.freelancerId._id.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError('Not authorized to view this contract', 403));
    }

    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const createContract = async (req, res, next) => {
  try {
    const { freelancerId, jobId } = req.body;

    if (!jobId) {
      return next(new AppError('Job is required to create a contract', 400));
    }

    if (!freelancerId) {
      return next(new AppError('Freelancer is required to create a contract', 400));
    }

    // Only clients or admins can create contracts
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      return next(new AppError('Only clients can create contracts', 403));
    }

    // Ensure the job exists and belongs to this client (or admin override)
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new AppError('Job not found', 404));
    }
    if (job.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to create a contract for this job', 403));
    }
    if (['completed', 'cancelled', 'closed'].includes(job.status)) {
      return next(new AppError('Cannot create a contract for a closed job', 400));
    }

    // Start from the body but strip out sensitive/system-managed fields
    const payload = { ...req.body };
    delete payload.clientId;
    delete payload.paymentStatus;
    delete payload.status;
    delete payload.totalPaid;
    delete payload.platformFee;
    delete payload.stripePaymentIntentId;
    delete payload.escrowId;
    delete payload.reports;
    delete payload.isHeldByAdmin;
    delete payload.holdReason;
    delete payload.heldAt;
    delete payload.heldBy;
    delete payload.disputeReason;
    delete payload.disputeResolvedAt;
    delete payload.offerStatus;

    payload.clientId = req.user._id;
    payload.offerStatus = 'accepted';

    const contract = await Contract.create(payload);

    // When a contract is created for a job (direct hire), mark the job as in-progress
    // so it shows as ongoing in all dashboards.
    if (!job.hiredFreelancer) {
      job.status = 'in-progress';
      job.hiredFreelancer = freelancerId;
      await job.save();
    }
    res.status(201).json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const createHiringRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      return next(new AppError('Only clients can send hiring requests', 403));
    }

    const {
      freelancerId,
      title,
      description,
      amount,
      milestones,
      hiringType = 'individual',
      companyId,
      terms,
    } = req.body;

    if (!freelancerId) {
      return next(new AppError('Freelancer is required', 400));
    }

    if (!title) {
      return next(new AppError('Contract title is required', 400));
    }

    const total = Number(amount?.total);
    if (!Number.isFinite(total) || total <= 0) {
      return next(new AppError('Contract amount must be greater than zero', 400));
    }

    const freelancer = await User.findById(freelancerId).select('role name');
    if (!freelancer || freelancer.role !== 'freelancer') {
      return next(new AppError('Selected user is not a freelancer', 400));
    }

    let normalizedHiringType = hiringType === 'company' ? 'company' : 'individual';
    let hiringCompanyId;

    if (normalizedHiringType === 'company') {
      if (!companyId) {
        return next(new AppError('Company is required when hiring as a company', 400));
      }

      const company = await Company.findById(companyId).select('ownerId teamMembers');
      if (!company) {
        return next(new AppError('Company not found', 404));
      }

      const userId = req.user._id.toString();
      const isOwner = company.ownerId?.toString() === userId;
      const isTeamMember = (company.teamMembers || []).some((memberId) => memberId?.toString() === userId);

      if (!isOwner && !isTeamMember && req.user.role !== 'admin') {
        return next(new AppError('Not authorized to hire on behalf of this company', 403));
      }

      hiringCompanyId = company._id;
    }

    const normalizedMilestones = sanitizeMilestones(milestones);

    const contract = await Contract.create({
      freelancerId,
      clientId: req.user._id,
      isHiringRequest: true,
      title,
      description: description || '',
      amount: {
        total,
        type: amount?.type === 'hourly' ? 'hourly' : 'fixed',
        currency: amount?.currency || 'USD',
      },
      milestones: normalizedMilestones.length > 0
        ? normalizedMilestones
        : [{ title: 'Project Delivery', amount: total, status: 'pending' }],
      status: 'draft',
      paymentStatus: 'pending',
      offerStatus: 'pending_freelancer',
      hiringContext: {
        type: normalizedHiringType,
        companyId: hiringCompanyId || undefined,
      },
      terms: terms || '',
    });

    const company = hiringCompanyId
      ? await Company.findById(hiringCompanyId).select('name')
      : null;
    const actorName = req.user?.name || 'Client';
    const requesterLabel = normalizedHiringType === 'company'
      ? `${company?.name || 'Company'} (${actorName})`
      : actorName;

    const freelancerPayload = {
      type: 'hire_request_sent',
      title: 'New Hire Request',
      message: `${requesterLabel} sent a hire request for "${title}".`,
      severity: 'info',
      icon: '🤝',
      contractId: contract._id,
      contractTitle: title,
      reason: normalizedHiringType,
    };

    await notifyUser(req, freelancerId, freelancerPayload);

    await notifyUser(req, req.user._id, {
      type: 'hire_request_sent',
      title: 'Hire Request Sent',
      message: `Your hire request was sent to ${freelancer?.name || 'the freelancer'}.`,
      severity: 'info',
      icon: '📨',
      contractId: contract._id,
      contractTitle: title,
      reason: normalizedHiringType,
    });

    await notifyAdmins(req, {
      type: 'hire_request_sent',
      title: 'New Hiring Request Created',
      message: `${actorName} created a ${normalizedHiringType} hire request: "${title}".`,
      severity: 'warning',
      icon: '🧭',
      contractId: contract._id,
      contractTitle: title,
      reason: normalizedHiringType,
    });

    res.status(201).json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const respondToHiringRequest = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return next(new AppError('Action must be accept or reject', 400));
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    if (contract.freelancerId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Only the freelancer can respond to this hiring request', 403));
    }

    if (contract.offerStatus !== 'pending_freelancer') {
      return next(new AppError('This hiring request has already been handled', 400));
    }

    if (action === 'accept') {
      contract.offerStatus = 'accepted';
    } else {
      contract.offerStatus = 'rejected';
      contract.status = 'cancelled';
    }

    await contract.save();

    await contract.populate('clientId', 'name');
    await contract.populate('freelancerId', 'name');

    const isAccepted = action === 'accept';
    const eventType = isAccepted ? 'hire_request_accepted' : 'hire_request_rejected';

    await notifyUser(req, contract.clientId?._id || contract.clientId, {
      type: eventType,
      title: isAccepted ? 'Hire Request Accepted' : 'Hire Request Rejected',
      message: `${contract.freelancerId?.name || 'Freelancer'} ${isAccepted ? 'accepted' : 'rejected'} your hire request for "${contract.title}".`,
      severity: isAccepted ? 'info' : 'warning',
      icon: isAccepted ? '✅' : '❌',
      contractId: contract._id,
      contractTitle: contract.title,
    });

    await notifyUser(req, contract.freelancerId?._id || contract.freelancerId, {
      type: eventType,
      title: isAccepted ? 'You Accepted a Hire Request' : 'You Rejected a Hire Request',
      message: `You ${isAccepted ? 'accepted' : 'rejected'} the hire request for "${contract.title}".`,
      severity: 'info',
      icon: isAccepted ? '🤝' : '🚫',
      contractId: contract._id,
      contractTitle: contract.title,
    });

    await notifyAdmins(req, {
      type: eventType,
      title: isAccepted ? 'Hire Request Accepted' : 'Hire Request Rejected',
      message: `${contract.freelancerId?.name || 'Freelancer'} ${isAccepted ? 'accepted' : 'rejected'} "${contract.title}".`,
      severity: isAccepted ? 'info' : 'warning',
      icon: isAccepted ? '🟢' : '🟠',
      contractId: contract._id,
      contractTitle: contract.title,
    });

    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const updateContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    // ✅ SECURITY: Only client or admin can update contract
    if (
      contract.clientId.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError('Not authorized to update this contract', 403));
    }

    const updatedContract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ status: 'success', data: { contract: updatedContract } });
  } catch (error) {
    next(error);
  }
};

export const signContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    // ✅ SECURITY: Only client or freelancer can sign their own contract
    if (
      contract.clientId.toString() !== req.user.id.toString() &&
      contract.freelancerId.toString() !== req.user.id.toString()
    ) {
      return next(new AppError('Not authorized to sign this contract', 403));
    }

    if (contract.offerStatus === 'pending_freelancer' && contract.clientId.toString() === req.user.id.toString()) {
      return next(new AppError('Client signature is available after the freelancer accepts the hiring request', 400));
    }

    if (contract.offerStatus === 'rejected') {
      return next(new AppError('This hiring request was rejected', 400));
    }

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

// Allow freelancer to decline a contract offer before signing
export const declineContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    // Only the freelancer (or admin) can decline their own contract
    if (
      contract.freelancerId.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError('Only the freelancer can decline this contract', 403));
    }

    // If freelancer already signed, treat it as binding
    if (contract.signatures?.freelancer?.signed) {
      return next(new AppError('You have already signed this contract', 400));
    }

    // Do not allow declining after funds are in escrow or released
    if (contract.paymentStatus === 'escrow' || contract.paymentStatus === 'released') {
      return next(new AppError('Cannot decline a contract after payment has been funded', 400));
    }

    contract.status = 'cancelled';
    await contract.save();

    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

// Create a Stripe Payment Intent for a contract (client -> platform escrow)
export const createContractPaymentIntent = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payments are not configured', 500));
    }

    const settings = await PlatformSettings.findOne();
    if (settings && settings.escrowEnabled === false) {
      return next(new AppError('Escrow payments are currently disabled by the platform administrator.', 403));
    }

    const contract = await Contract.findById(req.params.id).populate('clientId').populate('freelancerId');

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    if (contract.clientId._id.toString() !== req.user.id.toString()) {
      return next(new AppError('Only the client can pay for this contract', 403));
    }

    if (contract.offerStatus === 'pending_freelancer') {
      return next(new AppError('Freelancer must accept the hiring request before payment', 400));
    }

    if (contract.offerStatus === 'rejected') {
      return next(new AppError('This hiring request was rejected by the freelancer', 400));
    }

    if (contract.paymentStatus === 'escrow' || contract.paymentStatus === 'released') {
      return next(new AppError('Payment has already been processed for this contract', 400));
    }

    const currency = getStripeCurrency(contract.amount && contract.amount.currency);
    const jobPrice = contract.amount?.total || 0;

    if (jobPrice <= 0) {
      return next(new AppError('Contract amount must be greater than zero', 400));
    }

    // Estimate a processing fee that the client will pay on top of the job price.
    // This is designed so Stripe fees are covered by the client, not deducted
    // from the freelancer's payout.
    //
    // NOTE: Stripe applies its percentage fee to the total charge amount, not
    // just the job price. To more closely mirror that behaviour, we solve for
    // the total amount X where:
    //   fee = X * percent + flat
    //   X = jobPrice + fee
    //   => X = (jobPrice + flat) / (1 - percent)
    // The values are configurable via env so you can match your Stripe plan.
    const STRIPE_FEE_PERCENT = parseFloat(process.env.STRIPE_FEE_PERCENT || '0.029'); // 2.9%
    const STRIPE_FEE_FLAT = parseFloat(process.env.STRIPE_FEE_FLAT || '0.3');        // $0.30

    const clientTotal = (jobPrice + STRIPE_FEE_FLAT) / (1 - STRIPE_FEE_PERCENT);
    const estimatedProcessingFee = clientTotal - jobPrice;

    const amountInMinorUnits = Math.round(clientTotal * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        contractId: contract._id.toString(),
        clientId: contract.clientId._id.toString(),
        freelancerId: contract.freelancerId._id.toString(),
        jobPrice: jobPrice.toString(),
        clientTotal: clientTotal.toString(),
        estimatedProcessingFee: estimatedProcessingFee.toString()
      },
    });

    contract.stripePaymentIntentId = paymentIntent.id;
    contract.paymentStatus = 'pending';
    await contract.save();

    res.status(201).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        jobPrice,
        estimatedProcessingFee,
        clientTotal,
        processingFeePercent: STRIPE_FEE_PERCENT * 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Confirm that Stripe payment succeeded and move contract funds into escrow
export const confirmContractPayment = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payments are not configured', 500));
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    if (contract.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Only the client can confirm payment', 403));
    }

    if (!contract.stripePaymentIntentId) {
      return next(new AppError('No payment intent found for this contract', 400));
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(contract.stripePaymentIntentId);

    // If not succeeded yet, just report status back to UI
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment has not succeeded yet',
        data: { paymentStatus: paymentIntent.status },
      });
    }

    const updatedContract = await handleSuccessfulContractPayment(paymentIntent, contract);

    res.json({
      status: 'success',
      data: { contract: updatedContract },
    });
  } catch (error) {
    next(error);
  }
};

// Get a client-facing payment breakdown for a funded contract based on Transaction ledger
export const getClientPaymentBreakdown = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return next(new AppError('Contract not found', 404));

    const transaction = await Transaction.findOne({ contractId: req.params.id });
    if (!transaction) {
      return next(new AppError('No payment found for this contract yet', 404));
    }

    const jobPrice = transaction.amount || (contract.amount && contract.amount.total) || 0;
    const currency = (contract.amount && contract.amount.currency) || 'USD';

    const platformFeeAmount =
      typeof transaction.platformFee === 'number'
        ? transaction.platformFee
        : (contract.platformFee && contract.platformFee.amount) || 0;
    const freelancerNetAmount = jobPrice - platformFeeAmount;

    const processingFee = transaction.processingFee || 0;
    const actualStripeFee = transaction.actualStripeFee || 0;
    const clientTotal = transaction.clientTotal || jobPrice + processingFee;

    console.log('DEBUG getClientPaymentBreakdown:', {
      contractId: req.params.id,
      jobPrice,
      processingFee: transaction.processingFee,
      clientTotal: transaction.clientTotal,
      estimatedProcessingFee: transaction.estimatedProcessingFee,
    });

    res.json({
      success: true,
      data: {
        contractId: contract._id,
        currency,
        jobPrice,
        platformFeeAmount,
        freelancerNetAmount,
        processingFee,
        actualStripeFee,
        clientTotal,
        stripePaymentIntentId: contract.stripePaymentIntentId || null,
        stripeChargeId: transaction.stripeChargeId || null,
        paymentStatus: contract.paymentStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Return a fee preview for a contract BEFORE payment is initiated.
// Allows the client to see the full cost (job price + Stripe processing fee) on the
// contract card without needing to open the payment modal first.
export const getContractPaymentPreview = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return next(new AppError('Contract not found', 404));

    if (contract.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorised to view this contract preview', 403));
    }

    const jobPrice = contract.amount?.total || 0;
    const currency = contract.amount?.currency || 'USD';

    // Platform fee
    let platformFeePercentage = 3;
    const settings = await PlatformSettings.findOne();
    if (settings?.platformFeePercentage) platformFeePercentage = settings.platformFeePercentage;
    const platformFeeAmount = (jobPrice * platformFeePercentage) / 100;
    const freelancerNet = jobPrice - platformFeeAmount;

    // Estimated Stripe processing fee (mirrors createContractPaymentIntent logic)
    const STRIPE_FEE_PERCENT = parseFloat(process.env.STRIPE_FEE_PERCENT || '0.029');
    const STRIPE_FEE_FLAT   = parseFloat(process.env.STRIPE_FEE_FLAT   || '0.3');
    const clientTotal = (jobPrice + STRIPE_FEE_FLAT) / (1 - STRIPE_FEE_PERCENT);
    const estimatedProcessingFee = clientTotal - jobPrice;

    res.json({
      success: true,
      data: {
        contractId: contract._id,
        currency,
        jobPrice,
        platformFeePercentage,
        platformFeeAmount,
        freelancerNet,
        estimatedProcessingFee,
        clientTotal,
        processingFeePercent: STRIPE_FEE_PERCENT * 100,
        paymentStatus: contract.paymentStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Stripe webhook endpoint handler. Keeps Stripe as the source of truth
// and updates contract + transaction state when payment events occur.
export const stripeWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(500).send('Stripe is not configured');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Support one or many webhook secrets so both Platform and Connect
    // Stripe destinations can safely point to the same webhook URL.
    const configuredSecrets = [
      process.env.STRIPE_WEBHOOK_SECRET,
      ...(process.env.STRIPE_WEBHOOK_SECRETS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ].filter(Boolean);

    if (!configuredSecrets.length) {
      throw new Error('No Stripe webhook secret configured');
    }

    let lastError;
    for (const secret of configuredSecrets) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!event) {
      throw lastError || new Error('Unable to verify webhook signature');
    }
  } catch (err) {
    console.error('❌ Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handleSuccessfulContractPayment(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        // Optionally mark contract or log failure in future
        break;
      }
      case 'charge.refunded': {
        // Handle refunds from dispute resolution
        const charge = event.data.object;
        if (charge && charge.metadata && charge.metadata.contractId) {
          try {
            const refundId = charge.refunds?.data?.[0]?.id;
            await Transaction.findOneAndUpdate(
              { stripeChargeId: charge.id },
              {
                refundId,
                refundedAt: new Date(),
                status: 'refunded'
              }
            );
            console.log(`✅ Refund webhook processed: ${refundId}`);
          } catch (err) {
            console.error('Error handling charge.refunded webhook:', err.message);
          }
        }
        break;
      }
      case 'transfer.created': {
        // Track when transfer to freelancer is initiated
        const transfer = event.data.object;
        if (transfer && transfer.destination) {
          try {
            await Transaction.findOneAndUpdate(
              { stripeTransferId: transfer.id },
              {
                payoutStatus: 'processing'
              }
            );
            console.log(`✅ Transfer initiated: ${transfer.id} → ${transfer.destination}`);
          } catch (err) {
            console.error('Error handling transfer.created webhook:', err.message);
          }
        }
        break;
      }
      case 'transfer.paid': {
        // Transfer completed - freelancer received funds
        const transfer = event.data.object;
        if (transfer && transfer.destination) {
          try {
            const txn = await Transaction.findOneAndUpdate(
              { stripeTransferId: transfer.id },
              {
                payoutStatus: 'paid_out',
                updatedAt: new Date()
              }
            ).populate('contractId');

            // Notify freelancer
            if (txn && txn.toUserId) {
              const io = req.app && typeof req.app.get === 'function' ? req.app.get('io') : null;
              if (io) {
                io.to(txn.toUserId.toString()).emit('payoutCompleted', {
                  transferId: transfer.id,
                  amount: (transfer.amount / 100).toFixed(2),
                  currency: transfer.currency.toUpperCase()
                });
              }

              // Create notification
              await AdminNotification.create({
                userId: txn.toUserId,
                type: 'payout_received',
                title: 'Payout Received',
                message: `Your payout of ${(transfer.amount / 100).toFixed(2)} ${transfer.currency.toUpperCase()} has been received`,
                severity: 'success',
                icon: '💰'
              });
            }

            console.log(`✅ Payout completed: ${transfer.id}`);
          } catch (err) {
            console.error('Error handling transfer.paid webhook:', err.message);
          }
        }
        break;
      }
      case 'transfer.failed': {
        // Transfer failed - update transaction status
        const transfer = event.data.object;
        if (transfer && transfer.destination) {
          try {
            await Transaction.findOneAndUpdate(
              { stripeTransferId: transfer.id },
              {
                payoutStatus: 'failed',
                updatedAt: new Date()
              }
            );
            console.log(`❌ Transfer failed: ${transfer.id} - ${transfer.failure_message}`);
          } catch (err) {
            console.error('Error handling transfer.failed webhook:', err.message);
          }
        }
        break;
      }
      case 'charge.dispute.created': {
        // Customer filed chargeback
        const stripeDispute = event.data.object;
        if (stripeDispute && stripeDispute.charge) {
          try {
            // Look up the Stripe charge and its payment_intent
            const charge = await stripe.charges.retrieve(stripeDispute.charge);
            const paymentIntentId = charge && charge.payment_intent;

            if (!paymentIntentId) {
              break;
            }

            const contract = await Contract.findOne({
              stripePaymentIntentId: paymentIntentId
            }).select('+stripePaymentIntentId');

            if (contract) {
              // Create internal dispute record linked to this contract
              await Dispute.create({
                contractId: contract._id,
                raisedBy: contract.clientId, // Client initiated chargeback
                raisedByRole: 'client',
                reason: `Stripe chargeback filed: ${stripeDispute.reason || 'Chargeback initiated'}`,
                status: 'open',
                stripeDisputeId: stripeDispute.id
              });

              // Notify admin
              await AdminNotification.create({
                userId: null,
                type: 'chargeback_filed',
                title: '⚠️ Chargeback Filed',
                message: `Chargeback on contract ${contract.title}: ${stripeDispute.reason || 'No reason provided'}`,
                severity: 'critical'
              });

              console.log(`⚠️ Chargeback filed: ${stripeDispute.id} on charge ${stripeDispute.charge}`);
            }
          } catch (err) {
            console.error('Error handling charge.dispute.created webhook:', err.message);
          }
        }
        break;
      }
      case 'account.updated': {
        const account = event.data.object;
        if (account && account.id) {
          const payoutsEnabled = Boolean(account.payouts_enabled);
          let payoutsStatus = 'pending';
          if (payoutsEnabled) {
            payoutsStatus = 'enabled';
          } else if (account.requirements && account.requirements.disabled_reason) {
            payoutsStatus = 'restricted';
          }

          await FreelancerProfile.findOneAndUpdate(
            { stripeAccountId: account.id },
            {
              payoutsEnabled,
              payoutsStatus,
            }
          );
        }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    res.status(500).send('Internal webhook error');
  }
};

export const submitMilestone = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    // ✅ SECURITY: Only freelancer can submit milestone
    if (contract.freelancerId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Only freelancer can submit milestones', 403));
    }

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

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    // Only the client who owns the contract or an admin can approve milestones
    if (
      contract.clientId.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError('Not authorized to approve this milestone', 403));
    }

    const milestone = contract.milestones.id(req.params.milestoneId);

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

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

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    if (contract.paymentStatus !== 'escrow') {
      return next(new AppError('No funds are currently held in escrow for this contract', 400));
    }

    if (contract.clientId.toString() !== req.user.id.toString()) {
      return next(new AppError('Only the client can release payment', 403));
    }

    const milestone = contract.milestones.id(req.params.milestoneId);

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    if (milestone.status !== 'approved') {
      return next(new AppError('Milestone must be approved before releasing payment', 400));
    }

    milestone.status = 'paid';
    milestone.paidAt = Date.now();
    contract.totalPaid += milestone.amount;

    // If all milestones are paid, mark payment and contract as released/completed
    const allPaid = contract.milestones.every((m) => m.status === 'paid');
    if (allPaid) {
      contract.paymentStatus = 'released';
      contract.status = 'completed';

      // Also mark the underlying job as completed so it moves out of active lists
      try {
        await Job.findByIdAndUpdate(contract.jobId, { status: 'completed' });
      } catch (jobErr) {
        console.error('Failed to update job status after contract completion:', jobErr?.message || jobErr);
      }

      // Update transaction status to released
      const tx = await Transaction.findOneAndUpdate(
        { contractId: contract._id, status: 'held' },
        { status: 'released' },
        { new: true }
      );

      // Notify freelancer that payment has been released
      try {
        const AdminNotification = (await import('../models/AdminNotification.js')).default;
        const io = req.app.get('io');

        await AdminNotification.create({
          userId: contract.freelancerId,
          type: 'payment_released',
          title: '💸 Payment Released',
          message: `The client has released payment for contract "${contract.title}". You can now withdraw your earnings.`,
          severity: 'info',
          icon: '💸',
          contractId: contract._id,
          contractTitle: contract.title
        });

        if (io) {
          io.to(contract.freelancerId.toString()).emit('adminNotification', {
            type: 'payment_released',
            title: '💸 Payment Released',
            message: `Payment released for "${contract.title}". Withdraw anytime.`,
            contractId: contract._id,
            severity: 'info'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to notify freelancer about payment release:', notifyErr.message);
      }

      // Optional: auto-payout to freelancer via Stripe Connect when all milestones are paid.
      // By default this is disabled so that payouts go through the manual withdraw flow.
      if (process.env.AUTO_PAYOUTS === 'true' && stripe && tx) {
        try {
          const freelancerProfile = await FreelancerProfile.findOne({ userId: contract.freelancerId });

          if (freelancerProfile?.stripeAccountId && tx.payoutStatus !== 'paid_out') {
            const currency = getStripeCurrency(contract.amount && contract.amount.currency);
            const amountInMinorUnits = Math.round((tx.netAmount || tx.amount || 0) * 100);

            if (amountInMinorUnits > 0) {
              const transfer = await stripe.transfers.create({
                amount: amountInMinorUnits,
                currency,
                destination: freelancerProfile.stripeAccountId,
                // Use the underlying charge when available for better traceability
                source_transaction: tx.stripeChargeId || undefined,
              });

              tx.stripeTransferId = transfer.id;
              tx.payoutStatus = 'paid_out';
              await tx.save();
            }
          }
        } catch (err) {
          console.error('Error creating Stripe transfer for payout:', err);
          if (tx && tx.payoutStatus !== 'paid_out') {
            tx.payoutStatus = 'failed';
            await tx.save();
          }
        }
      }
    }

    await contract.save();

    // After saving, if the contract is now completed, update freelancer stats and reputation
    if (contract.status === 'completed') {
      try {
        const freelancerId = contract.freelancerId;
        const [completedCount, totalCount, totalEarningsAgg] = await Promise.all([
          Contract.countDocuments({ freelancerId, status: 'completed' }),
          Contract.countDocuments({ freelancerId, status: { $in: ['active', 'completed', 'cancelled'] } }),
          Contract.aggregate([
            { $match: { freelancerId, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalPaid' } } }
          ])
        ]);

        const profile = await FreelancerProfile.findOne({ userId: freelancerId });
        if (profile) {
          profile.completedJobs = completedCount;
          profile.successRate = totalCount > 0
            ? parseFloat(((completedCount / totalCount) * 100).toFixed(2))
            : 0;
          profile.totalEarnings = totalEarningsAgg[0]?.total || 0;
          await profile.save();
        }

        await ReputationService.updateAfterJobCompletion(freelancerId);
      } catch (statsErr) {
        console.error('Failed to update freelancer stats after contract completion:', statsErr?.message || statsErr);
      }
    }

    res.json({ status: 'success', message: 'Payment released', data: { contract } });
  } catch (error) {
    next(error);
  }
};

export const initiateDispute = async (req, res, next) => {
  try {
    const { reason, description } = req.body;

    if (!reason) {
      return next(new AppError('Dispute reason is required', 400));
    }

    const contract = await Contract.findById(req.params.id)
      .populate('clientId', '_id')
      .populate('freelancerId', '_id');

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    const userId = req.user._id.toString();
    const isClient = contract.clientId?._id?.toString() === userId;
    const isFreelancer = contract.freelancerId?._id?.toString() === userId;

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to dispute this contract', 403));
    }

    // Only allow disputes on funded/released contracts
    if (!['escrow', 'released'].includes(contract.paymentStatus)) {
      return next(new AppError('This contract cannot be disputed in its current state', 400));
    }

    contract.status = 'disputed';
    contract.paymentStatus = 'disputed';
    contract.disputeReason = reason;
    await contract.save();

    const raisedByRole = isClient ? 'client' : isFreelancer ? 'freelancer' : 'admin';

    await Dispute.create({
      contractId: contract._id,
      raisedBy: req.user._id,
      raisedByRole,
      reason,
      description,
    });

    res.json({ status: 'success', data: { contract } });
  } catch (error) {
    next(error);
  }
};

// Report a contract to admin (client or freelancer)
export const reportContract = async (req, res, next) => {
  try {
    const { reason, description } = req.body;
    if (!reason) return next(new AppError('Report reason is required', 400));

    const contract = await Contract.findById(req.params.id)
      .populate('clientId', '_id name')
      .populate('freelancerId', '_id name');

    if (!contract) return next(new AppError('Contract not found', 404));

    const userId = req.user._id.toString();
    const clientMatch = contract.clientId?._id?.toString() === userId;
    const freelancerMatch = contract.freelancerId?._id?.toString() === userId;

    if (!clientMatch && !freelancerMatch && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to report this contract', 403));
    }

    const reporterRole = clientMatch ? 'client' : 'freelancer';

    contract.reports.push({
      reporterId: req.user._id,
      reporterRole,
      reason,
      description: description || ''
    });
    await contract.save();

    // Notify all admins
    try {
      const User = (await import('../models/User.js')).default;
      const AdminNotification = (await import('../models/AdminNotification.js')).default;

      const admins = await User.find({ role: 'admin' }).select('_id');
      const io = req.app.get('io');

      for (const admin of admins) {
        await AdminNotification.create({
          userId: admin._id,
          type: 'contract_report',
          title: '🚨 New Contract Report',
          message: `${req.user.name || reporterRole} reported contract "${contract.title}": ${reason}`,
          severity: 'warning',
          icon: '🚨',
          contractId: contract._id,
          contractTitle: contract.title,
          reason
        });

        if (io) {
          io.to(admin._id.toString()).emit('adminNotification', {
            type: 'contract_report',
            title: '🚨 New Contract Report',
            message: `Contract "${contract.title}" has been reported`,
            contractId: contract._id,
            contractTitle: contract.title,
            severity: 'warning'
          });
        }
      }

      // Confirm to reporter
      await AdminNotification.create({
        userId: req.user._id,
        type: 'contract_report',
        title: '✅ Report Submitted',
        message: `Your report for contract "${contract.title}" has been submitted and is under admin review.`,
        severity: 'info',
        icon: '✅',
        contractId: contract._id,
        contractTitle: contract.title,
        reason
      });

      if (io) {
        io.to(req.user._id.toString()).emit('adminNotification', {
          type: 'contract_report',
          title: '✅ Report Submitted',
          message: `Your report for "${contract.title}" is under review.`,
          severity: 'info'
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify admin about contract report:', notifyErr.message);
    }

    res.json({ status: 'success', message: 'Report submitted successfully', data: { contract } });
  } catch (error) {
    next(error);
  }
};
