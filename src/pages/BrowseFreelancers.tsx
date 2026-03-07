import { useState } from "react";
import { Search, MapPin, Star, CheckCircle, Filter, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const skills = ["All", "Web Development", "Graphic Design", "Video Production", "Digital Marketing", "Photography", "Content Writing", "Mobile Dev", "Data Science"];

const mockFreelancers = [
  { id: 1, name: "Priya Sharma", skill: "UI/UX Designer", city: "Mumbai", rating: 4.9, jobs: 47, verified: true, rate: "₹2,500/hr", localScore: 96, tags: ["Figma", "Adobe XD", "Prototyping"] },
  { id: 2, name: "Arjun Patel", skill: "Full Stack Developer", city: "Bangalore", rating: 4.8, jobs: 92, verified: true, rate: "₹3,000/hr", localScore: 94, tags: ["React", "Node.js", "MongoDB"] },
  { id: 3, name: "Sneha Gupta", skill: "Content Writer", city: "Delhi", rating: 4.9, jobs: 124, verified: true, rate: "₹1,200/hr", localScore: 98, tags: ["SEO", "Blog", "Copywriting"] },
  { id: 4, name: "Rahul Verma", skill: "Video Editor", city: "Pune", rating: 4.7, jobs: 38, verified: false, rate: "₹1,800/hr", localScore: 85, tags: ["Premiere Pro", "After Effects", "Motion"] },
  { id: 5, name: "Ananya Singh", skill: "Graphic Designer", city: "Hyderabad", rating: 4.8, jobs: 67, verified: true, rate: "₹2,000/hr", localScore: 91, tags: ["Branding", "Illustration", "Print"] },
  { id: 6, name: "Vikram Rao", skill: "Digital Marketer", city: "Chennai", rating: 4.6, jobs: 53, verified: true, rate: "₹2,200/hr", localScore: 88, tags: ["Google Ads", "Meta Ads", "Analytics"] },
  { id: 7, name: "Meera Joshi", skill: "Photographer", city: "Jaipur", rating: 4.9, jobs: 89, verified: true, rate: "₹3,500/hr", localScore: 97, tags: ["Wedding", "Portrait", "Product"] },
  { id: 8, name: "Karan Mehta", skill: "Mobile Developer", city: "Ahmedabad", rating: 4.7, jobs: 41, verified: false, rate: "₹2,800/hr", localScore: 82, tags: ["React Native", "Flutter", "iOS"] },
];

const BrowseFreelancers = () => {
  const [activeSkill, setActiveSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      {/* Header */}
      <section className="border-b border-border/40 bg-card/30">
        <div className="container py-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Find Local Talent</h1>
          <p className="text-muted-foreground">Browse verified freelancers in your region</p>

          {/* Search */}
          <div className="glass-card p-2 mt-6 max-w-2xl">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search by skill, name, or keyword..."
                  className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="gradient-brand text-primary-foreground font-semibold px-6">Search</Button>
            </div>
          </div>

          {/* Skill Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => setActiveSkill(skill)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSkill === skill
                    ? "gradient-brand text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground">{mockFreelancers.length} freelancers found</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-border text-foreground gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="border-border text-foreground gap-2">
              Sort by: Relevance <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockFreelancers.map((fl) => (
            <Link to={`/profile/${fl.id}`} key={fl.id} className="glass-card p-6 hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
                  {fl.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{fl.name}</span>
                    {fl.verified && <CheckCircle className="h-4 w-4 text-trust-green" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{fl.skill}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{fl.city}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-trust-gold" />{fl.rating}</span>
                <span>{fl.jobs} jobs</span>
              </div>

              {/* Trust Score */}
              <div className="flex items-center gap-2 mb-4">
                <div className="text-xs text-muted-foreground">Local Trust</div>
                <div className="flex-1 h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-trust-green" style={{ width: `${fl.localScore}%` }} />
                </div>
                <span className="text-xs font-semibold text-trust-green">{fl.localScore}%</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {fl.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground">{tag}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-sm font-semibold text-primary">{fl.rate}</span>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">View Profile →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default BrowseFreelancers;
