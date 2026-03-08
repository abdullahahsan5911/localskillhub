import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, TrendingUp, DollarSign, Target, Star, MapPin, CheckCircle,
  ArrowUpRight, ArrowDownRight, BarChart3, Calendar, Clock, Briefcase,
  MessageSquare, Bell, FileText, Award, Users, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const statsCards = [
  { label: "Profile Views", value: "1,284", change: "+12%", up: true, icon: Eye, color: "text-primary" },
  { label: "Proposal Success", value: "68%", change: "+5%", up: true, icon: Target, color: "text-trust-green" },
  { label: "Earnings (Month)", value: "₹1,24,500", change: "+18%", up: true, icon: DollarSign, color: "text-trust-gold" },
  { label: "Local Ranking", value: "#3", change: "Mumbai", up: true, icon: TrendingUp, color: "text-brand-glow" },
];

const recentProposals = [
  { title: "E-commerce Website Redesign", client: "TechStart Solutions", budget: "₹45,000", status: "accepted", date: "2 days ago" },
  { title: "Mobile App UI Design", client: "HealthFirst App", budget: "₹60,000", status: "pending", date: "3 days ago" },
  { title: "Brand Identity Package", client: "GreenLeaf Co.", budget: "₹25,000", status: "rejected", date: "5 days ago" },
  { title: "SaaS Dashboard Design", client: "CloudSync Tech", budget: "₹80,000", status: "pending", date: "1 week ago" },
];

const activeProjects = [
  { title: "Restaurant Website", client: "FoodieHub", progress: 75, deadline: "Mar 15", earned: "₹18,750", total: "₹25,000" },
  { title: "Portfolio Website", client: "Raj Photography", progress: 40, deadline: "Mar 22", earned: "₹8,000", total: "₹20,000" },
];

const earningsData = [
  { month: "Sep", amount: 65000 },
  { month: "Oct", amount: 82000 },
  { month: "Nov", amount: 71000 },
  { month: "Dec", amount: 95000 },
  { month: "Jan", amount: 110000 },
  { month: "Feb", amount: 124500 },
];

const notifications = [
  { text: "New proposal invitation from CloudSync Tech", time: "2 hours ago", type: "invite" },
  { text: "Payment of ₹12,500 received for FoodieHub project", time: "5 hours ago", type: "payment" },
  { text: "Client left a 5-star review", time: "1 day ago", type: "review" },
];

const maxEarning = Math.max(...earningsData.map(d => d.amount));

const statusColors: Record<string, string> = {
  accepted: "bg-trust-green/10 text-trust-green",
  pending: "bg-trust-gold/10 text-trust-gold",
  rejected: "bg-destructive/10 text-destructive",
};

const FreelancerDashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "proposals" | "earnings">("overview");

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
              Welcome back, Priya 👋
            </motion.h1>
            <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your freelance business</p>
          </div>
          <div className="flex gap-3">
            <Link to="/messages">
              <Button variant="outline" size="sm" className="border-border text-foreground gap-2 transition-colors duration-200">
                <MessageSquare className="h-4 w-4" /> Messages
                <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">3</span>
              </Button>
            </Link>
            <Link to="/profile/1">
              <Button size="sm" className="bg-primary text-primary-foreground font-semibold gap-2 hover:bg-primary/90 transition-all duration-200">
                <Eye className="h-4 w-4" /> View Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? "text-trust-green" : "text-destructive"}`}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 glass-card w-fit">
          {(["overview", "proposals", "earnings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Active Projects */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-display font-semibold text-foreground">Active Projects</h2>
                    <span className="text-xs text-muted-foreground">{activeProjects.length} ongoing</span>
                  </div>
                  <div className="space-y-4">
                    {activeProjects.map((project) => (
                      <div key={project.title} className="p-4 rounded-xl bg-secondary/40 border border-border/30 hover:border-primary/20 transition-colors duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
                            <p className="text-xs text-muted-foreground">{project.client}</p>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Due {project.deadline}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold text-foreground">{project.progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${project.progress}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                          <span>Earned: <span className="text-trust-green font-semibold">{project.earned}</span></span>
                          <span>Total: {project.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Earnings Chart */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-display font-semibold text-foreground">Earnings Overview</h2>
                    <span className="text-xs text-muted-foreground">Last 6 months</span>
                  </div>
                  <div className="flex items-end gap-3 h-40">
                    {earningsData.map((data, i) => (
                      <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground">₹{(data.amount / 1000).toFixed(0)}k</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.amount / maxEarning) * 100}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="w-full rounded-t-md bg-primary/70 hover:bg-primary transition-colors duration-200 min-h-[4px]"
                        />
                        <span className="text-[10px] text-muted-foreground">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "proposals" && (
              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold text-foreground mb-5">Recent Proposals</h2>
                <div className="space-y-3">
                  {recentProposals.map((p) => (
                    <div key={p.title} className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border/30 hover:border-primary/20 transition-colors duration-200 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{p.title}</h3>
                        <p className="text-xs text-muted-foreground">{p.client} • {p.date}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-semibold text-primary">{p.budget}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColors[p.status]}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold text-foreground mb-5">Earnings Breakdown</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "This Month", value: "₹1,24,500", icon: DollarSign },
                    { label: "Pending", value: "₹45,000", icon: Clock },
                    { label: "Total Earned", value: "₹5,47,500", icon: TrendingUp },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-secondary/40 border border-border/30 text-center">
                      <item.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                      <div className="text-lg font-display font-bold text-foreground">{item.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-3 h-40">
                  {earningsData.map((data, i) => (
                    <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground">₹{(data.amount / 1000).toFixed(0)}k</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(data.amount / maxEarning) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="w-full rounded-t-md bg-accent/70 hover:bg-accent transition-colors duration-200 min-h-[4px]"
                      />
                      <span className="text-[10px] text-muted-foreground">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" /> Notifications
                </h3>
                <span className="text-[10px] text-primary cursor-pointer hover:text-brand-glow transition-colors duration-200">View All</span>
              </div>
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20 hover:border-primary/20 transition-colors duration-200">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.type === "payment" ? "bg-trust-green" : n.type === "review" ? "bg-trust-gold" : "bg-primary"
                    }`} />
                    <div>
                      <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                      <span className="text-[10px] text-muted-foreground">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Edit Profile", icon: FileText, href: "/profile/1" },
                  { label: "Browse Jobs", icon: Briefcase, href: "/jobs" },
                  { label: "View Messages", icon: MessageSquare, href: "/messages" },
                  { label: "Community", icon: Users, href: "/community" },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20 hover:border-primary/20 transition-all duration-200 group"
                  >
                    <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                      <action.icon className="h-4 w-4" /> {action.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Local Ranking */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-trust-gold" /> Local Leaderboard
              </h3>
              <div className="space-y-3">
                {[
                  { rank: 1, name: "Sneha Gupta", score: 98, city: "Mumbai" },
                  { rank: 2, name: "Arjun Patel", score: 97, city: "Mumbai" },
                  { rank: 3, name: "Priya Sharma", score: 96, city: "Mumbai", isYou: true },
                ].map((user) => (
                  <div key={user.rank} className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${user.isYou ? "bg-primary/10 border border-primary/20" : "bg-secondary/30 border border-border/20 hover:border-primary/20"}`}>
                    <span className={`text-sm font-bold ${user.rank === 1 ? "text-trust-gold" : user.rank === 2 ? "text-muted-foreground" : "text-primary"}`}>
                      #{user.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">
                        {user.name} {user.isYou && <span className="text-xs text-primary">(You)</span>}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{user.city}</span>
                    </div>
                    <span className="text-xs font-bold text-trust-green">{user.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FreelancerDashboard;
