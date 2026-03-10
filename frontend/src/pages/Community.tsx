import { FiAward, FiMapPin, FiUsers, FiCalendar, FiTrendingUp } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";

const Community = () => {
  const leaderboard = [
    { rank: 1, name: "Priya Sharma", city: "Mumbai", score: 98, jobs: 132, avatar: avatar1 },
    { rank: 2, name: "Arjun Patel", city: "Bangalore", score: 96, jobs: 156, avatar: avatar2 },
    { rank: 3, name: "Sneha Gupta", city: "Delhi", score: 95, jobs: 124, avatar: avatar3 },
  ];

  const events = [
    { title: "Mumbai Design Meetup", date: "Mar 15, 2026", attendees: 45, location: "Mumbai" },
    { title: "Freelancer Workshop", date: "Mar 18, 2026", attendees: 32, location: "Bangalore" },
    { title: "Tech Community Lunch", date: "Mar 22, 2026", attendees: 28, location: "Delhi" },
  ];

  const badges = [
    { name: "Top Rated", desc: "Maintain 4.8+ rating for 3 months", earned: true },
    { name: "Fast Responder", desc: "Respond within 1 hour", earned: true },
    { name: "College Verified", desc: "Verified university credentials", earned: false },
    { name: "Workshop Attendee", desc: "Attend local community events", earned: true },
  ];

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
                <div className="space-y-4">
                  {leaderboard.map((user) => (
                    <div key={user.rank} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                        {user.rank}
                      </div>
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FiMapPin className="h-3.5 w-3.5" /> {user.city}
                          </span>
                          <span>•</span>
                          <span>{user.jobs} jobs</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{user.score}</p>
                        <p className="text-xs text-gray-600">Trust Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FiCalendar className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                </div>
                <div className="space-y-4">
                  {events.map((event, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="h-4 w-4" /> {event.date}
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
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Badges */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-20">
                <div className="flex items-center gap-2 mb-6">
                  <FiAward className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Your Badges</h2>
                </div>
                <div className="space-y-3">
                  {badges.map((badge, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border-2 ${
                      badge.earned ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${badge.earned ? "bg-blue-600" : "bg-gray-300"}`}>
                          <FiAward className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${badge.earned ? "text-gray-900" : "text-gray-500"}`}>
                            {badge.name}
                          </h3>
                          <p className="text-xs text-gray-600">{badge.desc}</p>
                          {badge.earned && (
                            <span className="inline-block mt-2 text-xs font-medium text-blue-700">✓ Earned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Community;
