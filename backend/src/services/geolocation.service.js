import User from '../models/User.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import Job from '../models/Job.js';

/**
 * Geo-Location Service - Handles region-based discovery and map features
 * Supports: City/state filtering, distance-based search, map clustering
 */
class GeoLocationService {
  /**
   * Find freelancers near a location
   * @param {Number} latitude
   * @param {Number} longitude  
   * @param {Number} radiusKm - Search radius in kilometers
   * @param {Object} filters - Additional filters (skills, rating, etc.)
   */
  static async findFreelancersNearby(latitude, longitude, radiusKm = 50, filters = {}) {
    try {
      const radiusMeters = radiusKm * 1000;
      
      // Build query
      const query = {
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusMeters
          }
        },
        isActive: true
      };

      // Add city filter if provided
      if (filters.city) {
        query['location.city'] = new RegExp(filters.city, 'i');
      }

      // Add state filter if provided
      if (filters.state) {
        query['location.state'] = new RegExp(filters.state, 'i');
      }

      // Find users  
      const users = await User.find(query).limit(100);
      const userIds = users.map(u => u._id);

      // Get freelancer profiles
      let profileQuery = { userId: { $in: userIds } };

      // Add skill filter
      if (filters.skills && filters.skills.length > 0) {
        profileQuery['skills.name'] = { $in: filters.skills };
      }

      // Add rating filter
      if (filters.minRating) {
        profileQuery['ratings.average'] = { $gte: filters.minRating };
      }

      // Add availability filter
      if (filters.availability) {
        profileQuery['availability.status'] = filters.availability;
      }

      let profiles = await FreelancerProfile.find(profileQuery)
        .populate('userId', 'name avatar location verifiedBadges')
        .limit(filters.limit || 50);

      // Add distance calculation
      profiles = profiles.map(profile => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          profile.userId.location.coordinates.coordinates[1],
          profile.userId.location.coordinates.coordinates[0]
        );
        
