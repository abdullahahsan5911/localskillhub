import { useState } from "react";
import { Search, MapPin, ArrowRight, CheckCircle, Shield, Users, Zap, Star, Briefcase, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

import webDesignImg from "@/assets/categories/web-design.jpg";
import graphicDesignImg from "@/assets/categories/graphic-design.jpg";
import videoProductionImg from "@/assets/categories/video-production.jpg";
import digitalMarketingImg from "@/assets/categories/digital-marketing.jpg";
import photographyImg from "@/assets/categories/photography.jpg";
import contentWritingImg from "@/assets/categories/content-writing.jpg";

import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar6 from "@/assets/avatars/avatar-6.jpg";

const categories = [
  { name: "Web Development", image: webDesignImg, count: "2,340+" },
  { name: "Graphic Design", image: graphicDesignImg, count: "1,890+" },
  { name: "Video Production", image: videoProductionImg, count: "980+" },
  { name: "Digital Marketing", image: digitalMarketingImg, count: "1,560+" },
  { name: "Photography", image: photographyImg, count: "1,200+" },
  { name: "Content Writing", image: contentWritingImg, count: "2,100+" },
];

const featuredFreelancers = [
  { name: "Priya Sharma", skill: "UI/UX Designer", city: "Mumbai", rating: 4.9, jobs: 47, verified: true, rate: "₹2,500/hr", avatar: avatar1 },
  { name: "Arjun Patel", skill: "Full Stack Dev", city: "Bangalore", rating: 4.8, jobs: 92, verified: true, rate: "₹3,000/hr", avatar: avatar2 },
  { name: "Sneha Gupta", skill: "Content Writer", city: "Delhi", rating: 4.9, jobs: 124, verified: true, rate: "₹1,200/hr", avatar: avatar3 },
  { name: "Rahul Verma", skill: "Video Editor", city: "Pune", rating: 4.7, jobs: 38, verified: false, rate: "₹1,800/hr", avatar: avatar4 },
  { name: "Ananya Desai", skill: "Photographer", city: "Hyderabad", rating: 4.8, jobs: 67, verified: true, rate: "₹2,000/hr", avatar: avatar5 },
  { name: "Vikram Singh", skill: "Digital Marketer", city: "Chennai", rating: 4.6, jobs: 55, verified: true, rate: "₹1,500/hr", avatar: avatar6 },
];

const whyHire = [
  { icon: Shield, title: "Verified & Trusted", description: "Every freelancer goes through identity checks, skill verification, and community endorsements." },
  { icon: MapPin, title: "Local Talent, Real Connections", description: "Work with professionals in your city. Meet face-to-face, build lasting relationships." },
  { icon: Zap, title: "Fast & Secure Payments", description: "Escrow-protected payments with milestone tracking. Pay only when you're satisfied." },
  { icon: Users, title: "Community Endorsed", description: "See who's trusted by your local community through endorsements and ratings." },
];

const testimonials = [
  { name: "Meera Iyer", role: "Startup Founder", text: "Found an incredible UI designer in my city within hours. The local trust system gave me total confidence.", avatar: avatar3 },
  { name: "Rohit Kapoor", role: "Agency Director", text: "We've hired 12 freelancers through LocalSkillHub. Quality is consistently excellent and communication is seamless.", avatar: avatar2 },
  { name: "Divya Nair", role: "Small Business Owner", text: "The fact that I could meet my freelancer in person made all the difference. Highly recommend for local projects.", avatar: avatar5 },
];

const stats = [
  { value: "50K+", label: "Verified Freelancers" },
  { value: "120K+", label: "Projects Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "200+", label: "Cities Covered" },
];

const Index = () => {
  const [searchService, setSearchService] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-foreground text-primary-foreground border-b border-border/40">
        <div className="container py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6">
              Hire The World's Best
              <br />
              <span className="text-brand">Freelancers</span> on LocalSkillHub
            </h1>
            <p className="text-primary-foreground/60 text-lg md:text-xl mt-5 max-w-2xl mx-auto">
              Trusted professionals in 200+ cities. Verified skills, community endorsements, real results.
            </p>

            {/* Search */}
            <div className="mt-10 bg-primary-foreground/10 backdrop-blur-sm rounded-full p-2 max-w-3xl mx-auto border border-primary-foreground/10">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-full bg-transparent">
                  <Search className="h-5 w-5 text-primary-foreground/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="What service are you looking for?"
                    className="bg-transparent w-full text-primary-foreground placeholder:text-primary-foreground/40 outline-none text-sm"
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                  />
                </div>
                <div className="w-px h-8 bg-primary-foreground/20 hidden sm:block self-center"></div>
                <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-full bg-transparent">
                  <MapPin className="h-5 w-5 text-primary-foreground/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="City or Postcode"
                    className="bg-transparent w-full text-primary-foreground placeholder:text-primary-foreground/40 outline-none text-sm"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <Link to="/browse">
                  <Button className="h-10 rounded-full px-8 w-full sm:w-auto font-semibold bg-brand hover:bg-brand-glow text-foreground">
                    Search
                  </Button>
                </Link>
              </div>
            </div>

            {/* Avatars row */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {[avatar1, avatar2, avatar3, avatar4, avatar5].map((av, i) => (
                  <img key={i} src={av} alt="" className="w-8 h-8 rounded-full border-2 border-foreground object-cover" />
                ))}
              </div>
              <span className="text-sm text-primary-foreground/60">
                Join <strong className="text-primary-foreground">50,000+</strong> active freelancers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Categories */}
      <section className="bg-foreground pb-20">
        <div className="container">
          <p className="text-center text-primary-foreground/40 text-sm mb-6 font-medium tracking-wide uppercase">Browse Categories</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to="/browse"
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/60 group-hover:bg-foreground/40 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-sm font-semibold text-primary-foreground">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Hire Section */}
      <section className="bg-card border-y border-border/40">
        <div className="container py-20">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Why hire on LocalSkillHub?
            </h2>
            <p className="text-muted-foreground mb-12 text-lg">
              Hiring freelancers on LocalSkillHub is seamless and secure.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
              {whyHire.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 flex gap-4">
              <Button className="h-12 rounded-full px-8 font-semibold bg-brand hover:bg-brand-glow text-foreground">
                Get Started
              </Button>
              <Button variant="outline" className="h-12 rounded-full px-8 font-semibold">
                Browse Freelancers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="container py-20">
        <div className="mb-12">
          <p className="text-sm font-semibold text-brand mb-2">Our Freelancers</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight max-w-2xl">
            Hire top freelancers hand-selected by the LocalSkillHub team.
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide mb-8">
          {['All', 'Web Developers', 'Brand Designers', 'Illustrators', 'UI/UX Designers'].map((tab, i) => (
            <button key={tab} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${i === 0 ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredFreelancers.map((fl) => (
            <Link
              key={fl.name}
              to="/profile/1"
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group flex flex-col items-center text-center"
            >
              <div className="relative mb-4">
                <img src={fl.avatar} alt={fl.name} className="w-20 h-20 rounded-full object-cover border-2 border-background shadow-sm" />
                {fl.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    <CheckCircle className="h-5 w-5 text-trust-green" />
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-foreground text-lg">{fl.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{fl.skill} • {fl.city}</p>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground bg-secondary px-2.5 py-1 rounded-full">
                  <Star className="h-3.5 w-3.5 text-trust-gold fill-trust-gold" /> {fl.rating}
                </div>
                <div className="text-sm text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {fl.jobs} jobs completed
                </div>
              </div>
              
              <div className="w-full mt-auto">
                <Button variant="outline" className="w-full rounded-full font-medium group-hover:bg-foreground group-hover:text-primary-foreground transition-colors">
                  View Profile
                </Button>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button className="h-12 rounded-full px-8 font-semibold bg-brand hover:bg-brand-glow text-foreground">
            Browse All Freelancers
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-card py-20">
        <div className="container">
          <div className="mb-12">
            <p className="text-sm font-semibold text-brand mb-2">Success Stories</p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              See what clients are saying.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-background border border-border/60 rounded-2xl p-8 flex flex-col">
                <p className="text-base text-foreground leading-relaxed mb-8 flex-grow">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
            Hiring on behalf<br />of your company?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Work with your team to hire and manage creative talent all in one place.
          </p>
          <Link to="/post-job">
            <Button className="h-12 rounded-full px-10 font-semibold bg-brand hover:bg-brand-glow text-foreground text-base">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>

      {/* Bottom Stats Banner */}
      <section className="bg-foreground text-primary-foreground">
        <div className="container py-24 text-center">
          <p className="text-sm font-semibold mb-4">LocalSkillHub</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-16 max-w-3xl mx-auto">
            Tap into your city's largest professional community.
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-10 max-w-4xl mx-auto divide-x divide-primary-foreground/10">
            {[
              { value: "50M+", label: "Over 50 million professionals in the LocalSkillHub community" },
              { value: "Billions", label: "Over 1 billion projects created across the globe on LocalSkillHub" },
              { value: "2008", label: "Founded in 2008, LocalSkillHub has built a trusted network for over 15 years" },
            ].map((s) => (
              <div key={s.value} className="px-6">
                <div className="text-3xl md:text-4xl font-display font-bold mb-3">{s.value}</div>
                <div className="text-sm text-primary-foreground/60 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
