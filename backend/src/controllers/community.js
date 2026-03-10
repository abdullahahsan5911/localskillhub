import FreelancerProfile from '../models/FreelancerProfile.js';
import User from '../models/User.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const { city, category, limit = 10 } = req.query;

    const query = {};
    
    const freelancers = await FreelancerProfile.find(query)
      .populate({
        path: 'userId',
        select: 'name avatar location',
        match: city ? { 'location.city': city } : {}
      })
      .sort({ localScore: -1 })
      .limit(parseInt(limit));

    const filteredFreelancers = freelancers.filter(f => f.userId);

    res.json({
      status: 'success',
      data: { leaderboard: filteredFreelancers }
    });
  } catch (error) {
    next(error);
  }
};

export const getBadges = async (req, res, next) => {
  try {
    const badges = [
      { id: 'email', name: 'Email Verified', description: 'Verified email address' },
      { id: 'phone', name: 'Phone Verified', description: 'Verified phone number' },
      { id: 'id', name: 'ID Verified', description: 'Government ID verified' },
      { id: 'college', name: 'College Verified', description: 'Educational institution verified' },
      { id: 'workshop', name: 'Workshop Attendee', description: 'Attended local workshops' },
      { id: 'employer', name: 'Employer Verified', description: 'Verified by previous employer' }
    ];

    res.json({
      status: 'success',
      data: { badges }
    });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    // TODO: Implement events from database
    const events = [
      {
        id: 1,
        title: 'Local Freelancer Meetup',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Mumbai',
        attendees: 45
      }
    ];

    res.json({
      status: 'success',
      data: { events }
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    // TODO: Implement event creation
    res.json({
      status: 'success',
      message: 'Event created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const joinEvent = async (req, res, next) => {
  try {
    // TODO: Implement event join logic
    res.json({
      status: 'success',
      message: 'Joined event successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRank = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.json({
        status: 'success',
        data: { rank: null }
      });
    }

    const rank = await FreelancerProfile.countDocuments({
      localScore: { $gt: profile.localScore }
    }) + 1;

    res.json({
      status: 'success',
      data: {
        rank,
        localScore: profile.localScore,
        globalScore: profile.globalScore
      }
    });
  } catch (error) {
    next(error);
  }
};
