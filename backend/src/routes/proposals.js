import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { checkBannedOrSuspended } from '../middleware/checkBan.js';
import { checkRiskForProposalSubmission } from '../middleware/checkRiskLevel.js';
import {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
  addNegotiation
} from '../controllers/proposals.js';

const router = express.Router();

router.use(protect);

router.get('/', getProposals);
router.get('/:id', getProposal);
router.post('/', authorize('freelancer'), checkBannedOrSuspended, checkRiskForProposalSubmission, createProposal);
router.put('/:id', authorize('freelancer'), checkBannedOrSuspended, updateProposal);
router.delete('/:id', authorize('freelancer'), checkBannedOrSuspended, deleteProposal);

router.post('/:id/accept', authorize('client'), checkBannedOrSuspended, acceptProposal);
router.post('/:id/reject', authorize('client'), checkBannedOrSuspended, rejectProposal);
router.post('/:id/withdraw', authorize('freelancer'), checkBannedOrSuspended, withdrawProposal);
router.post('/:id/negotiate', checkBannedOrSuspended, addNegotiation);

export default router;
