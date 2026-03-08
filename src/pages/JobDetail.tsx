import { motion } from "framer-motion";
import {
  MapPin, Clock, Briefcase, DollarSign, Star, CheckCircle, Shield,
  Calendar, Users, FileText, Send, ArrowLeft, Share2, Heart, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const job = {
  title: "E-commerce Website Redesign",
  client: "TechStart Solutions",
  clientVerified: true,
  clientRating: 4.8,
  clientJobs: 23,
  city: "Mumbai, Maharashtra",
  posted: "2 hours ago",
  deadline: "March 30, 2026",
  budget: "₹40,000 - ₹60,000",
  type: "Fixed Price",
  remote: true,
  description: `We're looking for an experienced UI/UX designer to completely redesign our e-commerce platform. The project involves:

• Redesigning the homepage, product pages, cart, and checkout flow
• Creating a responsive design that works seamlessly on mobile and desktop
• Improving the overall user experience and conversion rate
• Designing a clean, modern interface aligned with our brand identity
• Creating a design system for future scalability

The ideal candidate has experience with e-commerce platforms and understands conversion optimization.`,
  skills: ["React", "Figma", "UI/UX", "E-commerce", "Responsive Design", "CSS"],
  milestones: [
    { name: "Wireframes & Research", amount: "₹10,000", deadline: "Week 1" },
    { name: "Homepage + Product Page Design", amount: "₹20,000", deadline: "Week 2-3" },
    { name: "Remaining Pages + Design System", amount: "₹15,000", deadline: "Week 4" },
    { name: "Final Revisions & Handoff", amount: "₹15,000", deadline: "Week 5" },
  ],
  proposals: 12,
  hires: 3,
};

const similarJobs = [
  { title: "Landing Page Design", budget: "₹15,000", city: "Pune" },
  { title: "Mobile App UI Redesign", budget: "₹50,000", city: "Bangalore" },
  { title: "SaaS Dashboard Design", budget: "₹35,000", city: "Delhi" },
];

const JobDetail = () => {
  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="border-b border-border/30">
        <div className="container py-3 flex items-center gap-2 text-sm">
          <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground mb-2">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.city}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{job.posted}</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{job.proposals} proposals</span>
                    {job.remote && (
                      <span className="px-2 py-0.5 rounded text-xs bg-trust-green/10 text-trust-green font-medium">Remote OK</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Budget & Type */}
              <div className="flex gap-4 mb-6">
                <div className="glass-card px-5 py-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-lg font-display font-bold text-primary">{job.budget}</div>
                    <div className="text-[10px] text-muted-foreground">{job.type}</div>
                  </div>
                </div>
                <div className="glass-card px-5 py-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-trust-gold" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{job.deadline}</div>
                    <div className="text-[10px] text-muted-foreground">Deadline</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-display font-semibold text-foreground mb-3">Job Description</h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h2 className="text-lg font-display font-semibold text-foreground mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-lg text-sm bg-secondary text-secondary-foreground border border-border/30">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground mb-3">Project Milestones</h2>
                <div className="space-y-3">
                  {job.milestones.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border/30">
                      <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground block">{m.deadline}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{m.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply */}
            <div className="glass-card p-6">
              <Button className="w-full gradient-brand text-primary-foreground font-semibold h-12 glow-sm gap-2 mb-4">
                <Send className="h-4 w-4" /> Submit Proposal
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {job.proposals} freelancers have already applied
              </p>
            </div>

            {/* Client Info */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">About the Client</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-lg gradient-brand flex items-center justify-center text-primary-foreground font-bold">T</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{job.client}</span>
                    {job.clientVerified && <CheckCircle className="h-4 w-4 text-trust-green" />}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 text-trust-gold fill-trust-gold" /> {job.clientRating} • {job.clientJobs} jobs posted
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Location", value: job.city },
                  { label: "Jobs Posted", value: `${job.clientJobs} jobs` },
                  { label: "Hire Rate", value: "87%" },
                  { label: "Avg Budget", value: "₹35,000" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-xs py-2 border-b border-border/20 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Jobs */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                {similarJobs.map((j) => (
                  <div key={j.title} className="p-3 rounded-lg bg-secondary/30 border border-border/20 hover:border-primary/20 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-foreground block">{j.title}</span>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.city}</span>
                      <span className="text-primary font-semibold">{j.budget}</span>
                    </div>
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

export default JobDetail;
