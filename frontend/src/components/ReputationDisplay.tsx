import { useEffect, useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiAward, FiShield } from 'react-icons/fi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface ReputationData {
  overallScore: number;
  localTrustScore: number;
  skillTrustScore: number;
  level: string;
  trending: 'rising' | 'falling' | 'stable';
  achievements: Array<{
    type: string;
    earnedAt: string;
  }>;
  scoreBreakdown: {
    verification: number;
    reviews: number;
    endorsements: number;
    events: number;
    employerTrust: number;
    performance: number;
  };
  trustIndicators: {
    verifiedIdentity: boolean;
    phoneVerified: boolean;
    emailVerified: boolean;
    linkedinConnected: boolean;
  };
  stats: {
    totalJobsCompleted: number;
    totalEarnings: number;
    successRate: number;
  };
}

interface ReputationDisplayProps {
  userId?: string;
  compact?: boolean;
}

const ReputationDisplay = ({ userId, compact = false }: ReputationDisplayProps) => {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReputation();
  }, [userId]);

  const fetchReputation = async () => {
    try {
      setLoading(true);
      const response = await api.getReputation(userId);
      if (response.data) {
        setReputation(response.data as any);
      }
    } catch (error) {
      console.error('Failed to fetch reputation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-cyan-600';
    if (score >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-700';
      case 'advanced': return 'bg-blue-100 text-blue-700';
      case 'intermediate': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrendingIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <FiTrendingUp className="text-green-600" />;
      case 'falling': return <FiTrendingDown className="text-red-600" />;
      default: return <FiMinus className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No reputation data available</p>
      </div>
    );
  }

  // Compact view for profile cards
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Reputation Score</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(reputation.overallScore)}`}>
              {reputation.overallScore}
            </span>
            {getTrendingIcon(reputation.trending)}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-gradient-to-r ${getScoreGradient(reputation.overallScore)} h-2 rounded-full`}
            style={{ width: `${reputation.overallScore}%` }}
          />
        </div>
        <div className="flex gap-2">
          <Badge className={getLevelBadgeColor(reputation.level)}>
            {reputation.level.toUpperCase()}
          </Badge>
          {reputation.trustIndicators.verifiedIdentity && (
            <Badge className="bg-blue-100 text-blue-700">
              <FiShield className="inline h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Full view for dedicated reputation page
  return (
    <div className="space-y-6">
      {/* Header Scores */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Reputation Scores</h2>
            <div className="flex items-center gap-2">
              <Badge className={getLevelBadgeColor(reputation.level)}>
                {reputation.level.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {getTrendingIcon(reputation.trending)}
                <span className="capitalize">{reputation.trending}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="mb-2">
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(reputation.overallScore)}`}>
                {reputation.overallScore}
              </div>
              <div className="text-sm font-medium text-gray-700">Overall Score</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-gradient-to-r ${getScoreGradient(reputation.overallScore)} h-3 rounded-full`}
                style={{ width: `${reputation.overallScore}%` }}
              />
            </div>
          </div>

          {/* Local Trust */}
          <div className="text-center">
            <div className="mb-2">
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(reputation.localTrustScore)}`}>
                {reputation.localTrustScore}
              </div>
              <div className="text-sm font-medium text-gray-700">Local Trust</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-gradient-to-r ${getScoreGradient(reputation.localTrustScore)} h-3 rounded-full`}
                style={{ width: `${reputation.localTrustScore}%` }}
              />
            </div>
          </div>

          {/* Skill Trust */}
          <div className="text-center">
            <div className="mb-2">
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(reputation.skillTrustScore)}`}>
                {reputation.skillTrustScore}
              </div>
              <div className="text-sm font-medium text-gray-700">Skill Trust</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-gradient-to-r ${getScoreGradient(reputation.skillTrustScore)} h-3 rounded-full`}
                style={{ width: `${reputation.skillTrustScore}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Score Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(reputation.scoreBreakdown).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12 text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      {reputation.achievements && reputation.achievements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiAward className="text-yellow-600" />
            Achievements
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            {reputation.achievements.map((achievement, index) => (
              <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <FiAward className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {achievement.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{reputation.stats.totalJobsCompleted}</div>
            <div className="text-sm text-gray-600 mt-1">Jobs Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ₹{(reputation.stats.totalEarnings || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{reputation.stats.successRate}%</div>
            <div className="text-sm text-gray-600 mt-1">Success Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReputationDisplay;
