import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiSearch, FiBriefcase, FiUsers, FiMessageSquare, FiFileText, FiMenu, FiX, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { label: "Explore", href: "/browse" },
  { label: "Jobs", href: "/jobs" },
  { label: "Hire", href: "/post-job" },
  { label: "Map", href: "/map" },
  { label: "Community", href: "/community" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConvs, setLoadingConvs] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      setLoadingConvs(true);
      const res = await api.getConversations();
      const convs: any[] = (res.data as any)?.conversations || [];
      setConversations(convs);
      setUnreadCount(convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
    } catch {
      // ignore errors in navbar badge
    } finally {
      setLoadingConvs(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    const handler = () => fetchConversations();
    window.addEventListener("conversationsUpdated", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("conversationsUpdated", handler);
    };
  }, [isAuthenticated, user, fetchConversations]);

  const visibleNavLinks = isAuthenticated && user?.role === "freelancer"
    ? navLinks.filter((link) => link.href !== "/post-job")
    : navLinks;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "client") return "/dashboard/client";
    if (user.role === "freelancer") return "/dashboard/freelancer";
    if (user.role === "both") return "/dashboard/both";
    return "/";
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // const isJobsPage = location.pathname.startsWith("/jobs");

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="w-full px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">

            <span className="text-lg font-bold text-gray-900">
              LocalSkillHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-black group "
              >
                {link.label}

                <span
                  className={`absolute left-0 -bottom-1 h-[2px] w-full bg-black origin-left transition-transform duration-300 ${location.pathname === link.href
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                    }`}
                />
              </Link>

            ))}
          </div>


          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated || !user ? (
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <FiSearch className="h-5 w-5 text-gray-600" />
              </button>
            ) : null}

            {isAuthenticated && user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                      type="button"
                    >
                      <FiMessageSquare className="h-5 w-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Messages</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {unreadCount > 9 ? "9+ new" : `${unreadCount} new`}
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingConvs ? (
                        <div className="px-3 py-4 text-xs text-gray-500">Loading conversations…</div>
                      ) : conversations.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-gray-500">No messages yet</div>
                      ) : (
                        conversations.slice(0, 5).map((conv) => (
                          <button
                            type="button"
                            key={conv._id}
                            onClick={() => navigate(`${getDashboardLink()}?tab=messages`)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-left text-sm"
                          >
                            {conv.otherUser?.avatar ? (
                              <img
                                src={conv.otherUser.avatar}
                                alt={conv.otherUser.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                {(conv.otherUser?.name || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-gray-900 truncate">{conv.otherUser?.name || "User"}</span>
                                {conv.unreadCount > 0 && (
                                  <span className="ml-2 text-[11px] text-blue-600 font-semibold">
                                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {conv.lastMessage?.content || "Start a conversation"}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`${getDashboardLink()}?tab=messages`)}
                      className="w-full text-xs text-blue-600 hover:text-blue-700 px-3 py-2.5 border-t border-gray-100 text-left font-medium"
                    >
                      View all messages
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-xs text-gray-500 font-normal">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                      <FiUser className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/contracts")}>
                      <FiFileText className="mr-2 h-4 w-4" />
                      <span>Contracts</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <FiLogOut className="mr-2 h-4 w-4" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
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
              </>
            )}
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
            {visibleNavLinks.map((link) => (
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
