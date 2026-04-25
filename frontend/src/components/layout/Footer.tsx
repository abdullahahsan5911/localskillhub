import { Link } from "react-router-dom";
import { FiTwitter, FiLinkedin, FiGithub, FiInstagram } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { footerSections } from "@/data/footerContent";

const socialLinks = [
  { icon: FiTwitter, href: "https://x.com", label: "X" },
  { icon: FiLinkedin, href: "https://www.linkedin.com", label: "LinkedIn" },
  { icon: FiInstagram, href: "https://www.instagram.com", label: "Instagram" },
  { icon: FiGithub, href: "https://github.com", label: "GitHub" },
];

const Footer = () => {
  return (
    <footer className="border-t border-zinc-800 bg-[#1a1a1a] text-zinc-100">
      <div className="w-full px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
             
              <span className="text-lg sm:text-2xl font-bold text-blue-500">
                LocalSkillHub
              </span>
            </Link>
            <p className="mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed text-zinc-400">
              Connecting local talent with local opportunities. Trust-verified, community-driven.
            </p>
            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                >
                  <Icon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 sm:mb-4 text-xs sm:text-sm font-semibold text-white">{section.title}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-xs sm:text-sm text-zinc-400 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 md:mt-12 flex flex-col items-center justify-between gap-3 sm:gap-4 border-t border-zinc-800 pt-6 sm:pt-8 md:flex-row">
          <p className="text-[10px] sm:text-xs text-zinc-500 text-center md:text-left">
            © 2026 LocalSkillHub. All rights reserved.
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-500 text-center md:text-right">
            Built with trust, for local communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
