import Company from '../models/Company.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

// @desc    Create a new company (owned by current user)
// @route   POST /api/companies
// @access  Private (Client/Both/Admin/Superadmin)
export const createCompany = async (req, res, next) => {
  try {
    const { name, description, industry, website, location, logo } = req.body;

    if (!name) {
      return next(new AppError('Company name is required', 400));
    }

    const company = await Company.create({
      name,
      description,
      industry,
      website,
      location,
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

    const allowedFields = ['name', 'description', 'industry', 'website', 'location', 'logo'];
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
