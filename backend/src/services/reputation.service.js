import Reputation from '../models/Reputation.js';
import Verification from '../models/Verification.js';
import Review from '../models/Review.js';
import Contract from '../models/Contract.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import User from '../models/User.js';

/**
 * Reputation Service - Manages comprehensive reputation calculations
 * Handles: Overall Score | Local Trust | Skill Trust
 */
class ReputationService {
  /**
   * Initialize or get reputation for user
   */
  static async getOrCreateReputation(userId) {
    try {
      let reputation = await Reputation.findOne({ userId });
      
      if (!reputation) {
        reputation = new Reputation({ userId });
        await reputation.save();
      }
      
      return reputation;
    } catch (error) {
      throw new Error(`Failed to get reputation: ${error.message}`);
    }
  }

  /**
   * Recalculate all reputation scores for a user
   */
  static async recalculateReputation(userId) {
    try {
      const reputation = await this.getOrCreateReputation(userId);
      const verification = await Verification.findOne({ userId });
      const user = await User.findById(userId);
      const profile = await FreelancerProfile.findOne({ userId });

      // 1. Update Verification Score
      if (verification) {
        reputation.scores.verification.score = verification.verificationScore;
      }

      // 2. Update Review Score
      const reviews = await Review.find({ 
        freelancerId: userId,
        status: 'published'
      });
      
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        reputation.scores.reviews.averageRating = averageRating;
        reputation.scores.reviews.totalReviews = reviews.length;
        reputation.scores.reviews.score = (averageRating / 5) * 100;
        
        // Update breakdown
        reviews.forEach(review => {
          reputation.scores.reviews.breakdown[review.rating]++;
        });
      }

      // 3. Update Endorsement Score
      if (profile && profile.endorsements) {
        const uniqueEndorsers = new Set(
          profile.endorsements.map(e => e.endorsedBy.toString())
        ).size;
        
        reputation.scores.endorsements.totalEndorsements = profile.endorsements.length;
        reputation.scores.endorsements.uniqueEndorsers = uniqueEndorsers;
        reputation.scores.endorsements.score = Math.min(
          (profile.endorsements.length / 10) * 100,
          100
        );
        
        // Count skill-specific endorsements
        const skillCounts = {};
        profile.endorsements.forEach(e => {
          if (e.skill) {
            skillCounts[e.skill] = (skillCounts[e.skill] || 0) + 1;
          }
        });
        
        reputation.scores.endorsements.skillEndorsements = Object.entries(skillCounts)
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      // 4. Update Event Score (from verification)
      if (verification && verification.events) {
        reputation.scores.events.eventsAttended = verification.events.count;
        reputation.scores.events.score = Math.min(
          (verification.events.count / 5) * 100,
          100
        );
      }

      // 5. Update Employer Trust Score
      const contracts = await Contract.find({
        freelancerId: userId,
        status: 'completed'
      }).populate('clientId');
      
      if (contracts.length > 0) {
        // Count local jobs (same city as freelancer)
        const localJobs = contracts.filter(contract => 
          contract.clientId?.location?.city === user?.location?.city
        ).length;
        
        // Count unique clients
        const uniqueClients = new Set(contracts.map(c => c.clientId._id.toString())).size;
        
        // Calculate repeat client rate
        const repeatClientRate = uniqueClients > 0 
          ? ((contracts.length - uniqueClients) / contracts.length) * 100 
          : 0;
        
        reputation.scores.employerTrust.localJobsCompleted = localJobs;
        reputation.scores.employerTrust.localClientsServed = uniqueClients;
        reputation.scores.employerTrust.repeatClientRate = repeatClientRate;
        
        const employerScore = Math.min(
          ((localJobs / 20) * 60) + (repeatClientRate * 0.4),
          100
        );
        reputation.scores.employerTrust.score = employerScore;
      }

      // 6. Update Performance Metrics
      if (contracts.length > 0) {
        const onTimeDeliveries = contracts.filter(c => 
          c.completedAt && c.deadline && new Date(c.completedAt) <= new Date(c.deadline)
        ).length;
        
        const onTimeRate = (onTimeDeliveries / contracts.length) * 100;
        const completionRate = profile?.successRate || 0;
        
        reputation.scores.performance.onTimeDeliveryRate = onTimeRate;
        reputation.scores.performance.completionRate = completionRate;
        reputation.scores.performance.responseTime = profile?.responseTime || 24;
        reputation.scores.performance.score = (onTimeRate + completionRate) / 2;
      }

      // 7. Update Statistics
      reputation.stats.totalJobsCompleted = contracts.length;
      reputation.stats.totalEarnings = profile?.totalEarnings || 0;
      reputation.stats.successRate = profile?.successRate || 0;
      reputation.stats.profileViews = profile?.profileViews || 0;

      // 8. Update Regional Scores
      if (user?.location?.city && contracts.length > 0) {
        const cityContracts = contracts.filter(c => 
          c.clientId?.location?.city === user.location.city
        );
        
        const cityScore = cityContracts.length > 0 
          ? (cityContracts.length / contracts.length) * reputation.overallScore 
          : 0;
        
        const existingRegion = reputation.regionalScores.find(r => 
          r.region === `${user.location.city}, ${user.location.state}`
        );
        
        if (existingRegion) {
          existingRegion.score = cityScore;
          existingRegion.jobsCompleted = cityContracts.length;
          existingRegion.lastUpdated = new Date();
        } else {
          reputation.regionalScores.push({
            region: `${user.location.city}, ${user.location.state}`,
            score: cityScore,
            jobsCompleted: cityContracts.length,
            lastUpdated: new Date()
          });
        }
      }

      // 9. Auto-award achievements based on scores
      await this.awardAchievements(reputation);

      // 10. Calculate and save final scores
      await reputation.updateAllScores();

      return reputation;
    } catch (error) {
      throw new Error(`Failed to recalculate reputation: ${error.message}`);
    }
  }

