import Review from '../models/Review.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import { AppError } from '../middleware/errorHandler.js';

export const getReviews = async (req, res, next) => {
  try {
    const { userId, contractId } = req.query;
    const query = { isPublic: true };
    
    if (userId) query.reviewedUserId = userId;
    if (contractId) query.contractId = contractId;

    const reviews = await Review.find(query)
      .populate('reviewerId', 'name avatar')
      .populate('reviewedUserId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: { reviews } });
  } catch (error) {
    next(error);
  }
};

export const getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewerId', 'name avatar')
      .populate('reviewedUserId', 'name avatar');

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    res.json({ status: 'success', data: { review } });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const review = await Review.create({
      reviewerId: req.user.id,
      ...req.body
    });

    // Update freelancer average rating
    const profile = await FreelancerProfile.findOne({ userId: review.reviewedUserId });
    if (profile) {
      const allReviews = await Review.find({ 
        reviewedUserId: review.reviewedUserId,
        isPublic: true 
      });
      
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating.overall, 0) / allReviews.length;
      
      profile.ratings.average = avgRating;
      profile.ratings.count = allReviews.length;
      profile.ratings.distribution[review.rating.overall] += 1;
      
      await profile.save();
    }

    res.status(201).json({ status: 'success', data: { review } });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (review.reviewerId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ status: 'success', data: { review } });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (review.reviewerId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    await review.deleteOne();
    res.json({ status: 'success', message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

export const respondToReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (review.reviewedUserId.toString() !== req.user.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    review.response = {
      text: req.body.text,
      respondedAt: Date.now()
    };

    await review.save();
    res.json({ status: 'success', data: { review } });
  } catch (error) {
    next(error);
  }
};

export const markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (review.markedHelpfulBy.includes(req.user.id)) {
      review.markedHelpfulBy.pull(req.user.id);
      review.helpfulCount -= 1;
    } else {
      review.markedHelpfulBy.push(req.user.id);
      review.helpfulCount += 1;
    }

    await review.save();
    res.json({ status: 'success', data: { review } });
  } catch (error) {
    next(error);
  }
};
