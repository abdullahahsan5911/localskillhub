import Company from '../models/Company.js';
import CompanyDocument from '../models/CompanyDocument.js';
import CompanyReview from '../models/CompanyReview.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Create a new company (owned by current user)
// @route   POST /api/companies
// @access  Private (Client/Both/Admin/Superadmin)
export const createCompany = async (req, res, next) => {
  try {
    const { name, description, industry, website, location, logo, businessPhone } = req.body;

    if (!name) {
      return next(new AppError('Company name is required', 400));
    }

    const company = await Company.create({
      name,
      description,
      industry,
      website,
      location,
      businessPhone,
      logo,
      ownerId: req.user.id,
      teamMembers: [req.user.id]
    });

    // Keep auth/profile payloads in sync for company-based flows (jobs, hiring requests).
    await User.findByIdAndUpdate(req.user.id, {
      accountType: 'company',
      companyId: company._id,
    });

    res.status(201).json({
      status: 'success',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single company (public)
// @route   GET /api/companies/:id
// @access  Public/Optional Auth
export const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('ownerId', 'name avatar')
      .populate('teamMembers', 'name avatar');

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    res.json({
      status: 'success',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List companies (simple search/filter)
// @route   GET /api/companies
// @access  Public/Optional Auth
export const getCompanies = async (req, res, next) => {
  try {
    const { q, industry, page = 1, limit = 10 } = req.query;

    const query = {};
    if (industry) query.industry = industry;
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    const companies = await Company.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const count = await Company.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        companies,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get companies where current user is owner or team member
// @route   GET /api/companies/my
// @access  Private
export const getMyCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({
      $or: [
        { ownerId: req.user.id },
        { teamMembers: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { companies }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a company (owner or admin only)
// @route   PUT /api/companies/:id
// @access  Private
export const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    const isOwner = company.ownerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('Not authorized to update this company', 403));
    }

    const allowedFields = ['name', 'description', 'industry', 'website', 'location', 'logo', 'businessPhone'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updated = await Company.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      data: { company: updated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a company (owner or admin only)
// @route   DELETE /api/companies/:id
// @access  Private
export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    const isOwner = company.ownerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('Not authorized to delete this company', 403));
    }

    await Company.findByIdAndDelete(req.params.id);

    // Keep user profile pointers valid when the referenced company is removed.
    await User.updateMany(
      { companyId: company._id },
      { $unset: { companyId: 1 } }
    );

    res.json({
      status: 'success',
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload verification document
// @route   POST /api/companies/:id/documents
// @access  Private (Company owner)
export const uploadCompanyDocument = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return next(new AppError('No file provided', 400));
    }

    if (!documentType) {
      return next(new AppError('Document type is required', 400));
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Authorization: only owner or admin
    const isOwner = company.ownerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new AppError('Not authorized to upload documents for this company', 403));
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `localskillhub/company_docs/${companyId}`,
          resource_type: 'raw',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Create document record
    const document = await CompanyDocument.create({
      companyId,
      documentType,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    // New evidence should re-enter admin review for unverified/rejected companies.
    if (company.verificationStatus === 'unverified' || company.verificationStatus === 'rejected') {
      company.verificationStatus = 'pending';
      await company.save();
    }

    res.status(201).json({
      status: 'success',
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company documents
// @route   GET /api/companies/:id/documents
// @access  Private (Company owner or admin)
export const getCompanyDocuments = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Authorization: owner, team member, or admin
    const isOwner = company.ownerId.toString() === req.user.id.toString();
    const isTeamMember = company.teamMembers.includes(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTeamMember && !isAdmin) {
      return next(new AppError('Not authorized to view documents for this company', 403));
    }

    const documents = await CompanyDocument.find({ companyId })
      .populate('reviewedBy', 'name email');

    res.json({
      status: 'success',
      data: { documents }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company document
// @route   DELETE /api/companies/:id/documents/:docId
// @access  Private (Company owner or admin)
export const deleteCompanyDocument = async (req, res, next) => {
  try {
    const { companyId, docId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    const isOwner = company.ownerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new AppError('Not authorized to delete documents', 403));
    }

    const document = await CompanyDocument.findById(docId);
    if (!document) {
      return next(new AppError('Document not found', 404));
    }

    // Delete from Cloudinary
    const publicId = document.fileUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`localskillhub/company_docs/${companyId}/${publicId}`, {
      resource_type: 'raw'
    });

    await CompanyDocument.findByIdAndDelete(docId);

    res.json({
      status: 'success',
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN ENDPOINTS

// @desc    Get pending companies for review
// @route   GET /api/admin/companies/pending
// @access  Private (Admin only)
export const getPendingCompanies = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(new AppError('Only admins can view pending companies', 403));
    }

    const { page = 1, limit = 10 } = req.query;

    const companies = await Company.find({ verificationStatus: 'pending' })
      .populate('ownerId', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const count = await Company.countDocuments({ verificationStatus: 'pending' });

    res.json({
      status: 'success',
      data: {
        companies,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company details with documents (for admin review)
// @route   GET /api/admin/companies/:id/review
// @access  Private (Admin only)
export const getCompanyReviewDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(new AppError('Only admins can view company reviews', 403));
    }

    const company = await Company.findById(req.params.id)
      .populate('ownerId', 'name email avatar');

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    const documents = await CompanyDocument.find({ companyId: req.params.id });
    const review = await CompanyReview.findOne({ companyId: req.params.id });

    res.json({
      status: 'success',
      data: { company, documents, review }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve company verification
// @route   POST /api/admin/companies/:id/approve
// @access  Private (Admin only)
export const approveCompanyVerification = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(new AppError('Only admins can approve companies', 403));
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    company.verificationStatus = 'approved';
    await company.save();

    // Update or create review record
    await CompanyReview.findOneAndUpdate(
      { companyId: req.params.id },
      {
        status: 'approved',
        reviewedBy: req.user.id,
        approvalDate: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      message: 'Company approved successfully',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject company verification
// @route   POST /api/admin/companies/:id/reject
// @access  Private (Admin only)
export const rejectCompanyVerification = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(new AppError('Only admins can reject companies', 403));
    }

    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return next(new AppError('Rejection reason is required', 400));
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    company.verificationStatus = 'rejected';
    await company.save();

    // Update or create review record
    await CompanyReview.findOneAndUpdate(
      { companyId: req.params.id },
      {
        status: 'rejected',
        reviewedBy: req.user.id,
        rejectionDate: new Date(),
        rejectionReason,
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      message: 'Company rejected',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};
