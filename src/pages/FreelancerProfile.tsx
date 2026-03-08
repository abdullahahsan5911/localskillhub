import { motion } from "framer-motion";
import {
  MapPin, Star, CheckCircle, Shield, Award, Calendar, Clock, ExternalLink,
  Mail, MessageSquare, Heart, Share2, Globe, Briefcase, TrendingUp,
  GraduationCap, Users, Zap, Phone, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const portfolio = [
  { title: "E-commerce Redesign", category: "Web Design", color: "from-primary to-brand-glow" },
  { title: "Brand Identity System", category: "Branding", color: "from-trust-gold to-primary" },
  { title: "Mobile Banking App", category: "UI/UX", color: "from-accent to-trust-green" },
  { title: "SaaS Dashboard", category: "Web App", color: "from-brand-glow to-accent" },
  { title: "Restaurant Website", category: "Web Design", color: "from-primary to-accent" },
  { title: "Fitness App UI", category: "Mobile", color: "from-trust-gold to-brand-glow" },
];

const reviews = [
  { name: "Amit Kumar", rating: 5, text: "Priya delivered exceptional work on our website redesign. Her attention to detail and understanding of our brand was outstanding. Highly professional and a pleasure to work with.", date: "2 weeks ago", project: "E-commerce Redesign" },
  { name: "Ruchi Agarwal", rating: 5, text: "Highly recommend! She understood our requirements perfectly and delivered ahead of schedule. The design exceeded our expectations.", date: "1 month ago", project: "Brand Identity" },
  { name: "Vikash Singh", rating: 4, text: "Great communication and professional work. Would hire again for future projects. Very responsive and creative.", date: "2 months ago", project: "Mobile App Design" },
];

const workHistory = [
  { title: "E-commerce Website Redesign", client: "TechStart Solutions", amount: "₹60,000", rating: 5, date: "Feb 2026" },
  { title: "Brand Identity Package", client: "GreenLeaf Co.", amount: "₹25,000", rating: 5, date: "Jan 2026" },
  { title: "Mobile App UI Design", client: "HealthFirst", amount: "₹45,000", rating: 5, date: "Dec 2025" },
  { title: "SaaS Dashboard Design", client: "CloudSync Tech", amount: "₹80,000", rating: 4, date: "Nov 2025" },
];

const FreelancerProfile = () => {
  return (
    <Layout>
      {/* Profile Header */}
      <section className="relative border-b border-border/30 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8 items-start"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground font-display font-bold text-5xl shrink-0 shadow-xl shadow-primary/20">
                P
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-trust-green border-2 border-background flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 text-background" />
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Priya Sharma</h1>
              </div>
              <p className="text-lg text-primary font-semibold mb-3">Senior UI/UX Designer</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />Mumbai, Maharashtra</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-trust-gold fill-trust-gold" />4.9 (47 reviews)</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Responds in &lt; 1 hour</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Member since 2023</span>
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />47 jobs completed</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Shield, label: "ID Verified", color: "text-trust-green bg-trust-green/10 border-trust-green/20" },
                  { icon: Award, label: "Top Rated", color: "text-trust-gold bg-trust-gold/10 border-trust-gold/20" },
                  { icon: MapPin, label: "Local Leader", color: "text-primary bg-primary/10 border-primary/20" },
                  { icon: GraduationCap, label: "College Verified", color: "text-brand-glow bg-brand-glow/10 border-brand-glow/20" },
                  { icon: Zap, label: "Fast Responder", color: "text-accent bg-accent/10 border-accent/20" },
                ].map((badge) => (
                  <span key={badge.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                    <badge.icon className="h-3 w-3" />{badge.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
              <Button className="gradient-brand text-primary-foreground font-semibold glow-sm gap-2 h-11">
                <MessageSquare className="h-4 w-4" /> Contact
              </Button>
              <Button variant="outline" className="border-border text-foreground gap-2 h-11">
                <Mail className="h-4 w-4" /> Send Proposal
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:text-foreground h-9 w-9">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:text-foreground h-9 w-9">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center mt-2 p-4 glass-card">
                <div className="text-2xl font-display font-bold text-primary">₹2,500</div>
                <div className="text-xs text-muted-foreground">per hour</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I'm a passionate UI/UX designer with 6+ years of experience creating intuitive digital experiences. Based in Mumbai, I specialize in web and mobile app design, design systems, and user research. I've worked with startups and enterprises across India, helping them build products that users love. I'm available for both on-site and remote work within Maharashtra.
              </p>
            </motion.section>

            {/* Skills */}
            <section>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {["UI Design", "UX Research", "Figma", "Adobe XD", "Prototyping", "Design Systems", "Mobile Design", "Web Design", "Wireframing", "User Testing"].map((skill) => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg text-sm bg-secondary text-secondary-foreground border border-border/30">{skill}</span>
                ))}
              </div>
            </section>

            {/* Portfolio */}
            <section>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Portfolio</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {portfolio.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card overflow-hidden group cursor-pointer hover:border-primary/30 transition-all hover:-translate-y-1"
                  >
                    <div className={`aspect-[4/3] bg-gradient-to-br ${item.color} flex items-center justify-center relative`}>
                      <span className="text-4xl font-display font-bold text-white/20">{item.title.charAt(0)}</span>
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Work History */}
            <section>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Work History</h2>
              <div className="space-y-3">
                {workHistory.map((work) => (
                  <div key={work.title} className="glass-card p-5 hover:border-primary/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{work.title}</h3>
                        <p className="text-xs text-muted-foreground">{work.client} • {work.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-primary">{work.amount}</span>
                        <div className="flex gap-0.5 justify-end mt-1">
                          {Array.from({ length: work.rating }).map((_, j) => (
                            <Star key={j} className="h-3 w-3 text-trust-gold fill-trust-gold" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <div key={i} className="glass-card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground">{review.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {Array.from({ length: review.rating }).map((_, j) => (
                                <Star key={j} className="h-3 w-3 text-trust-gold fill-trust-gold" />
                              ))}
                            </div>
                            <span className="text-[10px] text-primary">{review.project}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust Scores */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Trust Scores
              </h3>
              {[
                { label: "Overall", value: 96, color: "from-primary to-brand-glow" },
                { label: "Local Trust", value: 98, color: "from-trust-green to-accent" },
                { label: "Skill Score", value: 94, color: "from-trust-gold to-primary" },
              ].map((score) => (
                <div key={score.label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{score.label}</span>
                    <span className="font-bold text-foreground">{score.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score.value}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full rounded-full bg-gradient-to-r ${score.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Availability */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Availability</h3>
              <div className="space-y-2">
                {["Mon-Fri: 9AM - 6PM", "Sat: 10AM - 2PM", "Sun: Unavailable"].map((slot) => (
                  <div key={slot} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />{slot}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-trust-green animate-pulse" />
                  <span className="text-sm text-trust-green font-medium">Available Now</span>
                </div>
              </div>
            </div>

            {/* Endorsements */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-trust-gold" /> Community Endorsements
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Design Guild Mumbai", type: "Community", icon: Users },
                  { name: "IIT Bombay Alumni", type: "Education", icon: GraduationCap },
                  { name: "StartupMH Network", type: "Professional", icon: TrendingUp },
                ].map((endorsement) => (
                  <div key={endorsement.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20">
                    <endorsement.icon className="h-4 w-4 text-trust-gold shrink-0" />
                    <div>
                      <div className="text-sm text-foreground font-medium">{endorsement.name}</div>
                      <div className="text-[10px] text-muted-foreground">{endorsement.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Social Proof</h3>
              <div className="space-y-2">
                {[
                  { label: "LinkedIn", href: "#", icon: Globe },
                  { label: "Dribbble", href: "#", icon: ExternalLink },
                  { label: "GitHub", href: "#", icon: ExternalLink },
                  { label: "Behance", href: "#", icon: ExternalLink },
                ].map((link) => (
                  <a key={link.label} href={link.href} className="flex items-center gap-2 text-sm text-primary hover:text-brand-glow transition-colors p-2 rounded-lg hover:bg-secondary/30">
                    <link.icon className="h-3.5 w-3.5" />{link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Services/Packages */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Service Packages</h3>
              <div className="space-y-3">
                {[
                  { name: "Basic UI Design", price: "₹15,000", desc: "1 page, 2 revisions, 5-day delivery" },
                  { name: "Standard Package", price: "₹40,000", desc: "5 pages, 3 revisions, 10-day delivery" },
                  { name: "Premium Package", price: "₹80,000", desc: "Full site, unlimited revisions, 20-day delivery" },
                ].map((pkg) => (
                  <div key={pkg.name} className="p-3 rounded-lg bg-secondary/30 border border-border/20 hover:border-primary/20 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{pkg.name}</span>
                      <span className="text-sm font-bold text-primary">{pkg.price}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{pkg.desc}</p>
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

export default FreelancerProfile;
