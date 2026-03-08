import { useState, useEffect, useCallback, useRef } from "react";
import { Search, MapPin, ArrowRight, CheckCircle, Shield, Users, Zap, Star, Briefcase, Clock, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { AnimatedSection, StaggerContainer, StaggerItem, FloatingElement } from "@/components/home/AnimatedSection";
import { motion } from "framer-motion";

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
import avatar7 from "@/assets/avatars/avatar-7.jpg";
import avatar8 from "@/assets/avatars/avatar-8.jpg";

const categories = [
  { name: "Web Development", image: webDesignImg, count: "2,340+" },
  { name: "Graphic Design", image: graphicDesignImg, count: "1,890+" },
  { name: "Video Production", image: videoProductionImg, count: "980+" },
  { name: "Digital Marketing", image: digitalMarketingImg, count: "1,560+" },
  { name: "Photography", image: photographyImg, count: "1,200+" },
  { name: "Content Writing", image: contentWritingImg, count: "2,100+" },
  { name: "Mobile App Dev", image: webDesignImg, count: "1,750+" },
  { name: "Brand Strategy", image: graphicDesignImg, count: "890+" },
  { name: "Motion Graphics", image: videoProductionImg, count: "670+" },
  { name: "SEO Services", image: digitalMarketingImg, count: "1,430+" },
  { name: "Product Photography", image: photographyImg, count: "560+" },
  { name: "Copywriting", image: contentWritingImg, count: "1,980+" },
];

const featuredFreelancers = [
  { name: "Priya Sharma", skill: "UI/UX Designer", city: "Mumbai", rating: 4.9, jobs: 47, verified: true, avatar: avatar1 },
  { name: "Arjun Patel", skill: "Full Stack Dev", city: "Bangalore", rating: 4.8, jobs: 92, verified: true, avatar: avatar2 },
  { name: "Sneha Gupta", skill: "Content Writer", city: "Delhi", rating: 4.9, jobs: 124, verified: true, avatar: avatar3 },
  { name: "Rahul Verma", skill: "Video Editor", city: "Pune", rating: 4.7, jobs: 38, verified: false, avatar: avatar4 },
  { name: "Ananya Desai", skill: "Photographer", city: "Hyderabad", rating: 4.8, jobs: 67, verified: true, avatar: avatar5 },
  { name: "Vikram Singh", skill: "Digital Marketer", city: "Chennai", rating: 4.6, jobs: 55, verified: true, avatar: avatar6 },
  { name: "Kavita Menon", skill: "Brand Designer", city: "Kochi", rating: 4.9, jobs: 83, verified: true, avatar: avatar7 },
  { name: "Aditya Rao", skill: "Mobile Developer", city: "Jaipur", rating: 4.7, jobs: 61, verified: true, avatar: avatar8 },
  { name: "Neha Kulkarni", skill: "Motion Designer", city: "Ahmedabad", rating: 4.8, jobs: 45, verified: true, avatar: avatar1 },
  { name: "Siddharth Joshi", skill: "SEO Specialist", city: "Lucknow", rating: 4.6, jobs: 72, verified: false, avatar: avatar2 },
  { name: "Ritu Agarwal", skill: "Illustrator", city: "Kolkata", rating: 4.9, jobs: 98, verified: true, avatar: avatar3 },
  { name: "Deepak Nair", skill: "Copywriter", city: "Thiruvananthapuram", rating: 4.8, jobs: 53, verified: true, avatar: avatar4 },
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
  { name: "Amit Sharma", role: "Product Manager", text: "LocalSkillHub made it incredibly easy to find skilled developers nearby. The quality of work exceeded our expectations.", avatar: avatar1 },
  { name: "Pooja Reddy", role: "Marketing Head", text: "We found our entire design team through LocalSkillHub. The vetting process ensures only the best talent.", avatar: avatar7 },
  { name: "Karthik Menon", role: "CTO, TechStart", text: "The platform's local focus means faster turnarounds and better communication. A game changer for our startup.", avatar: avatar4 },
  { name: "Sunita Patel", role: "E-commerce Owner", text: "From photographers to web developers, I've found amazing talent for every project. Truly a one-stop solution.", avatar: avatar8 },
  { name: "Rajesh Kumar", role: "Creative Director", text: "The endorsement system gives real confidence. We've built lasting relationships with freelancers found here.", avatar: avatar6 },
];

// --- Reusable Swipe Hook ---
function useSwipe(onLeft: () => void, onRight: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; },
    onTouchMove: (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; },
    onTouchEnd: () => {
      if (touchStartX.current === null || touchEndX.current === null) return;
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) {
        if (diff > 0) onLeft();
        else onRight();
      }
      touchStartX.current = null;
      touchEndX.current = null;
    },
  };

  return handlers;
}

