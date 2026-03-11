import GeoLocationService from '../services/geolocation.service.js';

/**
 * Geo-Location Controller - Handles location-based discovery and map features
 */

// Find Freelancers Nearby
export const findFreelancersNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const filters = {
      city: req.query.city,
      state: req.query.state,
      skills: req.query.skills ? req.query.skills.split(',') : [],
      minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
      availability: req.query.availability,
      sortBy: req.query.sortBy || 'distance',
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const freelancers = await GeoLocationService.findFreelancersNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius),
      filters
    );

    res.json({
      status: 'success',
      data: {
        freelancers,
        count: freelancers.length,
        searchRadius: radius
      }
    });
  } catch (error) {
    next(error);
  }
};

// Find Jobs Nearby
export const findJobsNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const filters = {
      category: req.query.category,
      skills: req.query.skills ? req.query.skills.split(',') : [],
      remoteOnly: req.query.remoteOnly === 'true',
      minBudget: req.query.minBudget ? parseFloat(req.query.minBudget) : undefined,
      maxBudget: req.query.maxBudget ? parseFloat(req.query.maxBudget) : undefined,
      sortBy: req.query.sortBy || 'distance',
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const jobs = await GeoLocationService.findJobsNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius),
      filters
    );

    res.json({
      status: 'success',
      data: {
        jobs,
        count: jobs.length,
        searchRadius: radius
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Freelancers by City
export const getFreelancersByCity = async (req, res, next) => {
  try {
    const { city } = req.params;
    const { state, skills, minRating, limit } = req.query;

    const filters = {
      skills: skills ? skills.split(',') : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      limit: limit ? parseInt(limit) : 50
    };

    const freelancers = await GeoLocationService.getFreelancersByCity(city, state, filters);

    res.json({
      status: 'success',
      data: {
        freelancers,
        count: freelancers.length,
        city,
        state
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Jobs by City
export const getJobsByCity = async (req, res, next) => {
  try {
    const { city } = req.params;
    const { state, category, remoteAllowed, limit } = req.query;

    const filters = {
      category,
      remoteAllowed: remoteAllowed === 'true' ? true : remoteAllowed === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : 50
    };

    const jobs = await GeoLocationService.getJobsByCity(city, state, filters);

    res.json({
      status: 'success',
      data: {
        jobs,
        count: jobs.length,
        city,
        state
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Map Clusters
export const getMapClusters = async (req, res, next) => {
  try {
    const { neLat, neLng, swLat, swLng, type = 'freelancers' } = req.query;

    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({
        status: 'error',
        message: 'Map bounds (neLat, neLng, swLat, swLng) are required'
      });
    }

    const bounds = {
      neLat: parseFloat(neLat),
      neLng: parseFloat(neLng),
      swLat: parseFloat(swLat),
      swLng: parseFloat(swLng)
    };

    const clusters = await GeoLocationService.getMapClusters(bounds, type);

    res.json({
      status: 'success',
      data: {
        clusters,
        count: clusters.length,
        type
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Popular Cities
export const getPopularCities = async (req, res, next) => {
  try {
    const cities = await GeoLocationService.getPopularCities();

    res.json({
      status: 'success',
      data: { cities }
    });
  } catch (error) {
    next(error);
  }
};

// Geocode Address
export const geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        status: 'error',
        message: 'Address is required'
      });
    }

    const result = await GeoLocationService.geocodeAddress(address);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Reverse geocode coordinates to address fields
export const reverseGeocodeCoordinates = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const result = await GeoLocationService.reverseGeocodeCoordinates(latitude, longitude);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Backfill stored locations for users and jobs
export const backfillGeolocations = async (req, res, next) => {
  try {
    const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 200;
    const summary = await GeoLocationService.backfillStoredLocations(limit);

    res.json({
      status: 'success',
      message: 'Geolocation backfill completed',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
