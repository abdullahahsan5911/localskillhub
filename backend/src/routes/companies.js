import express from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import {
  createCompany,
  deleteCompany,
  getCompany,
  getCompanies,
  getMyCompanies,
  updateCompany
} from '../controllers/companies.js';

const router = express.Router();

router.get('/', optionalAuth, getCompanies);
router.get('/my', protect, getMyCompanies);
router.get('/:id', optionalAuth, getCompany);

router.post('/', protect, authorize('client'), createCompany);
router.put('/:id', protect, authorize('client'), updateCompany);
router.delete('/:id', protect, authorize('client'), deleteCompany);

export default router;