// --- Reusable Carousel Hook ---
function useCarouselScroll(itemsPerView: number, totalItems: number, autoPlayMs?: number) {
  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, maxIndex)), [maxIndex]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (!autoPlayMs) return;
    const timer = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [autoPlayMs, maxIndex]);

  const swipeHandlers = useSwipe(next, prev);

  return { index, next, prev, canPrev: index > 0, canNext: index < maxIndex, swipeHandlers };
}

// --- Carousel Navigation Buttons ---
const CarouselNav = ({ onPrev, onNext, canPrev, canNext }: { onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean }) => (
  <div className="flex gap-2">
    <button
      onClick={onPrev}
      disabled={!canPrev}
      className="w-10 h-10 rounded-full border border-border flex items-center justify-center disabled:opacity-20 hover:bg-secondary transition-colors"
    >
      <ChevronLeft className="h-5 w-5 text-foreground" />
    </button>
    <button
      onClick={onNext}
      disabled={!canNext}
      className="w-10 h-10 rounded-full border border-border flex items-center justify-center disabled:opacity-20 hover:bg-secondary transition-colors"
    >
      <ChevronRight className="h-5 w-5 text-foreground" />
    </button>
  </div>
);
const heroSlides = [
  { image: webDesignImg, label: "Web Development" },
  { image: graphicDesignImg, label: "Graphic Design" },
  { image: photographyImg, label: "Photography" },
  { image: videoProductionImg, label: "Video Production" },
  { image: digitalMarketingImg, label: "Digital Marketing" },
  { image: contentWritingImg, label: "Content Writing" },
];

