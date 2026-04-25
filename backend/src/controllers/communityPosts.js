import Community from '../models/Community.js';
import CommunityPost from '../models/CommunityPost.js';
import { AppError } from '../middleware/errorHandler.js';
import { getCommunityOrThrow, isCommunityMemberOrAdmin } from '../utils/communityHelpers.js';

// @desc    List posts for a community (most recent first)
// @route   GET /api/communities/:id/posts
// @access  Public/Optional Auth
export const getCommunityPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    await getCommunityOrThrow(id);

    const skip = (Number(page) - 1) * Number(limit);

    // Build query: If not owner/admin, only see non-hidden posts OR your own hidden posts
    const query = { communityId: id };

    if (req.user) {
      const community = await Community.findById(id);
      const { isOwner, isAdmin } = isCommunityMemberOrAdmin(community, req.user.id);
      const isPlatformAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin && !isPlatformAdmin) {
        // Regular user/guest: see non-hidden posts OR your own posts
        query.$or = [
          { isHidden: { $ne: true } },
          { authorId: req.user.id }
        ];
      }
      // If owner/admin/platformAdmin, they see everything (including hidden)
    } else {
      // Unauthenticated: only non-hidden
      query.isHidden = { $ne: true };
    }

    const [posts, count] = await Promise.all([
      CommunityPost.find(query)
        .populate('authorId', 'name avatar role accountType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CommunityPost.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: {
        posts,
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a post in a community
// @route   POST /api/communities/:id/posts
// @access  Private (any member, owner, or admin)
export const createCommunityPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, images, links, repostOf } = req.body;

    if (!content || !content.trim()) {
      return next(new AppError('Post content is required', 400));
    }

    const community = await getCommunityOrThrow(id);
    const { isOwner, isAdmin, isMember } = isCommunityMemberOrAdmin(community, req.user.id);
    const isRestricted = Array.isArray(community.restrictedMembers)
      ? community.restrictedMembers.some((memberId) => memberId?.toString() === req.user.id.toString())
      : false;

    // Follow a LinkedIn-style rule: only members/admins/owner can post
    if (isRestricted || (!isOwner && !isAdmin && !isMember)) {
      return next(new AppError('You must join the community before posting', 403));
    }

    const post = await CommunityPost.create({
      communityId: id,
      authorId: req.user.id,
      content: content.trim(),
      images: Array.isArray(images) ? images : [],
      links: Array.isArray(links) ? links : [],
      repostOf: repostOf || undefined,
    });

    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.status(201).json({
      status: 'success',
      data: { post: populated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Repost a community post
// @route   POST /api/communities/:id/posts/:postId/repost
// @access  Private (any authenticated user)
export const repostCommunityPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;

    await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);

    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const userId = req.user.id.toString();
    const reposts = Array.isArray(post.reposts) ? post.reposts : [];
    const alreadyReposted = reposts.some((reposterId) => reposterId?.toString() === userId);

    if (alreadyReposted) {
      post.reposts = reposts.filter((reposterId) => reposterId?.toString() !== userId);
      post.repostsCount = Math.max(0, Number(post.repostsCount || reposts.length || 0) - 1);
      await CommunityPost.deleteMany({ authorId: req.user.id, repostOf: post._id });
    } else {
      post.reposts.push(req.user.id);
      post.repostsCount = Number(post.repostsCount || reposts.length || 0) + 1;
    }

    await post.save();

    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.json({
      status: 'success',
      data: { post: populated },
      meta: { reposted: !alreadyReposted },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a community post
// @route   PUT /api/communities/:id/posts/:postId
// @access  Private (author, community owner/admin, or platform admin)
export const updateCommunityPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const { content, images, links } = req.body;

    const community = await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);

    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const userId = req.user.id.toString();
    const { isOwner } = isCommunityMemberOrAdmin(community, userId);
    const isAuthor = post.authorId?.toString() === userId;

    // Edit/Delete allowed for post author or community owner only
    if (!isAuthor && !isOwner) {
      return next(new AppError('Not authorized to edit this post', 403));
    }

    if (content !== undefined) {
      if (!content || !content.trim()) {
        return next(new AppError('Post content is required', 400));
      }
      post.content = content.trim();
    }

    if (images !== undefined) {
      post.images = Array.isArray(images) ? images : [];
    }

    if (links !== undefined) {
      post.links = Array.isArray(links) ? links : [];
    }

    // Hide/Unhide allowed for community owner only
    if (req.body.isHidden !== undefined) {
      if (!isOwner) {
        return next(new AppError('Not authorized to hide/unhide this post', 403));
      }
      post.isHidden = !!req.body.isHidden;
      post.hiddenBy = req.body.isHidden ? userId : undefined;
    }

    await post.save();

    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.json({
      status: 'success',
      data: { post: populated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a community post
// @route   DELETE /api/communities/:id/posts/:postId
// @access  Private (author, community owner/admin, or platform admin)
export const deleteCommunityPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;

    const community = await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);

    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const userId = req.user.id.toString();
    const { isOwner } = isCommunityMemberOrAdmin(community, userId);
    const isAuthor = post.authorId?.toString() === userId;

    // Delete allowed for post author or community owner only
    if (!isAuthor && !isOwner) {
      return next(new AppError('Not authorized to delete this post', 403));
    }

    await post.deleteOne();

    res.json({
      status: 'success',
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a community post
// @route   POST /api/communities/:id/posts/:postId/like
// @access  Private
export const toggleLikeCommunityPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const community = await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);
    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const userId = req.user.id.toString();
    const idx = post.likes.findIndex((u) => u.toString() === userId);
    if (idx === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(idx, 1);
    }

    await post.save();
    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.json({ status: 'success', data: { post: populated } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a community post
// @route   POST /api/communities/:id/posts/:postId/comments
// @access  Private
export const addCommentToPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) return next(new AppError('Comment content is required', 400));

    const community = await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);
    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const comment = {
      userId: req.user.id,
      content: content.trim(),
      replies: [],
    };

    post.comments.push(comment);
    post.commentsCount = (post.commentsCount || 0) + 1;

    await post.save();
    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.status(201).json({ status: 'success', data: { post: populated } });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a post comment
// @route   POST /api/communities/:id/posts/:postId/comments/:commentId/replies
// @access  Private
export const replyToPostComment = async (req, res, next) => {
  try {
    const { id, postId, commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) return next(new AppError('Reply content is required', 400));

    await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);
    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const comment = post.comments.id(commentId);
    if (!comment) return next(new AppError('Comment not found', 404));

    comment.replies.push({ userId: req.user.id, content: content.trim() });

    await post.save();
    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.status(201).json({ status: 'success', data: { post: populated } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment from a community post
// @route   DELETE /api/communities/:id/posts/:postId/comments/:commentId
// @access  Private (comment author or community owner)
export const deletePostComment = async (req, res, next) => {
  try {
    const { id, postId, commentId } = req.params;

    const community = await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);
    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const comment = post.comments.id(commentId);
    if (!comment) return next(new AppError('Comment not found', 404));

    const userId = req.user.id.toString();
    const { isOwner } = isCommunityMemberOrAdmin(community, userId);
    const isAuthor = comment.userId?.toString() === userId;

    if (!isAuthor && !isOwner) {
      return next(new AppError('Not authorized to delete this comment', 403));
    }

    // Remove the comment
    comment.remove();
    post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);

    await post.save();
    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.json({ status: 'success', data: { post: populated } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update reaction to a post
// @route   POST /api/communities/:id/posts/:postId/reactions
// @access  Private
export const reactToPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const { type } = req.body;

    const allowed = ['like', 'celebrate', 'support', 'insightful'];
    const reactionType = allowed.includes(type) ? type : 'like';

    await getCommunityOrThrow(id);
    const post = await CommunityPost.findById(postId);
    if (!post || post.communityId.toString() !== id.toString()) {
      return next(new AppError('Post not found in this community', 404));
    }

    const userId = req.user.id.toString();
    const existing = post.reactions.find((r) => r.userId?.toString() === userId);
    if (existing) {
      existing.type = reactionType;
    } else {
      post.reactions.push({ userId: req.user.id, type: reactionType });
    }

    await post.save();
    const populated = await post.populate('authorId', 'name avatar role accountType');

    res.json({ status: 'success', data: { post: populated } });
  } catch (error) {
    next(error);
  }
};
