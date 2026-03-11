import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  findFreelancersNearby,
  findJobsNearby,
  getFreelancersByCity,
  getJobsByCity,
  getMapClusters,
  getPopularCities,
  geocodeAddress
} from '../controllers/geolocationController.js';

const router = express.Router();

// All routes are public or use optional auth
router.use(optionalAuth);

// Nearby search
router.get('/freelancers/nearby', findFreelancersNearby);
router.get('/jobs/nearby', findJobsNearby);

// City-based search
router.get('/freelancers/city/:city', getFreelancersByCity);
router.get('/jobs/city/:city', getJobsByCity);

// Map features
router.get('/map/clusters', getMapClusters);
router.get('/map/geocode', geocodeAddress);

// Popular cities
router.get('/cities/popular', getPopularCities);

export default router;
