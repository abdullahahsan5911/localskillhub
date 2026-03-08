import { useState, useEffect, useCallback } from "react";
import { Search, MapPin, ArrowRight, Shield, Star, Users, Zap, CheckCircle, TrendingUp, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import useEmblaCarousel from "embla-carousel-react";

import webDesignImg from "@/assets/categories/web-design.jpg";
import graphicDesignImg from "@/assets/categories/graphic-design.jpg";
import videoProductionImg from "@/assets/categories/video-production.jpg";
import digitalMarketingImg from "@/assets/categories/digital-marketing.jpg";
import photographyImg from "@/assets/categories/photography.jpg";
import contentWritingImg from "@/assets/categories/content-writing.jpg";

const bannerSlides = [
  {
    title: "Find Local Talent",
    highlight: "You Can Trust",
    description: "Connect with verified freelancers in your city. Local reputation, community endorsements, and real trust signals.",
    image: webDesignImg,
  },
  {
    title: "Hire Designers &",
    highlight: "Creatives Nearby",
    description: "From graphic design to video production — discover top-rated professionals in your neighbourhood.",
    image: graphicDesignImg,
  },
  {
    title: "Grow Your Business",
    highlight: "With Local Experts",
    description: "Digital marketing, content writing, and development talent — all verified and community-endorsed.",
    image: digitalMarketingImg,
  },
];

const categories = [
  { name: "Web Development", image: webDesignImg, count: "2,340+" },
  { name: "Graphic Design", image: graphicDesignImg, count: "1,890+" },
  { name: "Video Production", image: videoProductionImg, count: "980+" },
  { name: "Digital Marketing", image: digitalMarketingImg, count: "1,560+" },
  { name: "Photography", image: photographyImg, count: "1,200+" },
  { name: "Content Writing", image: contentWritingImg, count: "2,100+" },
];

const stats = [
  { value: "50K+", label: "Verified Freelancers" },
  { value: "120K+", label: "Jobs Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "200+", label: "Cities Covered" },
];

const howItWorks = [
  {
    icon: Search,
    title: "Search Locally",
    description: "Enter your city and the skill you need. Our geo-filter shows verified talent near you.",
  },
  {
    icon: Shield,
    title: "Trust & Verify",
    description: "Check local trust scores, verified badges, community endorsements, and portfolios.",
  },
  {
    icon: Zap,
    title: "Hire & Collaborate",
    description: "Send proposals, negotiate, set milestones, and pay securely through escrow.",
  },
];

const featuredFreelancers = [
  { name: "Priya Sharma", skill: "UI/UX Designer", city: "Mumbai", rating: 4.9, jobs: 47, verified: true, rate: "₹2,500/hr" },
  { name: "Arjun Patel", skill: "Full Stack Dev", city: "Bangalore", rating: 4.8, jobs: 92, verified: true, rate: "₹3,000/hr" },
  { name: "Sneha Gupta", skill: "Content Writer", city: "Delhi", rating: 4.9, jobs: 124, verified: true, rate: "₹1,200/hr" },
  { name: "Rahul Verma", skill: "Video Editor", city: "Pune", rating: 4.7, jobs: 38, verified: false, rate: "₹1,800/hr" },
];

const Index = () => {
  const [searchService, setSearchService] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeSlide, setActiveSlide] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const [catRef, catApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const catScrollPrev = useCallback(() => catApi?.scrollPrev(), [catApi]);
  const catScrollNext = useCallback(() => catApi?.scrollNext(), [catApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    const autoplay = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(autoplay);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <Layout>
      {/* Hero Carousel */}
      <section className="relative overflow-hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {bannerSlides.map((slide, i) => (
              <div key={i} className="relative flex-[0_0_100%] min-w-0">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img src={slide.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/85" />
                </div>

                {/* Content */}
                <div className="container relative py-24 md:py-36">
                  <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-muted border border-primary/20 text-primary text-sm font-medium mb-8">
                      <MapPin className="h-4 w-4" />
                      Region-Specific • Trust-Verified • Community-Driven
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
                      {slide.title}
                      <br />
                      <span className="text-primary">{slide.highlight}</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                      {slide.description}
                    </p>

                    {/* Search Bar */}
                    <div className="glass-card p-2 max-w-2xl mx-auto">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 transition-colors focus-within:bg-secondary">
                          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                          <input
                            type="text"
                            placeholder="What service are you looking for?"
                            className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                            value={searchService}
                            onChange={(e) => setSearchService(e.target.value)}
                          />
                        </div>
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 transition-colors focus-within:bg-secondary">
                          <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                          <input
                            type="text"
                            placeholder="City or Postcode"
                            className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                            value={searchLocation}
                            onChange={(e) => setSearchLocation(e.target.value)}
                          />
                        </div>
                        <Link to="/browse">
                          <Button className="bg-primary text-primary-foreground font-semibold h-12 px-8 w-full sm:w-auto hover:bg-primary/90 transition-all duration-200">
                            Search
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={scrollPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur border border-border/50 text-foreground hover:bg-card transition-all duration-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur border border-border/50 text-foreground hover:bg-card transition-all duration-200"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeSlide ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Carousel */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Browse by Category</h2>
            <p className="text-muted-foreground mt-2">Find the right professional for your project</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={catScrollPrev} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={catScrollNext} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200">
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link to="/browse" className="hidden md:flex items-center gap-1 text-primary hover:text-brand-glow text-sm font-medium transition-colors duration-200 ml-2">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div ref={catRef} className="overflow-hidden">
          <div className="flex gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to="/browse"
                className="group relative flex-[0_0_45%] sm:flex-[0_0_30%] lg:flex-[0_0_22%] aspect-[4/3] rounded-xl overflow-hidden"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-background/50 group-hover:bg-background/40 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 p-5">
                  <h3 className="text-lg font-display font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.count} professionals</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Three simple steps to find trusted local talent</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {howItWorks.map((step, i) => (
            <div key={step.title} className="glass-card p-8 text-center group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-6 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
                <step.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="text-xs text-muted-foreground font-medium mb-2">Step {i + 1}</div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Top Local Talent</h2>
            <p className="text-muted-foreground mt-2">Highly rated freelancers in your region</p>
          </div>
          <Link to="/browse" className="hidden md:flex items-center gap-1 text-primary hover:text-brand-glow text-sm font-medium transition-colors duration-200">
            Browse All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredFreelancers.map((fl, i) => (
            <Link to="/profile/1" key={fl.name} className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
                  {fl.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-sm">{fl.name}</span>
                    {fl.verified && <CheckCircle className="h-4 w-4 text-trust-green" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{fl.skill}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{fl.city}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-trust-gold" />{fl.rating}</span>
                <span>{fl.jobs} jobs</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-sm font-semibold text-primary">{fl.rate}</span>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors duration-200">View Profile →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="container py-20">
        <div className="glass-card p-10 md:p-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Built on <span className="text-primary">Local Trust</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Unlike global platforms, LocalSkillHub combines official verification, community endorsements, and local reputation signals to give you confidence in every hire.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Shield, text: "Identity & skill verification" },
                  { icon: Award, text: "Community endorsement badges" },
                  { icon: TrendingUp, text: "Local trust scoring system" },
                  { icon: Users, text: "Region-specific leaderboards" },
                ].map((item, i) => (
                  <div key={item.text} className="flex items-center gap-3 animate-slide-in-left" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-muted">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Local Trust", value: "96%", color: "text-trust-green" },
                { label: "Skill Score", value: "4.8/5", color: "text-trust-gold" },
                { label: "Response Time", value: "< 2hrs", color: "text-primary" },
                { label: "Repeat Hire", value: "72%", color: "text-brand-glow" },
              ].map((metric, i) => (
                <div key={metric.label} className="glass-card p-6 text-center hover:border-primary/20 transition-all duration-300 animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`text-2xl font-display font-bold ${metric.color}`}>{metric.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Ready to Connect Locally?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of freelancers and clients building trust in their local communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button className="bg-primary text-primary-foreground font-semibold h-12 px-8 hover:bg-primary/90 transition-all duration-200">
                Join as Freelancer
              </Button>
            </Link>
            <Link to="/post-job">
              <Button variant="outline" className="h-12 px-8 border-border text-foreground hover:bg-secondary transition-all duration-200">
                Post a Job
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
