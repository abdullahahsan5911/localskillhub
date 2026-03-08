import { Link } from "react-router-dom";
import { MapPin, Github, Twitter, Linkedin } from "lucide-react";

const footerSections = [
  {
    title: "For Freelancers",
    links: [
      { label: "Find Jobs", href: "/jobs" },
      { label: "Create Profile", href: "/signup" },
      { label: "Skill Challenges", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "For Clients",
    links: [
      { label: "Post a Job", href: "/post-job" },
      { label: "Browse Talent", href: "/browse" },
      { label: "How It Works", href: "#" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Trust & Safety", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-display font-bold text-foreground">
                Local<span className="text-primary">SkillHub</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Connecting local talent with local opportunities. Trust-verified, community-driven.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-primary hover:bg-brand-muted transition-colors duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 LocalSkillHub. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with trust, for local communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
