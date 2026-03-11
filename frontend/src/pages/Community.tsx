import { FiAward, FiMapPin, FiUsers, FiCalendar, FiTrendingUp, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardUser {
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    location: {
      city: string;
    };
  };
  localScore: number;
  completedJobs: number;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  attendees: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
}

const Community = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        
        const [leaderboardRes, eventsRes, badgesRes] = await Promise.all([
          api.getLeaderboard({ limit: 10 }),
          api.getEvents(),
          api.getBadges()
        ]);

        if (leaderboardRes.data) {
          setLeaderboard((leaderboardRes.data as any).leaderboard || []);
        }

        if (eventsRes.data) {
          setEvents((eventsRes.data as any).events || []);
        }

        if (badgesRes.data) {
          setBadges((badgesRes.data as any).badges || []);
          
          // Set user's earned badges from verification status
          if ((user as any)?.verification) {
            const earned: string[] = [];
            if ((user as any).verification.email) earned.push('email');
            if ((user as any).verification.phone) earned.push('phone');
            if ((user as any).verification.identity) earned.push('id');
            if ((user as any).verification.education) earned.push('college');
            setUserBadges(earned);
          }
        }
      } catch (error) {
        console.error('Failed to fetch community data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [user]);

  return (
    <Layout>
      <section className="bg-white">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-50 to-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Community Hub</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with local freelancers, earn badges, and grow together
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Leaderboard & Events */}
            <div className="lg:col-span-2 space-y-8">
              {/* Local Leaderboard */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FiTrendingUp className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Local Leaderboard</h2>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <FiLoader className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No leaderboard data available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((item, index) => {
                      const freelancer = item.userId;
                      return (
                        <div key={freelancer._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {freelancer.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{freelancer.name || 'Anonymous'}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FiMapPin className="h-3.5 w-3.5" /> {freelancer.location?.city || 'Unknown'}
                              </span>
                              <span>•</span>
                              <span>{item.completedJobs || 0} jobs</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{item.localScore || 0}</p>
                            <p className="text-xs text-gray-600">Trust Score</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FiCalendar className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <FiLoader className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => {
                      const eventDate = new Date(event.date);
                      const formattedDate = eventDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      
                      return (
                        <div key={event.id} className="p-4 bg-gray-50 rounded-xl">
                          <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="h-4 w-4" /> {formattedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiMapPin className="h-4 w-4" /> {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiUsers className="h-4 w-4" /> {event.attendees} attending
                            </span>
                          </div>
                          <Button variant="outline" size="sm" className="border-gray-300 rounded-full">
                            Join Event
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Badges */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-20">
                <div className="flex items-center gap-2 mb-6">
                  <FiAward className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Your Badges</h2>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <FiLoader className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : badges.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No badges available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {badges.map((badge) => {
                      const earned = userBadges.includes(badge.id);
                      return (
                        <div key={badge.id} className={`p-4 rounded-xl border-2 ${
                          earned ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${earned ? "bg-blue-600" : "bg-gray-300"}`}>
                              <FiAward className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-semibold mb-1 ${earned ? "text-gray-900" : "text-gray-500"}`}>
                                {badge.name}
                              </h3>
                              <p className="text-xs text-gray-600">{badge.description}</p>
                              {earned && (
                                <span className="inline-block mt-2 text-xs font-medium text-blue-700">✓ Earned</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Community;
