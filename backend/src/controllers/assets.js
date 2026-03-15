import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

// @desc    Get all assets (marketplace)
// @route   GET /api/assets
// @access  Public / Optional Auth
export const getAssets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      q,
      category,
      minPrice,
      maxPrice,
      city,
      creatorId,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minPrice) {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }

    if (maxPrice) {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    if (city) {
      query['locationSnapshot.city'] = { $regex: city, $options: 'i' };
    }

    if (creatorId) {
      query.ownerId = creatorId;
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 20;

    const [items, count] = await Promise.all([
      Asset.find(query)
        .populate('ownerId', 'name avatar location role')
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize)
        .sort(sort),
      Asset.countDocuments(query),
    ]);

    res.json({
      status: 'success',
      data: {
        assets: items,
        total: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Public / Optional Auth
export const getAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('ownerId', 'name avatar location role');

    if (!asset) {
      return next(new AppError('Asset not found', 404));
    }

    res.json({
      status: 'success',
      data: { asset },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assets created by current user
// @route   GET /api/assets/me/mine
// @access  Private (Freelancer/Both)
export const getMyAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find({ ownerId: req.user.id }).sort('-createdAt');

    res.json({
      status: 'success',
      data: { assets },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create asset
// @route   POST /api/assets
// @access  Private (Freelancer/Both)
export const createAsset = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const locationSnapshot = user.location
      ? {
          city: user.location.city,
          state: user.location.state,
          country: user.location.country,
        }
      : undefined;

    const asset = await Asset.create({
      ownerId: req.user.id,
      ...req.body,
      locationSnapshot,
    });

    res.status(201).json({
      status: 'success',
      data: { asset },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (owner only)
export const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return next(new AppError('Asset not found', 404));
    }

    if (asset.ownerId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to update this asset', 403));
    }

    const updatableFields = [
      'title',
      'description',
      'category',
      'tags',
      'price',
      'currency',
      'fileUrl',
      'previewImages',
    ];

    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        asset[field] = req.body[field];
      }
    });

    await asset.save();

    res.json({
      status: 'success',
      data: { asset },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (owner only)
export const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return next(new AppError('Asset not found', 404));
    }

    if (asset.ownerId.toString() !== req.user.id) {
      return next(new AppError('Not authorized to delete this asset', 403));
    }

    await asset.deleteOne();

    res.json({
      status: 'success',
      message: 'Asset deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment downloads and return file URL
// @route   POST /api/assets/:id/download
// @access  Private
export const downloadAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return next(new AppError('Asset not found', 404));
    }

    asset.downloads += 1;
    await asset.save();

    res.json({
      status: 'success',
      data: {
        fileUrl: asset.fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate asset
// @route   POST /api/assets/:id/rate
// @access  Private
export const rateAsset = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return next(new AppError('Rating must be between 1 and 5', 400));
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return next(new AppError('Asset not found', 404));
    }

    const currentTotal = asset.ratings.average * asset.ratings.count;
    const newCount = asset.ratings.count + 1;
    const newAverage = (currentTotal + numericRating) / newCount;

    asset.ratings.average = Number(newAverage.toFixed(2));
    asset.ratings.count = newCount;

    await asset.save();

    res.json({
      status: 'success',
      data: { ratings: asset.ratings },
    });
  } catch (error) {
    next(error);
  }
};
