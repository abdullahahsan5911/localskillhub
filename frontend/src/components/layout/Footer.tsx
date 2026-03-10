import { Link } from "react-router-dom";
import { FiTwitter, FiLinkedin, FiGithub, FiInstagram } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";

const footerSections = [
  {
    title: "For Freelancers",
    links: [
      { label: "Find Jobs", href: "/jobs" },
      { label: "Create Profile", href: "/signup" },
      { label: "Skill Challenges", href: "#" },
      { label: "Community", href: "/community" },
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
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <HiOutlineLocationMarker className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                LocalSkillHub
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Connecting local talent with local opportunities. Trust-verified, community-driven.
            </p>
            <div className="flex gap-2">
              {[FiTwitter, FiLinkedin, FiInstagram, FiGithub].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-300 transition-colors duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 LocalSkillHub. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Built with trust, for local communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