  /**
   * Award achievements based on reputation metrics
   */
  static async awardAchievements(reputation) {
    const achievements = [];
    
    // Top Rated (Overall score >= 90)
    if (reputation.overallScore >= 90) {
      if (!reputation.achievements.find(a => a.type === 'top_rated')) {
        achievements.push({
          type: 'top_rated',
          earnedAt: new Date(),
          criteria: 'Overall score >= 90'
        });
      }
    }

    // Rising Talent (Score improved by 20+ in last 30 days)
    if (reputation.scoreHistory.length >= 2) {
      const recent = reputation.scoreHistory[reputation.scoreHistory.length - 1];
      const old = reputation.scoreHistory[0];
      if (recent.overallScore - old.overallScore >= 20) {
        if (!reputation.achievements.find(a => a.type === 'rising_talent')) {
          achievements.push({
            type: 'rising_talent',
            earnedAt: new Date(),
            criteria: 'Score increased by 20+ points'
          });
        }
      }
    }

    // Quick Responder (Response time < 2 hours)
    if (reputation.scores.performance.responseTime < 2) {
      if (!reputation.achievements.find(a => a.type === 'quick_responder')) {
        achievements.push({
          type: 'quick_responder',
          earnedAt: new Date(),
          criteria: 'Average response time under 2 hours'
        });
      }
    }

    // Five Star Freelancer (Average rating >= 4.8)
    if (reputation.scores.reviews.averageRating >= 4.8 && reputation.scores.reviews.totalReviews >= 10) {
      if (!reputation.achievements.find(a => a.type === 'five_star_freelancer')) {
        achievements.push({
          type: 'five_star_freelancer',
          earnedAt: new Date(),
          criteria: '4.8+ rating with 10+ reviews'
        });
      }
    }

    // Local Hero (10+ local jobs completed)
    if (reputation.scores.employerTrust.localJobsCompleted >= 10) {
      if (!reputation.achievements.find(a => a.type === 'local_hero')) {
        achievements.push({
          type: 'local_hero',
          earnedAt: new Date(),
          criteria: '10+ local jobs completed'
        });
      }
    }

    // Add new achievements
    if (achievements.length > 0) {
      reputation.achievements.push(...achievements);
    }
  }

  /**
   * Get reputation display data
   */
  static async getReputationDisplay(userId) {
    try {
      const reputation = await Reputation.findOne({ userId });
      
      if (!reputation) {
        return {
          overallScore: 0,
          localTrustScore: 0,
          skillTrustScore: 0,
          achievements: [],
          trustIndicators: {},
          level: 'beginner'
        };
      }

      // Determine level based on overall score
      let level = 'beginner';
      if (reputation.overallScore >= 90) level = 'expert';
      else if (reputation.overallScore >= 75) level = 'advanced';
      else if (reputation.overallScore >= 50) level = 'intermediate';

      return {
        overallScore: reputation.overallScore,
        localTrustScore: reputation.localTrustScore,
        skillTrustScore: reputation.skillTrustScore,
        achievements: reputation.achievements,
        trustIndicators: reputation.trustIndicators,
        stats: reputation.stats,
        level,
        scoreBreakdown: {
          verification: reputation.scores.verification.score,
          reviews: reputation.scores.reviews.score,
          endorsements: reputation.scores.endorsements.score,
          events: reputation.scores.events.score,
          employerTrust: reputation.scores.employerTrust.score,
          performance: reputation.scores.performance.score
        },
        trending: this.calculateTrend(reputation.scoreHistory)
      };
    } catch (error) {
      throw new Error(`Failed to get reputation display: ${error.message}`);
    }
  }

  /**
   * Calculate score trend
   */
  static calculateTrend(scoreHistory) {
    if (scoreHistory.length < 2) return 'stable';
    
    const recent = scoreHistory.slice(-5);
    const avgRecent = recent.reduce((sum, h) => sum + h.overallScore, 0) / recent.length;
    const older = scoreHistory.slice(0, Math.max(1, scoreHistory.length - 5));
    const avgOlder = older.reduce((sum, h) => sum + h.overallScore, 0) / older.length;
    
    const diff = avgRecent - avgOlder;
    
    if (diff > 5) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
  }

  /**
   * Update reputation after review
   */
  static async updateAfterReview(userId) {
    return await this.recalculateReputation(userId);
  }

  /**
   * Update reputation after endorsement
   */
  static async updateAfterEndorsement(userId) {
    return await this.recalculateReputation(userId);
  }

  /**
   * Update reputation after job completion
   */
  static async updateAfterJobCompletion(userId) {
    return await this.recalculateReputation(userId);
  }
}

export default ReputationService;
