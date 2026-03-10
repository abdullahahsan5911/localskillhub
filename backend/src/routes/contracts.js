import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  signContract,
  submitMilestone,
  approveMilestone,
  requestRevision,
  releasePayment,
  initiateDispute
} from '../controllers/contracts.js';

const router = express.Router();

router.use(protect);

router.get('/', getContracts);
router.get('/:id', getContract);
router.post('/', createContract);
router.put('/:id', updateContract);

router.post('/:id/sign', signContract);
router.post('/:id/milestones/:milestoneId/submit', submitMilestone);
router.post('/:id/milestones/:milestoneId/approve', approveMilestone);
router.post('/:id/milestones/:milestoneId/revision', requestRevision);
router.post('/:id/milestones/:milestoneId/release-payment', releasePayment);
router.post('/:id/dispute', initiateDispute);

export default router;
