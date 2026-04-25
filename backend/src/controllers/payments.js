import stripe from '../config/stripe.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Contract from '../models/Contract.js';
import { getStripeCurrency } from '../config/currency.js';
import { AppError } from '../middleware/errorHandler.js';

const resolveFrontendBaseUrl = (req) => {
  const envUrl = process.env.FRONTEND_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  const origin = req.get('origin');
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new AppError('FRONTEND_URL is not configured for Stripe redirects', 500);
  }

  return 'http://localhost:5173';
};

// Create or reuse a Stripe Connect account for the authenticated freelancer
export const createConnectOnboardingLink = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payments are not configured', 500));
    }

    if (req.user.role !== 'freelancer') {
      return next(new AppError('Only freelancers can onboard for payouts', 403));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let profile = await FreelancerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await FreelancerProfile.create({
        userId: req.user.id,
        title: user.name || 'Freelancer',
      });
    }

    let accountId = profile.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      profile.stripeAccountId = accountId;
      await profile.save();
    }

    const baseUrl = resolveFrontendBaseUrl(req);

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/freelancer/payouts/onboarding?refresh=1`,
      return_url: `${baseUrl}/freelancer/payouts/onboarding-complete`,
      type: 'account_onboarding',
    });

    res.json({ status: 'success', data: { url: accountLink.url } });
  } catch (error) {
    next(error);
  }
};

// Regenerate an onboarding link for an existing Connect account
export const refreshConnectOnboardingLink = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payments are not configured', 500));
    }

    if (req.user.role !== 'freelancer') {
      return next(new AppError('Only freelancers can onboard for payouts', 403));
    }

    const profile = await FreelancerProfile.findOne({ userId: req.user.id });
    if (!profile || !profile.stripeAccountId) {
      return next(new AppError('No Stripe account found for this freelancer', 404));
    }

    const baseUrl = resolveFrontendBaseUrl(req);

    const accountLink = await stripe.accountLinks.create({
      account: profile.stripeAccountId,
      refresh_url: `${baseUrl}/freelancer/payouts/onboarding?refresh=1`,
      return_url: `${baseUrl}/freelancer/payouts/onboarding-complete`,
      type: 'account_onboarding',
    });

    res.json({ status: 'success', data: { url: accountLink.url } });
  } catch (error) {
    next(error);
  }
};

// Get payout readiness + available balance for the authenticated freelancer
export const getPayoutStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      return next(new AppError('Only freelancers can view payout status', 403));
    }

    const profile = await FreelancerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.json({
        status: 'success',
        data: {
          connected: false,
          stripeAccountId: null,
          payoutsEnabled: false,
          payoutsStatus: 'pending',
          withdrawableAmount: 0,
        },
      });
    }

    // Keep payout flags in sync even when webhook delivery is delayed/misconfigured.
    // This ensures the UI can show withdraw actions immediately after onboarding.
    if (stripe && profile.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(profile.stripeAccountId);
        const payoutsEnabled = Boolean(account?.payouts_enabled);
        let payoutsStatus = 'pending';

        if (payoutsEnabled) {
          payoutsStatus = 'enabled';
        } else if (account?.requirements?.disabled_reason) {
          payoutsStatus = 'restricted';
        }

        if (
          profile.payoutsEnabled !== payoutsEnabled ||
          profile.payoutsStatus !== payoutsStatus
        ) {
          profile.payoutsEnabled = payoutsEnabled;
          profile.payoutsStatus = payoutsStatus;
          await profile.save();
        }
      } catch (stripeErr) {
        console.error('Failed to sync Stripe payout status:', stripeErr?.message || stripeErr);
      }
    }

    // Sum all released & not-yet-paid transactions for this freelancer.
    // Use freelancer net (job price minus platform fee), not the full job amount.
    const pendingTxs = await Transaction.find({
      toUserId: req.user.id,
      status: 'released',
      payoutStatus: 'pending',
    });

    const withdrawableAmount = pendingTxs.reduce((sum, tx) => {
      const net =
        typeof tx.netAmount === 'number' && tx.netAmount > 0
          ? tx.netAmount
          : Math.max((tx.amount || 0) - (tx.platformFee || 0), 0);
      return sum + net;
    }, 0);

    res.json({
      status: 'success',
      data: {
        connected: Boolean(profile.stripeAccountId),
        stripeAccountId: profile.stripeAccountId || null,
        payoutsEnabled: Boolean(profile.payoutsEnabled),
        payoutsStatus: profile.payoutsStatus,
        withdrawableAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Request a withdrawal (admin will later approve and trigger Stripe transfers)
export const withdrawPayouts = async (req, res, next) => {
  try {
    if (!stripe) {
      return next(new AppError('Payments are not configured', 500));
    }

    if (req.user.role !== 'freelancer') {
      return next(new AppError('Only freelancers can request withdrawals', 403));
    }

    const profile = await FreelancerProfile.findOne({ userId: req.user.id });

    if (!profile || !profile.stripeAccountId) {
      return next(
        new AppError('No Stripe Connect account found. Set up payouts first.', 400)
      );
    }

    if (!profile.payoutsEnabled) {
      return next(
        new AppError('Complete Stripe onboarding before withdrawing earnings', 400)
      );
    }

    // Find all currently withdrawable transactions that have not yet been requested
    const pendingTxs = await Transaction.find({
      toUserId: req.user.id,
      status: 'released',
      payoutStatus: 'pending',
    });

    if (!pendingTxs.length) {
      return next(new AppError('No available balance to withdraw', 400));
    }

    // Mark them as requested so admins can see and approve
    await Transaction.updateMany(
      {
        _id: { $in: pendingTxs.map((tx) => tx._id) },
        payoutStatus: 'pending',
      },
      { $set: { payoutStatus: 'requested' } }
    );

    const requestedAmount = pendingTxs.reduce((sum, tx) => {
      const net =
        typeof tx.netAmount === 'number' && tx.netAmount > 0
          ? tx.netAmount
          : Math.max((tx.amount || 0) - (tx.platformFee || 0), 0);
      return sum + net;
    }, 0);

    res.json({
      status: 'success',
      data: {
        payoutsEnabled: Boolean(profile.payoutsEnabled),
        payoutsStatus: profile.payoutsStatus,
        withdrawableAmount: 0,
        requestedAmount,
      },
      message:
        'Withdrawal request submitted. An administrator will review and process your payout, typically within 3–5 business days.',
    });
  } catch (error) {
    next(error);
  }
};
