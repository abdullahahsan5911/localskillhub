import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  // Analytics
  getDashboardAnalytics,
  // Users
  getAllUsers, getUserDetail, banUser, unbanUser, suspendUser, removeSuspension, warnUser, removeWarning,
  setRiskLevel, addAdminNote, assignBadge,
  // Verification
  getAllVerifications, approveVerification, rejectVerification, requestReupload,
  // Jobs
  getAllJobs, flagJob, unflagJob, featureJob, deleteJob,
  // Contracts
  getAllContracts, getContractDetail, getContractEarnings, forceReleaseEscrow, refundClient, freezeContract, adjustContractFee,
  // Disputes
  getAllDisputes, getDisputeDetail, resolveDispute,
  // Reviews
  getAllReviews, deleteReview, flagReview,
  // Reputation
  getAllReputations, getUserReputation, adjustReputationScore, recalculateReputationScore,
  // Communities
  getAllCommunities, deleteCommunity, suspendCommunity, restoreCommunity,
  // Settings
  getSettings, updateSettings,
  // Audit Logs
  getAuditLogs,
  // Payments
  getEscrowOverview, getTransactions, holdEscrow, unholdEscrow, getPaymentStats,
  getWithdrawalRequests, approveWithdrawalRequest
} from '../controllers/admin.js';

const router = express.Router();

// ✅ ALL admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// ── Analytics ──────────────────────────────────────────────────
router.get('/analytics', getDashboardAnalytics);

// ── Users ──────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/suspend/remove', removeSuspension);
router.post('/users/:id/warn', warnUser);
router.post('/users/:id/warn/remove', removeWarning);
router.post('/users/:id/risk', setRiskLevel);
router.post('/users/:id/note', addAdminNote);
router.post('/users/:id/badge', assignBadge);

// ── Verification ───────────────────────────────────────────────
router.get('/verifications', getAllVerifications);
router.post('/verifications/:id/approve', approveVerification);
router.post('/verifications/:id/reject', rejectVerification);
router.post('/verifications/:id/reupload', requestReupload);

// ── Jobs ───────────────────────────────────────────────────────
router.get('/jobs', getAllJobs);
router.post('/jobs/:id/flag', flagJob);
router.post('/jobs/:id/unflag', unflagJob);
router.post('/jobs/:id/feature', featureJob);
router.delete('/jobs/:id', deleteJob);

// ── Contracts ──────────────────────────────────────────────────
router.get('/contracts', getAllContracts);
router.get('/contracts/:id', getContractDetail);
router.get('/contracts/:id/earnings', getContractEarnings);
router.post('/contracts/:id/release', forceReleaseEscrow);
router.post('/contracts/:id/refund', refundClient);
router.post('/contracts/:id/freeze', freezeContract);
router.put('/contracts/:id/fee', adjustContractFee);

// ── Disputes ───────────────────────────────────────────────────
router.get('/disputes', getAllDisputes);
router.get('/disputes/:id', getDisputeDetail);
router.post('/disputes/:id/resolve', resolveDispute);

// ── Reviews ────────────────────────────────────────────────────
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);
router.post('/reviews/:id/flag', flagReview);

// ── Reputation ─────────────────────────────────────────────────
router.get('/reputation', getAllReputations);
router.get('/reputation/:userId', getUserReputation);
router.post('/reputation/:userId/adjust', adjustReputationScore);
router.post('/reputation/:userId/recalculate', recalculateReputationScore);

// ── Communities ────────────────────────────────────────────────
router.get('/communities', getAllCommunities);
router.delete('/communities/:id', deleteCommunity);
router.post('/communities/:id/suspend', suspendCommunity);
router.post('/communities/:id/restore', restoreCommunity);

// ── Payments ───────────────────────────────────────────────────
router.get('/payments/stats', getPaymentStats);
router.get('/payments/escrow', getEscrowOverview);
router.get('/payments/transactions', getTransactions);
router.get('/payments/withdrawals', getWithdrawalRequests);
router.post('/payments/withdrawals/:userId/approve', approveWithdrawalRequest);
router.post('/contracts/:id/hold', holdEscrow);
router.post('/contracts/:id/unhold', unholdEscrow);

// ── Settings ───────────────────────────────────────────────────
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// ── Audit Logs ─────────────────────────────────────────────────
router.get('/logs', getAuditLogs);

export default router;
