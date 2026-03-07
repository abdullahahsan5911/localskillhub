import { useState } from "react";
import { Search, MapPin, Star, CheckCircle, SlidersHorizontal, ChevronDown, Briefcase, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const skills = ["All", "Web Development", "Graphic Design", "Video Production", "Digital Marketing", "Photography", "Content Writing", "Mobile Dev", "Data Science"];

const avatarColors = [
  "from-primary to-brand-glow",
  "from-accent to-trust-green",
  "from-trust-gold to-primary",
  "from-destructive to-trust-gold",
  "from-brand-glow to-accent",
  "from-primary to-accent",
  "from-trust-gold to-brand-glow",
  "from-accent to-primary",
];

const mockFreelancers = [
  { id: 1, name: "Priya Sharma", skill: "UI/UX Designer", city: "Mumbai", rating: 4.9, reviews: 47, verified: true, rate: "₹2,500/hr", localScore: 96, tags: ["Figma", "Adobe XD", "Prototyping"], availability: "Available Now" },
  { id: 2, name: "Arjun Patel", skill: "Full Stack Developer", city: "Bangalore", rating: 4.8, reviews: 92, verified: true, rate: "₹3,000/hr", localScore: 94, tags: ["React", "Node.js", "MongoDB"], availability: "Available Now" },
  { id: 3, name: "Sneha Gupta", skill: "Content Writer", city: "Delhi", rating: 4.9, reviews: 124, verified: true, rate: "₹1,200/hr", localScore: 98, tags: ["SEO", "Blog", "Copywriting"], availability: "Busy until Mar 15" },
  { id: 4, name: "Rahul Verma", skill: "Video Editor", city: "Pune", rating: 4.7, reviews: 38, verified: false, rate: "₹1,800/hr", localScore: 85, tags: ["Premiere Pro", "After Effects", "Motion"], availability: "Available Now" },
  { id: 5, name: "Ananya Singh", skill: "Graphic Designer", city: "Hyderabad", rating: 4.8, reviews: 67, verified: true, rate: "₹2,000/hr", localScore: 91, tags: ["Branding", "Illustration", "Print"], availability: "Available Now" },
  { id: 6, name: "Vikram Rao", skill: "Digital Marketer", city: "Chennai", rating: 4.6, reviews: 53, verified: true, rate: "₹2,200/hr", localScore: 88, tags: ["Google Ads", "Meta Ads", "Analytics"], availability: "Available Now" },
  { id: 7, name: "Meera Joshi", skill: "Photographer", city: "Jaipur", rating: 4.9, reviews: 89, verified: true, rate: "₹3,500/hr", localScore: 97, tags: ["Wedding", "Portrait", "Product"], availability: "Busy until Mar 20" },
  { id: 8, name: "Karan Mehta", skill: "Mobile Developer", city: "Ahmedabad", rating: 4.7, reviews: 41, verified: false, rate: "₹2,800/hr", localScore: 82, tags: ["React Native", "Flutter", "iOS"], availability: "Available Now" },
];

const BrowseFreelancers = () => {
  const [activeSkill, setActiveSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  return (
    <Layout>
      {/* Hero Header */}
      <section className="relative border-b border-border/30">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-muted/60 border border-brand/10 text-primary text-xs font-medium mb-5">
              <TrendingUp className="h-3.5 w-3.5" />
              {mockFreelancers.length} verified professionals near you
            </div>

            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3 tracking-tight">
              Browse Local Talent
            </h1>
            <p className="text-base text-muted-foreground max-w-xl">
              Discover trust-verified freelancers in your region. Filter by skill, location, and community ratings.
            </p>
          </div>

          {/* Search Bar */}
          <div className="glass-card p-2 mt-8 max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-2">
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
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="City or region..."
                  className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <Button className="gradient-brand text-primary-foreground font-semibold px-8 h-12 glow-sm">
                Search
              </Button>
            </div>
          </div>

          {/* Skill Pills */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => setActiveSkill(skill)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeSkill === skill
                    ? "gradient-brand text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/30"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{mockFreelancers.length} freelancers</span>
            <span className="text-xs text-muted-foreground">sorted by relevance</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground hover:text-foreground gap-2 rounded-full">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground hover:text-foreground gap-2 rounded-full">
              Sort <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {mockFreelancers.map((fl, idx) => (
            <Link
              to={`/profile/${fl.id}`}
              key={fl.id}
              className="glass-card p-0 overflow-hidden hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Card Top Accent */}
              <div className={`h-1 w-full bg-gradient-to-r ${avatarColors[idx % avatarColors.length]}`} />

              <div className="p-6">
                {/* Avatar & Info */}
                <div className="flex items-start gap-3.5 mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-primary-foreground font-display font-bold text-lg shrink-0 shadow-lg`}>
                    {fl.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground text-sm truncate">{fl.name}</span>
                      {fl.verified && <CheckCircle className="h-4 w-4 text-trust-green shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground block">{fl.skill}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{fl.city}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-trust-gold/10">
                    <Star className="h-3 w-3 text-trust-gold fill-trust-gold" />
                    <span className="text-xs font-semibold text-trust-gold">{fl.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{fl.reviews} reviews</span>
                  </div>
                </div>

                {/* Trust Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Local Trust Score</span>
                    <span className="text-xs font-bold text-trust-green">{fl.localScore}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-trust-green to-accent transition-all duration-700"
                      style={{ width: `${fl.localScore}%` }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {fl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary/80 text-muted-foreground border border-border/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  <div>
                    <span className="text-sm font-bold text-primary">{fl.rate}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    View Profile
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>

                {/* Availability */}
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                    fl.availability === "Available Now"
                      ? "text-trust-green"
                      : "text-muted-foreground"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      fl.availability === "Available Now" ? "bg-trust-green animate-pulse" : "bg-muted-foreground"
                    }`} />
                    {fl.availability}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground rounded-full px-8">
            Load More Freelancers
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default BrowseFreelancers;
