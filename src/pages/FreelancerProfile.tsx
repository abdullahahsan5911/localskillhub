import { MapPin, Star, CheckCircle, Shield, Award, Calendar, Clock, ExternalLink, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const portfolio = [
  { title: "E-commerce Redesign", category: "Web Design" },
  { title: "Brand Identity System", category: "Branding" },
  { title: "Mobile Banking App", category: "UI/UX" },
  { title: "SaaS Dashboard", category: "Web App" },
  { title: "Restaurant Website", category: "Web Design" },
  { title: "Fitness App UI", category: "Mobile" },
];

const reviews = [
  { name: "Amit Kumar", rating: 5, text: "Priya delivered exceptional work on our website redesign. Her attention to detail and understanding of our brand was outstanding.", date: "2 weeks ago" },
  { name: "Ruchi Agarwal", rating: 5, text: "Highly recommend! She understood our requirements perfectly and delivered ahead of schedule.", date: "1 month ago" },
  { name: "Vikash Singh", rating: 4, text: "Great communication and professional work. Would hire again for future projects.", date: "2 months ago" },
];

const FreelancerProfile = () => {
  return (
    <Layout>
      {/* Profile Header */}
      <section className="border-b border-border/40 bg-card/30">
        <div className="container py-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground font-display font-bold text-4xl shrink-0">
              P
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Priya Sharma</h1>
                <CheckCircle className="h-6 w-6 text-trust-green" />
              </div>
              <p className="text-lg text-primary font-medium mb-2">Senior UI/UX Designer</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />Mumbai, Maharashtra</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-trust-gold" />4.9 (47 reviews)</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Responds in &lt; 1 hour</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Member since 2023</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Shield, label: "ID Verified", color: "text-trust-green bg-trust-green/10" },
                  { icon: Award, label: "Top Rated", color: "text-trust-gold bg-trust-gold/10" },
                  { icon: MapPin, label: "Local Leader", color: "text-primary bg-brand-muted" },
                ].map((badge) => (
                  <span key={badge.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                    <badge.icon className="h-3 w-3" />{badge.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
              <Button className="gradient-brand text-primary-foreground font-semibold glow-sm gap-2">
                <MessageSquare className="h-4 w-4" /> Contact
              </Button>
              <Button variant="outline" className="border-border text-foreground gap-2">
                <Mail className="h-4 w-4" /> Send Proposal
              </Button>
              <div className="text-center mt-2">
                <div className="text-2xl font-display font-bold text-primary">₹2,500</div>
                <div className="text-xs text-muted-foreground">per hour</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            <section>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I'm a passionate UI/UX designer with 6+ years of experience creating intuitive digital experiences. Based in Mumbai, I specialize in web and mobile app design, design systems, and user research. I've worked with startups and enterprises across India, helping them build products that users love. I'm available for both on-site and remote work within Maharashtra.
              </p>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {["UI Design", "UX Research", "Figma", "Adobe XD", "Prototyping", "Design Systems", "Mobile Design", "Web Design", "Wireframing", "User Testing"].map((skill) => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg text-sm bg-secondary text-secondary-foreground">{skill}</span>
                ))}
              </div>
            </section>

            {/* Portfolio */}
            <section>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Portfolio</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {portfolio.map((item, i) => (
                  <div key={i} className="glass-card overflow-hidden group cursor-pointer">
                    <div className="aspect-[4/3] bg-gradient-to-br from-brand-muted to-secondary flex items-center justify-center">
                      <span className="text-3xl font-display font-bold text-primary/20">{item.title.charAt(0)}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
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
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground">{review.name}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: review.rating }).map((_, j) => (
                              <Star key={j} className="h-3 w-3 text-trust-gold fill-trust-gold" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust Scores */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Trust Scores</h3>
              {[
                { label: "Overall", value: 96, color: "bg-primary" },
                { label: "Local Trust", value: 98, color: "bg-trust-green" },
                { label: "Skill Score", value: 94, color: "bg-trust-gold" },
              ].map((score) => (
                <div key={score.label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{score.label}</span>
                    <span className="font-semibold text-foreground">{score.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className={`h-full rounded-full ${score.color}`} style={{ width: `${score.value}%` }} />
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
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-trust-green animate-pulse" />
                  <span className="text-sm text-trust-green font-medium">Available Now</span>
                </div>
              </div>
            </div>

            {/* Endorsements */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Community Endorsements</h3>
              <div className="space-y-3">
                {[
                  { name: "Design Guild Mumbai", type: "Community" },
                  { name: "IIT Bombay Alumni", type: "Education" },
                  { name: "StartupMH Network", type: "Professional" },
                ].map((endorsement) => (
                  <div key={endorsement.name} className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-trust-gold" />
                    <div>
                      <div className="text-sm text-foreground">{endorsement.name}</div>
                      <div className="text-xs text-muted-foreground">{endorsement.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Social Proof</h3>
              <div className="space-y-2">
                {[
                  { label: "LinkedIn", href: "#" },
                  { label: "Dribbble", href: "#" },
                  { label: "GitHub", href: "#" },
                ].map((link) => (
                  <a key={link.label} href={link.href} className="flex items-center gap-2 text-sm text-primary hover:text-brand-glow transition-colors">
                    <ExternalLink className="h-3 w-3" />{link.label}
                  </a>
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
