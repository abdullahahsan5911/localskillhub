import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  addJobBookmark,
  removeJobBookmark,
} from '../controllers/users.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Bookmarks for current user
router.post('/me/bookmarks', addJobBookmark);
router.delete('/me/bookmarks/:jobId', removeJobBookmark);

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);

export default router;
