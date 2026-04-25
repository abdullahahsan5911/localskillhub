import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import {
  createCommunity,
  updateCommunity,
  addCommunityAdmin,
  removeCommunityAdmin,
  addRestrictedMember,
  removeRestrictedMember,
  followCommunityPage,
  unfollowCommunityPage,
  getCommunityFeed,
  deleteCommunity,
  getCommunity,
  getCommunities,
  getMyCommunities,
  joinCommunity,
  leaveCommunity
} from '../controllers/communities.js';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  unjoinEvent,
  toggleLikeEvent,
  addEventComment,
  replyEventComment,
  reactToEvent,
  getUserRank
} from '../controllers/communities.js';
import {
  getCommunityPosts,
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  repostCommunityPost
} from '../controllers/communityPosts.js';
import {
  toggleLikeCommunityPost,
  addCommentToPost,
  replyToPostComment,
  deletePostComment,
  reactToPost
} from '../controllers/communityPosts.js';

const router = express.Router();

router.get('/', optionalAuth, getCommunities);
router.get('/my', protect, getMyCommunities);
// Event routes (consolidated under /api/communities/events)
router.get('/events', optionalAuth, getEvents);
router.post('/events', protect, createEvent);
router.put('/events/:id', protect, updateEvent);
router.delete('/events/:id', protect, deleteEvent);
router.post('/events/:id/join', protect, joinEvent);
router.delete('/events/:id/join', protect, unjoinEvent);
router.post('/events/:id/like', protect, toggleLikeEvent);
router.post('/events/:id/comments', protect, addEventComment);
router.post('/events/:id/comments/:commentId/replies', protect, replyEventComment);
router.post('/events/:id/reactions', protect, reactToEvent);
router.get('/rank', protect, getUserRank);

router.get('/:id', optionalAuth, getCommunity);
router.get('/:id/feed', protect, getCommunityFeed);

// Community posts (LinkedIn-style group posts)
router.get('/:id/posts', optionalAuth, getCommunityPosts);
router.post('/:id/posts', protect, createCommunityPost);
router.put('/:id/posts/:postId', protect, updateCommunityPost);
router.delete('/:id/posts/:postId', protect, deleteCommunityPost);
// Post interactions
router.post('/:id/posts/:postId/like', protect, toggleLikeCommunityPost);
router.post('/:id/posts/:postId/comments', protect, addCommentToPost);
router.post('/:id/posts/:postId/comments/:commentId/replies', protect, replyToPostComment);
router.delete('/:id/posts/:postId/comments/:commentId', protect, deletePostComment);
router.post('/:id/posts/:postId/reactions', protect, reactToPost);
router.post('/:id/posts/:postId/repost', protect, repostCommunityPost);

router.post('/', protect, createCommunity);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);
router.put('/:id', protect, updateCommunity);
router.post('/:id/admins', protect, addCommunityAdmin);
router.delete('/:id/admins/:userId', protect, removeCommunityAdmin);
router.post('/:id/restricted', protect, addRestrictedMember);
router.delete('/:id/restricted/:userId', protect, removeRestrictedMember);
router.post('/:id/following', protect, followCommunityPage);
router.delete('/:id/following/:targetCommunityId', protect, unfollowCommunityPage);
router.delete('/:id', protect, deleteCommunity);



export default router;