        return {
          ...profile.toObject(),
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal
        };
      });

      // Sort by filter criteria
      if (filters.sortBy === 'distance') {
        profiles.sort((a, b) => a.distance - b.distance);
      } else if (filters.sortBy === 'rating') {
        profiles.sort((a, b) => b.ratings.average - a.ratings.average);
      } else if (filters.sortBy === 'price') {
        profiles.sort((a, b) => a.rates.minRate - b.rates.minRate);
      }

      return profiles;
    } catch (error) {
      throw new Error(`Failed to find nearby freelancers: ${error.message}`);
    }
  }

  /**
   * Find jobs near a location
   */
  static async findJobsNearby(latitude, longitude, radiusKm = 50, filters = {}) {
    try {
      const radiusMeters = radiusKm * 1000;
      
      const query = {
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusMeters
          }
        },
        status: 'open'
      };

      // Add category filter
      if (filters.category) {
        query.category = filters.category;
      }

      // Add skill filter
      if (filters.skills && filters.skills.length > 0) {
        query.skills = { $in: filters.skills };
      }

      // Add remote option filter
      if (filters.remoteOnly) {
        query.remoteAllowed = true;
      }

      // Add budget filter
      if (filters.minBudget || filters.maxBudget) {
        query['budget.amount'] = {};
        if (filters.minBudget) query['budget.amount'].$gte = filters.minBudget;
        if (filters.maxBudget) query['budget.amount'].$lte = filters.maxBudget;
      }

      let jobs = await Job.find(query)
        .populate('clientId', 'name avatar location')
        .limit(filters.limit || 50)
        .sort({ createdAt: -1 });

      // Add distance calculation
      jobs = jobs.map(job => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          job.location.coordinates.coordinates[1],
          job.location.coordinates.coordinates[0]
        );
        
        return {
          ...job.toObject(),
          distance: Math.round(distance * 10) / 10
        };
      });

      // Sort if needed
      if (filters.sortBy === 'distance') {
        jobs.sort((a, b) => a.distance - b.distance);
      } else if (filters.sortBy === 'budget') {
        jobs.sort((a, b) => b.budget.amount - a.budget.amount);
      }

      return jobs;
    } catch (error) {
      throw new Error(`Failed to find nearby jobs: ${error.message}`);
    }
  }

  /**
   * Get freelancers by city
   */
  static async getFreelancersByCity(city, state = null, filters = {}) {
    try {
      const userQuery = {
        'location.city': new RegExp(city, 'i'),
        isActive: true
      };

      if (state) {
        userQuery['location.state'] = new RegExp(state, 'i');
      }

      const users = await User.find(userQuery);
      const userIds = users.map(u => u._id);

      let profileQuery = { userId: { $in: userIds } };

      if (filters.skills) {
        profileQuery['skills.name'] = { $in: filters.skills };
      }

      if (filters.minRating) {
        profileQuery['ratings.average'] = { $gte: filters.minRating };
      }

      const profiles = await FreelancerProfile.find(profileQuery)
        .populate('userId', 'name avatar location verifiedBadges')
        .limit(filters.limit || 50)
        .sort({ 'ratings.average': -1 });

      return profiles;
    } catch (error) {
      throw new Error(`Failed to get freelancers by city: ${error.message}`);
    }
  }

  /**
   * Get jobs by city
   */
  static async getJobsByCity(city, state = null, filters = {}) {
    try {
      const query = {
        'location.city': new RegExp(city, 'i'),
        status: 'open'
      };

      if (state) {
        query['location.state'] = new RegExp(state, 'i');
      }

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.remoteAllowed !== undefined) {
        query.remoteAllowed = filters.remoteAllowed;
      }

      const jobs = await Job.find(query)
        .populate('clientId', 'name avatar location')
        .limit(filters.limit || 50)
        .sort({ createdAt: -1 });

      return jobs;
    } catch (error) {
      throw new Error(`Failed to get jobs by city: ${error.message}`);
    }
  }

  /**
   * Get map clusters for visualization
   */
  static async getMapClusters(bounds, type = 'freelancers') {
    try {
      const { neLat, neLng, swLat, swLng } = bounds;
      
      const query = {
        'location.coordinates': {
          $geoWithin: {
            $box: [
              [swLng, swLat],
              [neLng, neLat]
            ]
          }
        }
      };

      if (type === 'freelancers') {
        const users = await User.find({ ...query, isActive: true })
          .select('location name avatar')
          .limit(500);
        
        const userIds = users.map(u => u._id);
        const profiles = await FreelancerProfile.find({ userId: { $in: userIds } })
          .select('userId ratings availability')
          .populate('userId', 'name avatar location');

        return profiles.map(p => ({
          id: p._id,
          name: p.userId.name,
          avatar: p.userId.avatar,
          rating: p.ratings.average,
          location: {
            lat: p.userId.location.coordinates.coordinates[1],
            lng: p.userId.location.coordinates.coordinates[0],
            city: p.userId.location.city
          },
          type: 'freelancer'
        }));
      } else if (type === 'jobs') {
        const jobs = await Job.find({ ...query, status: 'open' })
          .select('title location budget clientId')
          .populate('clientId', 'name')
          .limit(500);

        return jobs.map(j => ({
          id: j._id,
          title: j.title,
          budget: j.budget.amount,
          location: {
            lat: j.location.coordinates.coordinates[1],
            lng: j.location.coordinates.coordinates[0],
            city: j.location.city
          },
          type: 'job'
        }));
      }

      return [];
    } catch (error) {
      throw new Error(`Failed to get map clusters: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  static toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get popular cities with freelancer counts
   */
  static async getPopularCities() {
    try {
      const cities = await User.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: {
              city: '$location.city',
              state: '$location.state'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 20
        }
      ]);

      return cities.map(c => ({
        city: c._id.city,
        state: c._id.state,
        freelancerCount: c.count
      }));
    } catch (error) {
      throw new Error(`Failed to get popular cities: ${error.message}`);
    }
  }

  /**
   * Geocode address to coordinates (using geocoding API)
   */
  static async geocodeAddress(address) {
    // TODO: Integrate with geocoding service (Google Maps, Mapbox, OpenStreetMap)
    // For now, return mock data
    return {
      latitude: 19.0760,
      longitude: 72.8777,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    };
  }
}

export default GeoLocationService;
