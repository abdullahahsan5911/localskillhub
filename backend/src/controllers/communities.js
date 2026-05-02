import Community from '../models/Community.js';
import CommunityPost from '../models/CommunityPost.js';
import Event from '../models/Event.js';
import CommunityJob from '../models/CommunityJob.js';
import CommunityArticle from '../models/CommunityArticle.js';
import CommunityProduct from '../models/CommunityProduct.js';
import { AppError } from '../middleware/errorHandler.js';
import { canManageCommunity } from '../utils/communityHelpers.js';

// Event-related handlers (migrated from legacy community.js)
export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .limit(20)
      .populate('createdBy', 'name avatar role accountType');

    res.json({ status: 'success', data: { events } });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, location, date, communityId, images, links } = req.body;

    if (!title || !date) {
      return next(new AppError('Title and date are required for events', 400));
    }

    const event = await Event.create({
      title,
      description,
      location,
      date,
      images: Array.isArray(images) ? images : [],
      links: Array.isArray(links) ? links : [],
      communityId: communityId || undefined,
      createdBy: req.user.id
    });

    // populate createdBy before returning so frontend can render name/avatar
    await event.populate('createdBy', 'name avatar role accountType');

    res.status(201).json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const joinEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    const userId = req.user.id;

    if (!event.attendees.some(att => att.toString() === userId.toString())) {
      event.attendees.push(userId);
      await event.save();
    }

    res.json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const unjoinEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) return next(new AppError('Event not found', 404));

    const userId = req.user.id;

    const idx = event.attendees.findIndex(att => att.toString() === userId.toString());
    if (idx !== -1) {
      event.attendees.splice(idx, 1);
      await event.save();
    }

    res.json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const toggleLikeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return next(new AppError('Event not found', 404));

    const userId = req.user.id.toString();
    const idx = event.likes.findIndex((u) => u.toString() === userId);
    if (idx === -1) {
      event.likes.push(req.user.id);
    } else {
      event.likes.splice(idx, 1);
    }

    await event.save();

    res.json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const addEventComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return next(new AppError('Comment content is required', 400));

    const event = await Event.findById(id);
    if (!event) return next(new AppError('Event not found', 404));

    event.comments.push({ userId: req.user.id, content: content.trim(), replies: [] });
    event.commentsCount = (event.commentsCount || 0) + 1;
    await event.save();

    res.status(201).json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const replyEventComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return next(new AppError('Reply content is required', 400));

    const event = await Event.findById(id);
    if (!event) return next(new AppError('Event not found', 404));

    const comment = event.comments.id(commentId);
    if (!comment) return next(new AppError('Comment not found', 404));

    comment.replies.push({ userId: req.user.id, content: content.trim() });
    await event.save();

    res.status(201).json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const reactToEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const allowed = ['like', 'celebrate', 'support', 'insightful'];
    const reactionType = allowed.includes(type) ? type : 'like';

    const event = await Event.findById(id);
    if (!event) return next(new AppError('Event not found', 404));

    const userId = req.user.id.toString();
    const existing = event.reactions.find((r) => r.userId?.toString() === userId);
    if (existing) {
      existing.type = reactionType;
    } else {
      event.reactions.push({ userId: req.user.id, type: reactionType });
    }

    await event.save();
    res.json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return next(new AppError('Event not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(event.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (event.communityId) {
      const linkedCommunity = await Community.findById(event.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to update this event', 403));
    }

    const { title, description, location, date, images, links } = req.body || {};

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (date !== undefined) event.date = date;
    if (images !== undefined) event.images = Array.isArray(images) ? images : [];
    if (links !== undefined) event.links = Array.isArray(links) ? links : [];

    await event.save();
    await event.populate('createdBy', 'name avatar role accountType');

    res.json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return next(new AppError('Event not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(event.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (event.communityId) {
      const linkedCommunity = await Community.findById(event.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to delete this event', 403));
    }

    await Event.findByIdAndDelete(id);
    res.json({ status: 'success', message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

// Job-related handlers
export const getJobs = async (req, res, next) => {
  try {
    const jobs = await CommunityJob.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'name avatar role accountType')
      .populate('communityId', 'name logo');

    res.json({ status: 'success', data: { jobs } });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const { title, description, location, salary, type, communityId, images, links } = req.body;

    if (!title) {
      return next(new AppError('Title is required for jobs', 400));
    }

    const job = await CommunityJob.create({
      title,
      description,
      location,
      salary,
      type,
      images: Array.isArray(images) ? images : [],
      links: Array.isArray(links) ? links : [],
      communityId: communityId || undefined,
      createdBy: req.user.id
    });

    await job.populate('createdBy', 'name avatar role accountType');
    await job.populate('communityId', 'name logo');

    res.status(201).json({ status: 'success', data: { job } });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await CommunityJob.findById(id);
    if (!job) return next(new AppError('Job not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(job.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (job.communityId) {
      const linkedCommunity = await Community.findById(job.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to update this job', 403));
    }

    const { title, description, location, salary, type, images, links } = req.body || {};

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (location !== undefined) job.location = location;
    if (salary !== undefined) job.salary = salary;
    if (type !== undefined) job.type = type;
    if (images !== undefined) job.images = Array.isArray(images) ? images : [];
    if (links !== undefined) job.links = Array.isArray(links) ? links : [];

    await job.save();
    await job.populate('createdBy', 'name avatar role accountType');
    await job.populate('communityId', 'name logo');

    res.json({ status: 'success', data: { job } });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await CommunityJob.findById(id);
    if (!job) return next(new AppError('Job not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(job.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (job.communityId) {
      const linkedCommunity = await Community.findById(job.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to delete this job', 403));
    }

    await CommunityJob.findByIdAndDelete(id);
    res.json({ status: 'success', message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
};

export const toggleLikeJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await CommunityJob.findById(id);
    if (!job) return next(new AppError('Job not found', 404));

    const userId = req.user.id;
    const likeIndex = job.likes.indexOf(userId);

    if (likeIndex > -1) {
      job.likes.splice(likeIndex, 1);
    } else {
      job.likes.push(userId);
    }

    await job.save();
    res.json({ status: 'success', data: { job } });
  } catch (error) {
    next(error);
  }
};

export const addJobComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return next(new AppError('Comment content is required', 400));
    }

    const job = await CommunityJob.findById(id);
    if (!job) return next(new AppError('Job not found', 404));

    job.comments.push({
      userId: req.user.id,
      content: content.trim(),
    });

    job.commentsCount = job.comments.length;
    await job.save();

    await job.populate({
      path: 'comments.userId',
      select: 'name avatar role accountType'
    });

    res.status(201).json({ status: 'success', data: { job } });
  } catch (error) {
    next(error);
  }
};

export const replyJobComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return next(new AppError('Reply content is required', 400));
    }

    const job = await CommunityJob.findById(id);
    if (!job) return next(new AppError('Job not found', 404));

    const comment = job.comments.id(commentId);
    if (!comment) return next(new AppError('Comment not found', 404));

    comment.replies.push({
      userId: req.user.id,
      content: content.trim(),
    });

    await job.save();

    await job.populate({
      path: 'comments.userId',
      select: 'name avatar role accountType'
    });
    await job.populate({
      path: 'comments.replies.userId',
      select: 'name avatar role accountType'
    });

    res.status(201).json({ status: 'success', data: { job } });
  } catch (error) {
    next(error);
  }
};

export const reactToJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const allowed = ['like', 'celebrate', 'support', 'insightful'];
    const reactionType = allowed.includes(type) ? type : 'like';

    const job = await CommunityJob.findById(id);
    if (!job) return next(new AppError('Job not found', 404));

    const userId = req.user.id.toString();
    const existing = job.reactions.find((r) => r.userId?.toString() === userId);
    if (existing) {
      existing.type = reactionType;
    } else {
      job.reactions.push({ userId: req.user.id, type: reactionType });
    }

    await job.save();
    res.json({ status: 'success', data: { job } });
  } catch (error) {
    next(error);
  }
};

// Article-related handlers
export const getArticles = async (req, res, next) => {
  try {
    const articles = await CommunityArticle.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'name avatar role accountType')
      .populate('communityId', 'name logo');

    res.json({ status: 'success', data: { articles } });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req, res, next) => {
  try {
    const { title, content, communityId, images, links } = req.body;

    if (!title || !content) {
      return next(new AppError('Title and content are required for articles', 400));
    }

    const article = await CommunityArticle.create({
      title,
      content,
      images: Array.isArray(images) ? images : [],
      links: Array.isArray(links) ? links : [],
      communityId: communityId || undefined,
      createdBy: req.user.id
    });

    await article.populate('createdBy', 'name avatar role accountType');
    await article.populate('communityId', 'name logo');

    res.status(201).json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await CommunityArticle.findById(id);
    if (!article) return next(new AppError('Article not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(article.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (article.communityId) {
      const linkedCommunity = await Community.findById(article.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to update this article', 403));
    }

    const { title, content, images, links } = req.body || {};

    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (images !== undefined) article.images = Array.isArray(images) ? images : [];
    if (links !== undefined) article.links = Array.isArray(links) ? links : [];

    await article.save();
    await article.populate('createdBy', 'name avatar role accountType');
    await article.populate('communityId', 'name logo');

    res.json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await CommunityArticle.findById(id);
    if (!article) return next(new AppError('Article not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(article.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (article.communityId) {
      const linkedCommunity = await Community.findById(article.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to delete this article', 403));
    }

    await CommunityArticle.findByIdAndDelete(id);
    res.json({ status: 'success', message: 'Article deleted' });
  } catch (error) {
    next(error);
  }
};

export const toggleLikeArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await CommunityArticle.findById(id);
    if (!article) return next(new AppError('Article not found', 404));

    const userId = req.user.id;
    const likeIndex = article.likes.indexOf(userId);

    if (likeIndex > -1) {
      article.likes.splice(likeIndex, 1);
    } else {
      article.likes.push(userId);
    }

    await article.save();
    res.json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
};

export const addArticleComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return next(new AppError('Comment content is required', 400));
    }

    const article = await CommunityArticle.findById(id);
    if (!article) return next(new AppError('Article not found', 404));

    article.comments.push({
      userId: req.user.id,
      content: content.trim(),
    });

    article.commentsCount = article.comments.length;
    await article.save();

    await article.populate({
      path: 'comments.userId',
      select: 'name avatar role accountType'
    });

    res.status(201).json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
};

export const replyArticleComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return next(new AppError('Reply content is required', 400));
    }

    const article = await CommunityArticle.findById(id);
    if (!article) return next(new AppError('Article not found', 404));

    const comment = article.comments.id(commentId);
    if (!comment) return next(new AppError('Comment not found', 404));

    comment.replies.push({
      userId: req.user.id,
      content: content.trim(),
    });

    await article.save();

    await article.populate({
      path: 'comments.userId',
      select: 'name avatar role accountType'
    });
    await article.populate({
      path: 'comments.replies.userId',
      select: 'name avatar role accountType'
    });

    res.status(201).json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
};

export const reactToArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const allowed = ['like', 'celebrate', 'support', 'insightful'];
    const reactionType = allowed.includes(type) ? type : 'like';

    const article = await CommunityArticle.findById(id);
    if (!article) return next(new AppError('Article not found', 404));

    const userId = req.user.id.toString();
    const existing = article.reactions.find((r) => r.userId?.toString() === userId);
    if (existing) {
      existing.type = reactionType;
    } else {
      article.reactions.push({ userId: req.user.id, type: reactionType });
    }

    await article.save();
    res.json({ status: 'success', data: { article } });
  } catch (error) {
    next(error);
  }
};

