import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
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
router.post('/', authorize('freelancer', 'both'), createProposal);
router.put('/:id', authorize('freelancer', 'both'), updateProposal);
router.delete('/:id', authorize('freelancer', 'both'), deleteProposal);

router.post('/:id/accept', authorize('client', 'both'), acceptProposal);
router.post('/:id/reject', authorize('client', 'both'), rejectProposal);
router.post('/:id/withdraw', authorize('freelancer', 'both'), withdrawProposal);
router.post('/:id/negotiate', addNegotiation);

export default router;