const HeroSectionInline = ({
  searchService,
  setSearchService,
  searchLocation,
  setSearchLocation,
}: {
  searchService: string;
  setSearchService: (v: string) => void;
  searchLocation: string;
  setSearchLocation: (v: string) => void;
}) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleSwipe = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setCurrent((p) => (p + 1) % heroSlides.length);
      else setCurrent((p) => (p - 1 + heroSlides.length) % heroSlides.length);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-foreground text-primary-foreground border-b border-border/40 min-h-[85vh] flex items-center">
      <div className="container py-16 md:py-20">
        {/* Title on top */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight mb-10 text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Hire The World's Best{" "}
          <span className="text-brand">Freelancers</span>
        </motion.h1>

        {/* Side by side: Search + Image Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Search & Info */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-primary-foreground/60 text-lg md:text-xl max-w-lg leading-relaxed">
              Trusted professionals in 200+ cities. Verified skills, community endorsements, real results.
            </p>

            {/* Search Bar */}
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 border border-primary-foreground/10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-foreground/5">
                  <Search className="h-5 w-5 text-primary-foreground/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="What service are you looking for?"
                    className="bg-transparent w-full text-primary-foreground placeholder:text-primary-foreground/40 outline-none text-sm"
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-foreground/5">
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
                  <Button className="w-full h-12 rounded-xl font-semibold bg-brand hover:bg-brand-glow text-foreground text-base gap-2 group">
                    Search Freelancers
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex -space-x-2">
                {[avatar1, avatar2, avatar3, avatar4, avatar5].map((av, i) => (
                  <motion.img
                    key={i}
                    src={av}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-foreground object-cover"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                  />
                ))}
              </div>
              <span className="text-sm text-primary-foreground/60">
                Join <strong className="text-primary-foreground">50,000+</strong> active freelancers
              </span>
            </div>
          </motion.div>

          {/* Right — Image Slider (side by side thumbnails) */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Main Image */}
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border/30 touch-pan-y"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
              onTouchEnd={handleSwipe}
            >
              {heroSlides.map((slide, i) => (
                <motion.img
                  key={i}
                  src={slide.image}
                  alt={slide.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={false}
                  animate={{ opacity: i === current ? 1 : 0, scale: i === current ? 1 : 1.05 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
              ))}
              {/* Label overlay */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-6"
                key={current}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-primary-foreground font-display font-semibold text-lg">
                  {heroSlides[current].label}
                </span>
              </motion.div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 mt-3">
              {heroSlides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`relative flex-1 aspect-[3/2] rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i === current
                      ? "border-brand ring-2 ring-brand/30 scale-105"
                      : "border-border/20 opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={slide.image} alt={slide.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const [searchService, setSearchService] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  // Responsive items per view (simplified: use fixed counts, CSS handles overflow)
  const catCarousel = useCarouselScroll(6, categories.length, 4000);
  const flCarousel = useCarouselScroll(4, featuredFreelancers.length, 5000);
  const testCarousel = useCarouselScroll(3, testimonials.length, 6000);

  return (
    <Layout>
      {/* Hero */}
      <HeroSectionInline
        searchService={searchService}
        setSearchService={setSearchService}
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
      />

      {/* Browse Categories — Carousel */}
      <section className="bg-foreground pb-20">
        <div className="container">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-6">
              <p className="text-primary-foreground/40 text-sm font-medium tracking-wide uppercase">Browse Categories</p>
              <div className="flex gap-2">
                <button
                  onClick={catCarousel.prev}
                  disabled={!catCarousel.canPrev}
                  className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center disabled:opacity-20 hover:bg-primary-foreground/10 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-primary-foreground" />
                </button>
                <button
                  onClick={catCarousel.next}
                  disabled={!catCarousel.canNext}
                  className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center disabled:opacity-20 hover:bg-primary-foreground/10 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </AnimatedSection>
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-4 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${catCarousel.index * (100 / 6)}%)` }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  className="flex-shrink-0"
                  style={{ width: "calc((100% - 5 * 1rem) / 6)" }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Link
                    to="/browse"
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden block"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-foreground/60 group-hover:bg-foreground/40 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-sm font-semibold text-primary-foreground">{cat.name}</h3>
                      <p className="text-xs text-primary-foreground/50">{cat.count} freelancers</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Hire Section */}
      <section className="bg-card border-y border-border/40">
        <div className="container py-20">
          <div className="max-w-3xl">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Why hire on LocalSkillHub?
              </h2>
              <p className="text-muted-foreground mb-12 text-lg">
                Hiring freelancers on LocalSkillHub is seamless and secure.
              </p>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 gap-x-12 gap-y-10" staggerDelay={0.15}>
              {whyHire.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="flex gap-4 group">
                    <motion.div
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <AnimatedSection delay={0.4}>
              <div className="mt-12 flex gap-4">
                <Button className="h-12 rounded-full px-8 font-semibold bg-brand hover:bg-brand-glow text-foreground">
                  Get Started
                </Button>
                <Button variant="outline" className="h-12 rounded-full px-8 font-semibold">
                  Browse Freelancers
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Featured Freelancers — Carousel */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-12">
          <AnimatedSection direction="left">
            <div>
              <p className="text-sm font-semibold text-brand mb-2">Our Freelancers</p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight max-w-2xl">
                Hire top freelancers hand-selected by the LocalSkillHub team.
              </h2>
            </div>
          </AnimatedSection>
          <CarouselNav onPrev={flCarousel.prev} onNext={flCarousel.next} canPrev={flCarousel.canPrev} canNext={flCarousel.canNext} />
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${flCarousel.index * (100 / 4)}%)` }}
          >
            {featuredFreelancers.map((fl, i) => (
              <motion.div
                key={fl.name}
                className="flex-shrink-0"
                style={{ width: "calc((100% - 3 * 1.5rem) / 4)" }}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  to="/profile/1"
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group flex flex-col items-center text-center block"
                >
                  <motion.div
                    className="relative mb-4"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img src={fl.avatar} alt={fl.name} className="w-20 h-20 rounded-full object-cover border-2 border-background shadow-sm" />
                    {fl.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        <CheckCircle className="h-5 w-5 text-trust-green" />
                      </div>
                    )}
                  </motion.div>

                  <h3 className="font-semibold text-foreground text-lg">{fl.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{fl.skill} • {fl.city}</p>

                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center gap-1 text-sm font-medium text-foreground bg-secondary px-2.5 py-1 rounded-full">
                      <Star className="h-3.5 w-3.5 text-trust-gold fill-trust-gold" /> {fl.rating}
                    </div>
                    <div className="text-sm text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                      {fl.jobs} jobs
                    </div>
                  </div>

                  <div className="w-full mt-auto">
                    <Button variant="outline" className="w-full rounded-full font-medium group-hover:bg-foreground group-hover:text-primary-foreground transition-colors">
                      View Profile
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatedSection className="mt-12 text-center">
          <Button className="h-12 rounded-full px-8 font-semibold bg-brand hover:bg-brand-glow text-foreground">
            Browse All Freelancers
          </Button>
        </AnimatedSection>
      </section>

      {/* Testimonials — Carousel */}
      <section className="bg-card py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <AnimatedSection direction="left">
              <div>
                <p className="text-sm font-semibold text-brand mb-2">Success Stories</p>
                <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                  See what clients are saying.
                </h2>
              </div>
            </AnimatedSection>
            <CarouselNav onPrev={testCarousel.prev} onNext={testCarousel.next} canPrev={testCarousel.canPrev} canNext={testCarousel.canNext} />
          </div>

          <div className="overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${testCarousel.index * (100 / 3)}%)` }}
            >
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  className="bg-background border border-border/60 rounded-2xl p-8 flex flex-col flex-shrink-0"
                  style={{ width: "calc((100% - 2 * 1.5rem) / 3)" }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Quote className="h-8 w-8 text-brand/30 mb-4" />
                  <p className="text-base text-foreground leading-relaxed mb-8 flex-grow">{t.text}</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <AnimatedSection className="container max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
            Hiring on behalf<br />of your company?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Work with your team to hire and manage creative talent all in one place.
          </p>
          <Link to="/post-job">
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button className="h-12 rounded-full px-10 font-semibold bg-brand hover:bg-brand-glow text-foreground text-base">
                Contact Us
              </Button>
            </motion.div>
          </Link>
        </AnimatedSection>
      </section>

      {/* Bottom Stats */}
      <section className="bg-foreground text-primary-foreground">
        <div className="container py-24 text-center">
          <AnimatedSection>
            <p className="text-sm font-semibold mb-4">LocalSkillHub</p>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-16 max-w-3xl mx-auto">
              Tap into your city's largest professional community.
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid sm:grid-cols-3 gap-10 max-w-4xl mx-auto divide-x divide-primary-foreground/10" staggerDelay={0.2}>
            {[
              { value: "50M+", label: "Over 50 million professionals in the LocalSkillHub community" },
              { value: "Billions", label: "Over 1 billion projects created across the globe on LocalSkillHub" },
              { value: "2008", label: "Founded in 2008, LocalSkillHub has built a trusted network for over 15 years" },
            ].map((s) => (
              <StaggerItem key={s.value}>
                <div className="px-6">
                  <motion.div
                    className="text-3xl md:text-4xl font-display font-bold mb-3"
                    whileInView={{ scale: [0.8, 1.05, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    {s.value}
                  </motion.div>
                  <div className="text-sm text-primary-foreground/60 leading-relaxed">{s.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
