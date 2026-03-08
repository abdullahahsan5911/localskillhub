import { useState } from "react";
import { MapPin, Search, Star, CheckCircle, Briefcase, Clock, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const mockJobs = [
  { id: 1, title: "Website Redesign for Restaurant", client: "FoodieHub", city: "Mumbai", budget: "₹15,000 - ₹25,000", type: "Fixed", skills: ["React", "Figma", "CSS"], posted: "2 hours ago", proposals: 5, remote: false },
  { id: 2, title: "Social Media Marketing Campaign", client: "GreenLeaf Co.", city: "Bangalore", budget: "₹8,000 - ₹12,000", type: "Fixed", skills: ["Instagram", "Facebook Ads", "Content"], posted: "5 hours ago", proposals: 12, remote: true },
  { id: 3, title: "Mobile App UI/UX Design", client: "TechStart", city: "Delhi", budget: "₹2,000 - ₹3,000/hr", type: "Hourly", skills: ["Figma", "Mobile Design", "Prototyping"], posted: "1 day ago", proposals: 8, remote: true },
  { id: 4, title: "Product Photography for E-commerce", client: "StyleBazaar", city: "Pune", budget: "₹5,000 - ₹10,000", type: "Fixed", skills: ["Product Photography", "Photo Editing", "Lightroom"], posted: "3 hours ago", proposals: 3, remote: false },
  { id: 5, title: "WordPress Blog Development", client: "HealthFirst", city: "Hyderabad", budget: "₹10,000 - ₹18,000", type: "Fixed", skills: ["WordPress", "PHP", "SEO"], posted: "6 hours ago", proposals: 7, remote: true },
  { id: 6, title: "Video Editing for YouTube Channel", client: "TechReviewer", city: "Chennai", budget: "₹1,500 - ₹2,500/hr", type: "Hourly", skills: ["Premiere Pro", "After Effects", "Motion Graphics"], posted: "1 day ago", proposals: 15, remote: true },
];

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      <section className="border-b border-border/40 bg-card/30">
        <div className="container py-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Find Local Jobs</h1>
          <p className="text-muted-foreground">Browse opportunities in your region</p>

          <div className="glass-card p-2 mt-6 max-w-2xl">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 transition-colors focus-within:bg-secondary">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search jobs by title, skill, or keyword..."
                  className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="bg-primary text-primary-foreground font-semibold px-6 hover:bg-primary/90 transition-all duration-200">Search</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground">{mockJobs.length} jobs available</span>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="border-border text-foreground gap-2 transition-colors duration-200">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="border-border text-foreground gap-2 transition-colors duration-200">
              Sort: Latest <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {mockJobs.map((job, i) => (
            <div key={job.id} className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-1">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span>{job.client}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.city}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.posted}</span>
                    {job.remote && (
                      <span className="px-2 py-0.5 rounded text-xs bg-trust-green/10 text-trust-green font-medium">Remote OK</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-display font-bold text-primary">{job.budget}</div>
                  <div className="text-xs text-muted-foreground">{job.type} Price</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <Briefcase className="h-3 w-3 inline mr-1" />{job.proposals} proposals
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Jobs;
