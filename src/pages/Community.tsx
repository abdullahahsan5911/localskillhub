import { motion } from "framer-motion";
import {
  Award, Star, MapPin, Users, Trophy, GraduationCap, Building2,
  Calendar, CheckCircle, TrendingUp, Medal, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const leaderboard = [
  { rank: 1, name: "Sneha Gupta", skill: "Content Writer", city: "Delhi", score: 98, jobs: 124, badge: "🥇" },
  { rank: 2, name: "Arjun Patel", skill: "Full Stack Dev", city: "Bangalore", score: 97, jobs: 92, badge: "🥈" },
  { rank: 3, name: "Priya Sharma", skill: "UI/UX Designer", city: "Mumbai", score: 96, jobs: 47, badge: "🥉" },
  { rank: 4, name: "Meera Joshi", skill: "Photographer", city: "Jaipur", score: 95, jobs: 89, badge: "" },
  { rank: 5, name: "Vikram Rao", skill: "Digital Marketer", city: "Chennai", score: 94, jobs: 53, badge: "" },
  { rank: 6, name: "Ananya Singh", skill: "Graphic Designer", city: "Hyderabad", score: 93, jobs: 67, badge: "" },
  { rank: 7, name: "Karan Mehta", skill: "Mobile Dev", city: "Ahmedabad", score: 91, jobs: 41, badge: "" },
  { rank: 8, name: "Rohan Das", skill: "SEO Specialist", city: "Kolkata", score: 90, jobs: 55, badge: "" },
  { rank: 9, name: "Neha Verma", skill: "Video Editor", city: "Pune", score: 89, jobs: 36, badge: "" },
  { rank: 10, name: "Aditya Nair", skill: "Data Analyst", city: "Mumbai", score: 88, jobs: 44, badge: "" },
];

const badges = [
  { icon: GraduationCap, label: "College Verified", desc: "Verified educational credentials", color: "text-primary bg-primary/10", count: "2,340" },
  { icon: Calendar, label: "Workshop Attendee", desc: "Attended local skill workshops", color: "text-trust-gold bg-trust-gold/10", count: "1,890" },
  { icon: Users, label: "Community Member", desc: "Active in local freelancer groups", color: "text-trust-green bg-trust-green/10", count: "5,670" },
  { icon: Building2, label: "Employer Verified", desc: "Verified by local employers", color: "text-brand-glow bg-brand-glow/10", count: "980" },
  { icon: Trophy, label: "Top Rated", desc: "Consistently high ratings", color: "text-trust-gold bg-trust-gold/10", count: "1,200" },
  { icon: Zap, label: "Fast Responder", desc: "Responds within 1 hour", color: "text-primary bg-primary/10", count: "3,450" },
];

const upcomingEvents = [
  { title: "Mumbai Web Dev Meetup", date: "Mar 15, 2026", location: "WeWork BKC, Mumbai", attendees: 45, type: "Workshop" },
  { title: "Freelancer Networking Night", date: "Mar 20, 2026", location: "91Springboard, Bangalore", attendees: 80, type: "Networking" },
  { title: "Design Sprint Workshop", date: "Mar 25, 2026", location: "Google Office, Hyderabad", attendees: 30, type: "Workshop" },
  { title: "AI for Freelancers Seminar", date: "Apr 2, 2026", location: "NASSCOM, Delhi", attendees: 120, type: "Seminar" },
];

const Community = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="border-b border-border/30">
        <div className="container py-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-trust-gold/10 border border-trust-gold/20 text-trust-gold text-xs font-medium mb-5">
              <Trophy className="h-3.5 w-3.5" /> Community & Local Trust
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Community Hub</h1>
            <p className="text-muted-foreground max-w-xl">Local leaderboards, badges, workshops, and community-driven trust signals.</p>
          </motion.div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-trust-gold" /> Local Leaderboard — Top 10
                </h2>
                <span className="text-xs text-muted-foreground">Mumbai Region</span>
              </div>
              <div className="space-y-2">
                {leaderboard.map((user, i) => (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer hover:bg-secondary/30 ${
                      user.rank <= 3 ? "bg-secondary/20 border border-border/20" : ""
                    }`}
                  >
                    <span className={`text-lg font-display font-bold w-8 text-center ${
                      user.rank === 1 ? "text-trust-gold" : user.rank === 2 ? "text-muted-foreground" : user.rank === 3 ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {user.badge || `#${user.rank}`}
                    </span>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-brand-glow flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{user.name}</span>
                        <CheckCircle className="h-3.5 w-3.5 text-trust-green" />
                      </div>
                      <span className="text-xs text-muted-foreground">{user.skill} • {user.city}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-trust-green">{user.score}%</div>
                      <div className="text-[10px] text-muted-foreground">{user.jobs} jobs</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold text-foreground mb-5 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Upcoming Events
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <div key={event.title} className="p-4 rounded-xl bg-secondary/30 border border-border/20 hover:border-primary/20 transition-colors cursor-pointer group">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{event.type}</span>
                    <h3 className="text-sm font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" /> {event.date}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" /> {event.location}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {event.attendees} attending
                      </span>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-border/50 text-foreground">
                        RSVP
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-trust-gold" /> Community Badges
              </h3>
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${badge.color}`}>
                      <badge.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block">{badge.label}</span>
                      <span className="text-[10px] text-muted-foreground">{badge.desc}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{badge.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Badges */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Your Badges</h3>
              <div className="flex flex-wrap gap-2">
                {["College Verified", "Community Member", "Top Rated", "Fast Responder"].map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle className="h-3 w-3" /> {badge}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">Earn more badges by participating in local events and community activities.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Community;
