import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkRiskForPayments } from '../middleware/checkRiskLevel.js';
import {
  getContracts,
  getContract,
  createContract,
  createHiringRequest,
  respondToHiringRequest,
  updateContract,
  signContract,
  declineContract,
  createContractPaymentIntent,
  confirmContractPayment,
  submitMilestone,
  approveMilestone,
  requestRevision,
  releasePayment,
  initiateDispute,
  reportContract,
  getClientPaymentBreakdown,
  getContractPaymentPreview,
} from '../controllers/contracts.js';

const router = express.Router();

router.use(protect);

router.get('/', getContracts);
router.get('/:id', getContract);
router.post('/', createContract);
router.post('/hire-request', createHiringRequest);
router.put('/:id', updateContract);
router.post('/:id/hire-response', respondToHiringRequest);

router.post('/:id/sign', signContract);
router.post('/:id/decline', declineContract);
router.post('/:id/payment-intent', checkRiskForPayments, createContractPaymentIntent);
router.post('/:id/payment-confirm', checkRiskForPayments, confirmContractPayment);
router.get('/:id/payment-breakdown', getClientPaymentBreakdown);
router.get('/:id/payment-preview', getContractPaymentPreview);
router.post('/:id/milestones/:milestoneId/submit', submitMilestone);
router.post('/:id/milestones/:milestoneId/approve', approveMilestone);
router.post('/:id/milestones/:milestoneId/revision', requestRevision);
router.post('/:id/milestones/:milestoneId/release-payment', checkRiskForPayments, releasePayment);
router.post('/:id/dispute', initiateDispute);
router.post('/:id/report', reportContract);

export default router;
