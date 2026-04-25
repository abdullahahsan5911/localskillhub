import Community from '../models/Community.js';
import { AppError } from '../middleware/errorHandler.js';

export const getCommunityOrThrow = async (communityId) => {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new AppError('Community not found', 404);
  }
  return community;
};

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (typeof value.toString === 'function') return value.toString();
  return String(value);
};

export const isCommunityMemberOrAdmin = (community, userId) => {
  const id = String(userId || '');
  const isOwner = normalizeId(community.ownerId) === id;
  const isAdmin = Array.isArray(community.admins)
    ? community.admins.some((adminId) => normalizeId(adminId) === id)
    : false;
  const isMember = Array.isArray(community.members)
    ? community.members.some((memberId) => normalizeId(memberId) === id)
    : false;
  return { isOwner, isAdmin, isMember };
};

export const canManageCommunity = (community, user) => {
  if (!community || !user) return false;
  const userId = String(user.id || user._id || '');
  const isOwner = normalizeId(community.ownerId) === userId;
  const isCommunityAdmin = Array.isArray(community.admins)
    ? community.admins.some((adminId) => normalizeId(adminId) === userId)
    : false;
  const isPlatformAdmin = user.role === 'admin';
  return isOwner || isCommunityAdmin || isPlatformAdmin;
};
