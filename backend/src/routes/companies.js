import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.js';
import {
  createCompany,
  deleteCompany,
  getCompany,
  getCompanies,
  getMyCompanies,
  updateCompany,
  uploadCompanyDocument,
  getCompanyDocuments,
  deleteCompanyDocument,
  getPendingCompanies,
  getCompanyReviewDetails,
  approveCompanyVerification,
  rejectCompanyVerification,
} from '../controllers/companies.js';

const router = express.Router();

// Document upload middleware
const storage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
    }
  },
}).single('file');

// Public routes
router.get('/', getCompanies);

// Admin routes (must come before /:id to avoid collision)
router.get('/admin/pending', protect, authorize('admin', 'superadmin'), getPendingCompanies);
router.get('/admin/:id/review', protect, authorize('admin', 'superadmin'), getCompanyReviewDetails);
router.post('/admin/:id/approve', protect, authorize('admin', 'superadmin'), approveCompanyVerification);
router.post('/admin/:id/reject', protect, authorize('admin', 'superadmin'), rejectCompanyVerification);

// Private routes (company owner/member)
router.get('/my', protect, getMyCompanies);
router.post('/', protect, authorize('client'), createCompany);
router.put('/:id', protect, authorize('client'), updateCompany);
router.delete('/:id', protect, authorize('client'), deleteCompany);

// Document routes
router.post('/:companyId/documents', protect, uploadMiddleware, uploadCompanyDocument);
router.get('/:companyId/documents', protect, getCompanyDocuments);
router.delete('/:companyId/documents/:docId', protect, deleteCompanyDocument);

// Public single company route (must come last)
router.get('/:id', getCompany);

export default router;