// Product-related handlers
export const getProducts = async (req, res, next) => {
  try {
    const products = await CommunityProduct.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'name avatar role accountType')
      .populate('communityId', 'name logo');

    res.json({ status: 'success', data: { products } });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, communityId, images, links } = req.body;

    if (!title) {
      return next(new AppError('Title is required for products', 400));
    }

    const product = await CommunityProduct.create({
      title,
      description,
      price,
      images: Array.isArray(images) ? images : [],
      links: Array.isArray(links) ? links : [],
      communityId: communityId || undefined,
      createdBy: req.user.id
    });

    await product.populate('createdBy', 'name avatar role accountType');
    await product.populate('communityId', 'name logo');

    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await CommunityProduct.findById(id);
    if (!product) return next(new AppError('Product not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(product.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (product.communityId) {
      const linkedCommunity = await Community.findById(product.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to update this product', 403));
    }

    const { title, description, price, images, links } = req.body || {};

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (images !== undefined) product.images = Array.isArray(images) ? images : [];
    if (links !== undefined) product.links = Array.isArray(links) ? links : [];

    await product.save();
    await product.populate('createdBy', 'name avatar role accountType');
    await product.populate('communityId', 'name logo');

    res.json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await CommunityProduct.findById(id);
    if (!product) return next(new AppError('Product not found', 404));

    const userId = String(req.user?.id || req.user?._id || '');
    const isCreator = String(product.createdBy || '') === userId;

    let canManageLinkedCommunity = false;
    if (product.communityId) {
      const linkedCommunity = await Community.findById(product.communityId).select('ownerId admins');
      canManageLinkedCommunity = Boolean(linkedCommunity && canManageCommunity(linkedCommunity, req.user));
    }

    if (!isCreator && !canManageLinkedCommunity && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to delete this product', 403));
    }

    await CommunityProduct.findByIdAndDelete(id);
    res.json({ status: 'success', message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

export const toggleLikeProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await CommunityProduct.findById(id);
    if (!product) return next(new AppError('Product not found', 404));

    const userId = req.user.id;
    const likeIndex = product.likes.indexOf(userId);

    if (likeIndex > -1) {
      product.likes.splice(likeIndex, 1);
    } else {
      product.likes.push(userId);
    }

    await product.save();
    res.json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const addProductComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return next(new AppError('Comment content is required', 400));
    }

    const product = await CommunityProduct.findById(id);
    if (!product) return next(new AppError('Product not found', 404));

    product.comments.push({
      userId: req.user.id,
      content: content.trim(),
    });

    product.commentsCount = product.comments.length;
    await product.save();

    await product.populate({
      path: 'comments.userId',
      select: 'name avatar role accountType'
    });

    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const replyProductComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return next(new AppError('Reply content is required', 400));
    }

    const product = await CommunityProduct.findById(id);
    if (!product) return next(new AppError('Product not found', 404));

    const comment = product.comments.id(commentId);
    if (!comment) return next(new AppError('Comment not found', 404));

    comment.replies.push({
      userId: req.user.id,
      content: content.trim(),
    });

    await product.save();

    await product.populate({
      path: 'comments.userId',
      select: 'name avatar role accountType'
    });
    await product.populate({
      path: 'comments.replies.userId',
      select: 'name avatar role accountType'
    });

    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const reactToProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const allowed = ['like', 'celebrate', 'support', 'insightful'];
    const reactionType = allowed.includes(type) ? type : 'like';

    const product = await CommunityProduct.findById(id);
    if (!product) return next(new AppError('Product not found', 404));

    const userId = req.user.id.toString();
    const existing = product.reactions.find((r) => r.userId?.toString() === userId);
    if (existing) {
      existing.type = reactionType;
    } else {
      product.reactions.push({ userId: req.user.id, type: reactionType });
    }

    await product.save();
    res.json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const getUserRank = async (req, res, next) => {
  try {
    const [profile, reputation] = await Promise.all([
      // lazy-load models to avoid circular imports if necessary
      (await import('../models/FreelancerProfile.js')).default.findOne({ userId: req.user.id }),
      (await import('../models/Reputation.js')).default.findOne({ userId: req.user.id })
    ]);
    
    if (!profile || !reputation) {
      return res.json({ status: 'success', data: { rank: null } });
    }

    const rank = await (await import('../models/Reputation.js')).default.countDocuments({
      localTrustScore: { $gt: reputation.localTrustScore }
    }) + 1;

    res.json({ status: 'success', data: { rank, localScore: reputation.localTrustScore, globalScore: reputation.overallScore } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private (any logged-in user)
export const createCommunity = async (req, res, next) => {
  try {
    const { name, description, category, logo, coverImage, tagline, website, industry } = req.body;

    if (!name) {
      return next(new AppError('Community name is required', 400));
    }

    const community = await Community.create({
      name,
      description,
      category,
      logo,
      coverImage,
      tagline,
      website,
      industry,
      ownerId: req.user.id,
      members: [req.user.id],
      admins: [req.user.id]
    });

    res.status(201).json({
      status: 'success',
      data: { community }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get community by id
// @route   GET /api/communities/:id
// @access  Public/Optional Auth
export const getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('ownerId', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('members', 'name avatar')
      .populate('restrictedMembers', 'name avatar')
      .populate('following', 'name logo category industry coverImage tagline')
      .populate('followers', 'name logo category industry coverImage tagline');

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    res.json({
      status: 'success',
      data: { community }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List communities (with simple search)
// @route   GET /api/communities
// @access  Public/Optional Auth
export const getCommunities = async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 10 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    const communities = await Community.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const count = await Community.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        communities,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get communities for current user (member or admin)
// @route   GET /api/communities/my
// @access  Private
export const getMyCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find({
      $or: [
        { ownerId: req.user.id },
        { admins: req.user.id },
        { members: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { communities }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Private
export const joinCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    const userId = req.user.id;

    const isRestricted = Array.isArray(community.restrictedMembers)
      ? community.restrictedMembers.some((memberId) => memberId.toString() === userId.toString())
      : false;

    if (isRestricted) {
      return next(new AppError('You are restricted from joining this community', 403));
    }

    if (!community.members.some((m) => m.toString() === userId.toString())) {
      community.members.push(userId);
      await community.save();
    }

    res.json({
      status: 'success',
      data: { community }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Private
export const leaveCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    const userId = req.user.id.toString();

    // Owner cannot leave their own community
    if (community.ownerId.toString() === userId) {
      return next(new AppError('Owner cannot leave their own community', 400));
    }

    community.members = community.members.filter(
      (memberId) => memberId.toString() !== userId
    );

    community.admins = community.admins.filter(
      (adminId) => adminId.toString() !== userId
    );

    await community.save();

    res.json({
      status: 'success',
      data: { community }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update community details
// @route   PUT /api/communities/:id
// @access  Private (owner, community admin, or platform admin)
export const updateCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('ownerId', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('members', 'name avatar')
      .populate('restrictedMembers', 'name avatar')
      .populate('following', 'name logo category industry coverImage tagline')
      .populate('followers', 'name logo category industry coverImage tagline');

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    // Debugging: log user and community admin/owner info to troubleshoot authorization
    try {
      console.debug('updateCommunity: req.user', { id: req.user?.id || req.user?._id, role: req.user?.role });
      console.debug('updateCommunity: community.ownerId', community.ownerId?.toString());
      console.debug('updateCommunity: community.admins', (community.admins || []).map((a) => a?.toString()));
    } catch (dbgErr) {
      console.debug('updateCommunity debug failed', dbgErr);
    }

    if (!canManageCommunity(community, req.user)) {
      return next(new AppError('Not authorized to update this community', 403));
    }

    const allowedFields = ['name', 'description', 'category', 'logo', 'coverImage', 'tagline', 'website', 'industry'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        community[field] = req.body[field];
      }
    });

    await community.save();

    const updated = await Community.findById(community._id)
      .populate('ownerId', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('members', 'name avatar')
      .populate('restrictedMembers', 'name avatar')
      .populate('following', 'name logo category industry coverImage tagline')
      .populate('followers', 'name logo category industry coverImage tagline');

    res.json({
      status: 'success',
      data: { community: updated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a community admin
// @route   POST /api/communities/:id/admins
// @access  Private (owner or platform admin)
export const addCommunityAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.id);

    if (!community) return next(new AppError('Community not found', 404));
    if (!canManageCommunity(community, req.user) && community.ownerId?.toString() !== req.user.id?.toString()) {
      return next(new AppError('Not authorized to manage admins', 403));
    }
    if (!userId) return next(new AppError('User ID is required', 400));

    community.admins = Array.from(new Set([...(community.admins || []).map((id) => id.toString()), userId.toString()])).map((id) => id);
    await community.save();

    res.json({ status: 'success', data: { community } });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a community admin
// @route   DELETE /api/communities/:id/admins/:userId
// @access  Private (owner or platform admin)
export const removeCommunityAdmin = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const community = await Community.findById(id);

    if (!community) return next(new AppError('Community not found', 404));
    if (!canManageCommunity(community, req.user) && community.ownerId?.toString() !== req.user.id?.toString()) {
      return next(new AppError('Not authorized to manage admins', 403));
    }

    community.admins = (community.admins || []).filter((adminId) => adminId?.toString() !== userId);
    await community.save();

    res.json({ status: 'success', data: { community } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a restricted member
// @route   POST /api/communities/:id/restricted
// @access  Private (owner/admin/platform admin)
export const addRestrictedMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.id);

    if (!community) return next(new AppError('Community not found', 404));
    if (!canManageCommunity(community, req.user)) {
      return next(new AppError('Not authorized to manage restricted members', 403));
    }
    if (!userId) return next(new AppError('User ID is required', 400));

    community.restrictedMembers = Array.from(new Set([...(community.restrictedMembers || []).map((id) => id.toString()), userId.toString()])).map((id) => id);
    community.members = (community.members || []).filter((memberId) => memberId?.toString() !== userId.toString());
    await community.save();

    res.json({ status: 'success', data: { community } });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a restricted member
// @route   DELETE /api/communities/:id/restricted/:userId
// @access  Private (owner/admin/platform admin)
export const removeRestrictedMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const community = await Community.findById(id);

    if (!community) return next(new AppError('Community not found', 404));
    if (!canManageCommunity(community, req.user)) {
      return next(new AppError('Not authorized to manage restricted members', 403));
    }

    community.restrictedMembers = (community.restrictedMembers || []).filter((memberId) => memberId?.toString() !== userId);
    await community.save();

    res.json({ status: 'success', data: { community } });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow another community page
// @route   POST /api/communities/:id/following
// @access  Private (owner/admin/platform admin)
export const followCommunityPage = async (req, res, next) => {
  try {
    const { targetCommunityId } = req.body;
    const sourceCommunity = await Community.findById(req.params.id);
    const targetCommunity = await Community.findById(targetCommunityId);

    if (!sourceCommunity) return next(new AppError('Source community not found', 404));
    if (!targetCommunity) return next(new AppError('Target community not found', 404));
    if (!canManageCommunity(sourceCommunity, req.user)) {
      return next(new AppError('Not authorized to manage this community', 403));
    }
    if (sourceCommunity._id.toString() === targetCommunity._id.toString()) {
      return next(new AppError('A community cannot follow itself', 400));
    }

    sourceCommunity.following = Array.from(new Set([...(sourceCommunity.following || []).map((id) => id.toString()), targetCommunity._id.toString()])).map((id) => id);
    targetCommunity.followers = Array.from(new Set([...(targetCommunity.followers || []).map((id) => id.toString()), sourceCommunity._id.toString()])).map((id) => id);

    await Promise.all([sourceCommunity.save(), targetCommunity.save()]);

    res.json({ status: 'success', data: { community: sourceCommunity } });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a community page
// @route   DELETE /api/communities/:id/following/:targetCommunityId
// @access  Private (owner/admin/platform admin)
export const unfollowCommunityPage = async (req, res, next) => {
  try {
    const { id, targetCommunityId } = req.params;
    const sourceCommunity = await Community.findById(id);
    const targetCommunity = await Community.findById(targetCommunityId);

    if (!sourceCommunity) return next(new AppError('Source community not found', 404));
    if (!targetCommunity) return next(new AppError('Target community not found', 404));
    if (!canManageCommunity(sourceCommunity, req.user)) {
      return next(new AppError('Not authorized to manage this community', 403));
    }

    sourceCommunity.following = (sourceCommunity.following || []).filter((communityId) => communityId?.toString() !== targetCommunityId);
    targetCommunity.followers = (targetCommunity.followers || []).filter((communityId) => communityId?.toString() !== id);

    await Promise.all([sourceCommunity.save(), targetCommunity.save()]);

    res.json({ status: 'success', data: { community: sourceCommunity } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feed from followed communities
// @route   GET /api/communities/:id/feed
// @access  Private (owner/admin/platform admin)
export const getCommunityFeed = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('following', 'name logo category industry coverImage tagline');

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    if (!canManageCommunity(community, req.user)) {
      return next(new AppError('Not authorized to view this feed', 403));
    }

    const followingIds = Array.isArray(community.following)
      ? community.following.map((item) => item?._id?.toString?.() || item?.toString?.()).filter(Boolean)
      : [];

    if (followingIds.length === 0) {
      return res.json({
        status: 'success',
        data: { communities: [], posts: [], events: [], items: [] }
      });
    }

    const [communities, posts, events] = await Promise.all([
      Community.find({ _id: { $in: followingIds } })
        .select('name logo category industry coverImage tagline'),
      CommunityPost.find({ communityId: { $in: followingIds }, isHidden: { $ne: true } })
        .populate('authorId', 'name avatar role accountType')
        .sort({ createdAt: -1 })
        .limit(30),
      Event.find({ communityId: { $in: followingIds } })
        .sort({ date: 1 })
        .limit(20)
        .populate('createdBy', 'name avatar role accountType')
    ]);

    const items = [
      ...posts.map((post) => ({ type: 'post', createdAt: post.createdAt, post })),
      ...events.map((event) => ({ type: 'event', createdAt: event.date, event })),
    ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    res.json({
      status: 'success',
      data: { communities, posts, events, items }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a community
// @route   DELETE /api/communities/:id
// @access  Private (owner or admin)
export const deleteCommunity = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const community = await Community.findById(communityId);

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    const userId = req.user.id.toString();
    const isOwner = community.ownerId?.toString() === userId;
    const isCommunityAdmin = Array.isArray(community.admins)
      ? community.admins.some((adminId) => adminId?.toString() === userId)
      : false;
    const isPlatformAdmin = req.user.role === 'admin';

    if (!isOwner && !isCommunityAdmin && !isPlatformAdmin) {
      return next(new AppError('Not authorized to delete this community', 403));
    }

    // Cascade delete community-owned content and detach relationship links.
    await Promise.all([
      CommunityPost.deleteMany({ communityId }),
      Event.deleteMany({ communityId }),
      Community.updateMany(
        { _id: { $ne: communityId } },
        {
          $pull: {
            following: community._id,
            followers: community._id,
          },
        },
      ),
    ]);

    await community.deleteOne();

    res.json({
      status: 'success',
      message: 'Community and related data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
