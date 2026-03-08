import { motion } from "framer-motion";
import {
  Briefcase, Clock, DollarSign, Users, TrendingUp, ArrowUpRight,
  ChevronRight, Plus, Star, MapPin, Eye, MessageSquare, FileText, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const statsCards = [
  { label: "Active Jobs", value: "4", change: "+2 this week", icon: Briefcase, color: "text-primary" },
  { label: "Time to Hire", value: "2.3 days", change: "-0.5 days", icon: Clock, color: "text-trust-green" },
  { label: "Total Spent", value: "₹3,45,000", change: "This quarter", icon: DollarSign, color: "text-trust-gold" },
  { label: "Response Rate", value: "92%", change: "+8%", icon: TrendingUp, color: "text-brand-glow" },
];

const activeJobs = [
  { title: "E-commerce Website Redesign", freelancer: "Priya Sharma", budget: "₹45,000", progress: 65, proposals: 12, deadline: "Mar 20" },
  { title: "Social Media Campaign Q1", freelancer: "Vikram Rao", budget: "₹30,000", progress: 40, proposals: 8, deadline: "Mar 28" },
  { title: "Mobile App UI Design", freelancer: null, budget: "₹60,000", progress: 0, proposals: 15, deadline: "Apr 5" },
];

const recentHires = [
  { name: "Priya Sharma", skill: "UI/UX Designer", rating: 4.9, city: "Mumbai", spent: "₹1,20,000" },
  { name: "Arjun Patel", skill: "Full Stack Dev", rating: 4.8, city: "Bangalore", spent: "₹85,000" },
  { name: "Sneha Gupta", skill: "Content Writer", rating: 4.9, city: "Delhi", spent: "₹45,000" },
];

const budgetComparison = [
  { category: "Web Design", yourBudget: 25000, marketAvg: 30000 },
  { category: "Mobile Dev", yourBudget: 60000, marketAvg: 55000 },
  { category: "Content", yourBudget: 12000, marketAvg: 15000 },
  { category: "Marketing", yourBudget: 30000, marketAvg: 28000 },
];
const maxBudget = Math.max(...budgetComparison.flatMap(b => [b.yourBudget, b.marketAvg]));

const ClientDashboard = () => {
  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-display font-bold text-foreground"
            >
              Client Dashboard
            </motion.h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your projects and find talent</p>
          </div>
          <Link to="/post-job">
            <Button className="gradient-brand text-primary-foreground font-semibold gap-2">
              <Plus className="h-4 w-4" /> Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-xs text-trust-green font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />{stat.change}
                </span>
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Jobs */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-display font-semibold text-foreground">Active Jobs</h2>
                <Link to="/jobs" className="text-xs text-primary hover:text-brand-glow">View All</Link>
              </div>
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div key={job.title} className="p-4 rounded-xl bg-secondary/40 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.freelancer ? `Assigned to ${job.freelancer}` : `${job.proposals} proposals received`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{job.budget}</span>
                    </div>
                    {job.freelancer && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{job.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-brand-glow" style={{ width: `${job.progress}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {job.deadline}</span>
                      {!job.freelancer && (
                        <Button size="sm" className="h-7 text-[10px] gradient-brand text-primary-foreground">Review Proposals</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget vs Market */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold text-foreground mb-5">Budget vs Market Average</h2>
              <div className="space-y-4">
                {budgetComparison.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-foreground font-medium">{item.category}</span>
                      <span className="text-muted-foreground">
                        ₹{(item.yourBudget / 1000).toFixed(0)}k vs ₹{(item.marketAvg / 1000).toFixed(0)}k avg
                      </span>
                    </div>
                    <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-primary/60" style={{ width: `${(item.marketAvg / maxBudget) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-trust-green to-accent" style={{ width: `${(item.yourBudget / maxBudget) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 text-[10px] text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-trust-green" /> Your Budget</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60" /> Market Average</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Hires */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Hires</h3>
              <div className="space-y-3">
                {recentHires.map((hire) => (
                  <div key={hire.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20 hover:border-primary/20 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {hire.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">{hire.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 text-trust-gold fill-trust-gold" /> {hire.rating} • {hire.city}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-primary">{hire.spent}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Post a Job", icon: Plus, href: "/post-job" },
                  { label: "Browse Talent", icon: Users, href: "/browse" },
                  { label: "Messages", icon: MessageSquare, href: "/messages" },
                  { label: "Contracts", icon: FileText, href: "/contracts" },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20 hover:border-primary/20 transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <action.icon className="h-4 w-4" /> {action.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientDashboard;
