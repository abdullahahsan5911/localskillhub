import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Menu, X, Search, Bell, User, ChevronDown, LayoutDashboard, MessageSquare, FileText, Users } from "lucide-react";
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand shadow-lg shadow-primary/20">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">
            Local<span className="text-primary">SkillHub</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? "text-primary bg-brand-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Dashboard Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith("/dashboard") || location.pathname === "/messages" || location.pathname === "/contracts"
                  ? "text-primary bg-brand-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              Dashboard <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dashboardOpen ? "rotate-180" : ""}`} />
            </button>
            {dashboardOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDashboardOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 glass-card p-2 z-50 shadow-xl shadow-background/50">
                  {dashboardLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setDashboardOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        location.pathname === link.href
                          ? "text-primary bg-brand-muted"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
          </Button>
          <Link to="/messages">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Log In
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="gradient-brand text-primary-foreground font-semibold glow-sm">
              Sign Up Free
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border/30 pt-2 mt-2">
              <span className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dashboard</span>
              {dashboardLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  <link.icon className="h-4 w-4" /> {link.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-3 pt-4 border-t border-border/30 mt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-border text-foreground">Log In</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full gradient-brand text-primary-foreground font-semibold">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
