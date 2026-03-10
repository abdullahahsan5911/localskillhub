import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiBriefcase, FiUsers, FiMessageSquare, FiFileText, FiMenu, FiX } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Explore", href: "/browse" },
  { label: "Jobs", href: "/jobs" },
  { label: "Hire", href: "/post-job" },
  { label: "Community", href: "/community" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <HiOutlineLocationMarker className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              LocalSkillHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.href
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FiSearch className="h-5 w-5 text-gray-600" />
            </button>
            <Link to="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 text-sm font-medium">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 rounded-full px-6">
                Sign Up Free
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-4 border-t border-gray-200 mt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Log In</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-blue-600 text-white font-semibold hover:bg-blue-700">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
