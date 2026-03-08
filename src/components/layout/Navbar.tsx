import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Menu, X, Search, ChevronDown, LayoutDashboard, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Find Talent", href: "/browse" },
  { label: "Find Jobs", href: "/jobs" },
  { label: "Post a Job", href: "/post-job" },
  { label: "Community", href: "/community" },
];

const dashboardLinks = [
  { label: "Freelancer Dashboard", href: "/dashboard/freelancer", icon: LayoutDashboard },
  { label: "Client Dashboard", href: "/dashboard/client", icon: LayoutDashboard },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Contracts", href: "/contracts", icon: FileText },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-foreground border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-display font-bold text-background">
            Local<span className="text-primary">SkillHub</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.href
                  ? "text-background bg-white/10"
                  : "text-background/60 hover:text-background hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Dashboard Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                location.pathname.startsWith("/dashboard") || location.pathname === "/messages" || location.pathname === "/contracts"
                  ? "text-background bg-white/10"
                  : "text-background/60 hover:text-background hover:bg-white/5"
              }`}
            >
              Dashboard <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${dashboardOpen ? "rotate-180" : ""}`} />
            </button>
            {dashboardOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDashboardOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-foreground border border-white/10 rounded-lg p-1.5 z-50 shadow-2xl">
                  {dashboardLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setDashboardOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors duration-200 ${
                        location.pathname === link.href
                          ? "text-background bg-white/10"
                          : "text-background/60 hover:text-background hover:bg-white/5"
                      }`}
                    >
                      <link.icon className="h-4 w-4" /> {link.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-background/60 hover:text-background hover:bg-white/5">
            <Search className="h-4.5 w-4.5" />
          </Button>
          <Link to="/login">
            <Button variant="ghost" className="text-background/60 hover:text-background hover:bg-white/5 text-sm">
              Log In
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 rounded-full px-5">
              Sign Up Free
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-background"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-foreground">
          <div className="container py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-4 py-3 rounded-md text-sm font-medium text-background/60 hover:text-background hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2">
              <span className="px-4 py-2 text-[10px] uppercase tracking-wider text-background/40 font-semibold">Dashboard</span>
              {dashboardLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium text-background/60 hover:text-background hover:bg-white/5 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <link.icon className="h-4 w-4" /> {link.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-white/20 text-background bg-transparent hover:bg-white/5">Log In</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 rounded-full">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
