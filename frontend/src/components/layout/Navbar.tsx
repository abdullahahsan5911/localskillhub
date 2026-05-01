import { Fragment, useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiSearch,
    FiMessageSquare,
    FiFileText,
    FiMenu,
    FiX,
    FiUser,
    FiSettings,
    FiLogOut,
    FiShield,
    FiChevronRight,
    FiChevronDown,
    FiMail,
    FiExternalLink,
} from "react-icons/fi";
import { AlertCircle, Plus } from "lucide-react";
import { LiaClipboardListSolid } from "react-icons/lia";
import { SlMagnifier } from "react-icons/sl";
import { CiCirclePlus } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
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
import UserAvatar from "@/components/Avatar";

const FALLBACK_AVATAR = "/assets/fallbackavatar.jpg";

const resolveNavbarAvatar = (value: any) => {
    if (!value) return FALLBACK_AVATAR;

    const candidates = [
        typeof value === "string" ? value : undefined,
        value?.avatar,
        value?.avatarUrl,
        value?.photoURL,
        value?.photoUrl,
        value?.picture,
        value?.image,
        value?.imageUrl,
    ];

    for (const candidate of candidates) {
        const normalized = String(candidate || "").trim();
        if (!normalized) continue;
        if (normalized === "null" || normalized === "undefined") continue;
        if (/ui-avatars\.com/i.test(normalized)) continue;
        return normalized;
    }

    return FALLBACK_AVATAR;
};

const navLinks = [
    { label: "Explore", href: "/" },
    { label: "Jobs", href: "/jobs" },
    { label: "Map", href: "/map" },
    { label: "Communities", href: "/communities" },
];

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isHireDropdownOpen, setIsHireDropdownOpen] = useState(false);
    const hireDropdownCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isPointerOverHireTriggerRef = useRef(false);
    const isPointerOverHireContentRef = useRef(false);

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
            const convs: any[] =
                ((res as any)?.data?.conversations as any[]) ||
                ((res as any)?.data?.data?.conversations as any[]) ||
                [];
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

        const socket = (window as any).__socket;
        const onNewMessage = () => fetchConversations();
        if (socket) {
            socket.on("newMessage", onNewMessage);
        }

        return () => {
            clearInterval(interval);
            window.removeEventListener("conversationsUpdated", handler);
            if (socket) {
                socket.off("newMessage", onNewMessage);
            }
        };
    }, [isAuthenticated, user, fetchConversations]);

    const visibleNavLinks = user?.role === "admin"
        ? []
        : isAuthenticated && user?.role === "freelancer"
            ? navLinks.filter((link) => link.href !== "/post-job")
            : navLinks;

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const getDashboardLink = () => {
        if (!user) return "/";
        if (user.role === "admin") return "/admin";
        if (user.role === "client") {
            if (user.accountType === "company") return "/company-dashboard";
            return "/dashboard/client";
        }
        if (user.role === "freelancer") return "/dashboard/freelancer";
        return "/";
    };

    const getMyJobsLink = () => {
        if (!user) return "/dashboard/client?tab=my-jobs";
        if (user.role === "client") {
            if (user.accountType === "company") return "/company-dashboard?tab=my-jobs";
            return "/dashboard/client?tab=my-jobs";
        }
        if (user.role === "freelancer") {
            return "/dashboard/freelancer?tab=find-jobs";
        }
        return "/dashboard/client?tab=my-jobs";
    };

    const getDashboardAction = () => {
        if (!user) return { label: "Dashboard", href: "/", isOnboarding: false };
        if (user.role === "admin") {
            return { label: "Admin Panel", href: "/admin", isOnboarding: false };
        }
        const isOnboardingComplete = user.onboardingCompleted;
        const isOnboardingSkipped = (user as any).onboarding?.skipped;
        if (!isOnboardingComplete && !isOnboardingSkipped) {
            return { label: "Complete Profile", href: "/onboarding", isOnboarding: true };
        }
        return { label: "Dashboard", href: getDashboardLink(), isOnboarding: false };
    };

    // For company users, don't show Create New Job in navbar - they should use company dashboard
    const canCreateJob = isAuthenticated && user?.role === "client" && user?.accountType !== "company";
    const canManageCommunities = isAuthenticated && !!user && user.role !== "admin";
    const dashboardAction = getDashboardAction();

    const isRouteActive = (targetHref: string) => {
        const [targetPath] = targetHref.split("?");
        if (!targetPath) return false;
        if (targetPath === "/") return location.pathname === "/";
        return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
    };

    const profileDropdownItemClass = (isActive: boolean) =>
        `px-4 py-2.5 text-[16px] font-semibold transition-colors  ${
            isActive
                ? "bg-blue-700 rounded-full text-white"
                : "rounded-full  hover:underline hover:underline-offset-4 hover:decoration-blue-700 hover:text-blue-700  "
        }`;

    const hireMenuItems = [
        { label: "My Jobs", href: getMyJobsLink(), icon: LiaClipboardListSolid },
        { label: "Freelancers", href: "/browse", icon: SlMagnifier },
        ...(canCreateJob ? [{ label: "Create New Job", href: "/post-job", icon: CiCirclePlus }] : []),
    ];

    const isHireActive =
        location.pathname === "/post-job" ||
        location.pathname === "/browse" ||
        location.search.includes("tab=my-jobs");

    const openHireDropdown = () => {
        if (hireDropdownCloseTimeoutRef.current) {
            clearTimeout(hireDropdownCloseTimeoutRef.current);
            hireDropdownCloseTimeoutRef.current = null;
        }
        setIsHireDropdownOpen(true);
    };

    const closeHireDropdownWithDelay = () => {
        if (hireDropdownCloseTimeoutRef.current) {
            clearTimeout(hireDropdownCloseTimeoutRef.current);
        }
        hireDropdownCloseTimeoutRef.current = setTimeout(() => {
            if (!isPointerOverHireTriggerRef.current && !isPointerOverHireContentRef.current) {
                setIsHireDropdownOpen(false);
            }
            hireDropdownCloseTimeoutRef.current = null;
        }, 180);
    };

    const handleHireTriggerEnter = () => {
        isPointerOverHireTriggerRef.current = true;
        openHireDropdown();
    };

    const handleHireTriggerLeave = () => {
        isPointerOverHireTriggerRef.current = false;
        closeHireDropdownWithDelay();
    };

    const handleHireContentEnter = () => {
        isPointerOverHireContentRef.current = true;
        openHireDropdown();
    };

    const handleHireContentLeave = () => {
        isPointerOverHireContentRef.current = false;
        closeHireDropdownWithDelay();
    };

    useEffect(() => {
        return () => {
            if (hireDropdownCloseTimeoutRef.current) {
                clearTimeout(hireDropdownCloseTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (!mobileOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [mobileOpen]);

    return (
        <nav
            className="sticky top-0 left-0 right-0 z-[2000] border-b border-gray-200 bg-white/95 backdrop-blur-sm"
            style={{ fontFamily: "Inter, Space Grotesk, sans-serif" }}
        >
            <div className="w-full px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="min-w-0 flex items-center gap-2 pr-2">
                        <span className="truncate text-base sm:text-lg font-bold text-gray-900">LocalSkillHub</span>
                    </Link>

                    <div className="hidden items-center gap-1 md:flex">
                        {visibleNavLinks.map((link) => (
                            <Fragment key={link.href}>
                                <Link
                                    to={link.href}
                                    className="group relative px-4 py-2 text-[15px] font-semibold text-gray-700 hover:text-black"
                                >
                                    {link.label}
                                    <span
                                        className={`absolute left-0 -bottom-1 h-[2px] w-full origin-left bg-black transition-transform duration-300 ${location.pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                                            }`}
                                    />
                                </Link>

                                {link.label === "Jobs" && user?.role !== "admin" && (
                                    <DropdownMenu
                                        key="hire-desktop-dropdown"
                                        open={isHireDropdownOpen}
                                        onOpenChange={setIsHireDropdownOpen}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="group relative flex items-center gap-1.5 border border-transparent bg-transparent px-4 py-2 text-[15px] font-semibold text-gray-700 outline-none hover:text-black focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                                                onMouseEnter={handleHireTriggerEnter}
                                                onMouseLeave={handleHireTriggerLeave}
                                            >
                                                <span>Hire</span>
                                                <FiChevronDown className="h-4 w-4" />
                                                <span
                                                    className={`absolute left-0 -bottom-1 h-[2px] w-full origin-left bg-black transition-transform duration-300 ${isHireActive || isHireDropdownOpen
                                                        ? "scale-x-100"
                                                        : "scale-x-0 group-hover:scale-x-100"
                                                        }`}
                                                />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="center"
                                            className="z-[2100] w-56"
                                            onMouseEnter={handleHireContentEnter}
                                            onMouseLeave={handleHireContentLeave}
                                        >
                                            {hireMenuItems.map((item) => (
                                                <DropdownMenuItem
                                                    key={item.href}
                                                    onClick={() => navigate(item.href)}
                                                    className="flex items-center justify-between text-gray-700 hover:text-blue-700 focus:text-blue-700"
                                                >
                                                    <span className="flex items-center">
                                                        <item.icon className="mr-2 h-4 w-4 text-current" />
                                                        {item.label}
                                                    </span>
                                                    <FiChevronRight className="h-4 w-4 text-current opacity-80" />
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </Fragment>
                        ))}
                    </div>

                    <div className="hidden items-center gap-2 md:flex sm:gap-3">
                        {!isAuthenticated || !user ? (
                            <button className="rounded-lg p-2 transition-colors hover:bg-gray-100" type="button">
                                <FiSearch className="h-5 w-5 text-gray-600" />
                            </button>
                        ) : null}

                      
                        {isAuthenticated && user ? (
                            <>


                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="relative rounded-full p-2 text-gray-800 transition-colors hover:bg-gray-100"
                                            type="button"
                                            aria-label="Messages"
                                        >
                                            <FiMail className="h-5 w-5" />
                                            {unreadCount > 0 && (
                                                <>
                                                    <span className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-red-500/60 animate-ping" />
                                                    <span className="absolute -right-0.5 -top-0.5 z-20 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white shadow-sm" />
                                                </>
                                            )}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-[2100] w-80 max-w-[90vw] p-0 sm:w-80">
                                        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                                            <span className="text-sm font-semibold text-gray-900">Messages</span>
                                            {unreadCount > 0 && (
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                                                    {unreadCount > 9 ? "9+ new" : `${unreadCount} new`}
                                                </span>
                                            )}
                                        </div>
                                        <div className={conversations.length > 6 ? "max-h-80 overflow-y-auto" : "overflow-visible"}>
                                            {loadingConvs ? (
                                                <div className="px-3 py-4 text-xs text-gray-500">Loading conversations...</div>
                                            ) : conversations.length === 0 ? (
                                                <div className="px-3 py-4 text-xs text-gray-500">No messages yet</div>
                                            ) : (
                                                conversations.map((conv) => (
                                                    <button
                                                        type="button"
                                                        key={conv._id}
                                                        onClick={() => navigate(`${getDashboardLink()}?tab=messages`)}
                                                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                                                    >
                                                        <img
                                                            src={resolveNavbarAvatar(conv.otherUser)}
                                                            alt={conv.otherUser?.name || "User"}
                                                            className="h-8 w-8 rounded-full object-cover"
                                                            onError={(e) => {
                                                                if (!e.currentTarget.src.includes(FALLBACK_AVATAR)) {
                                                                    e.currentTarget.src = FALLBACK_AVATAR;
                                                                }
                                                            }}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="truncate font-medium text-gray-900">
                                                                    {conv.otherUser?.name || "User"}
                                                                </span>
                                                                {conv.unreadCount > 0 && (
                                                                    <span className="ml-2 text-[11px] font-semibold text-blue-600">
                                                                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="truncate text-xs text-gray-500">
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
                                            className="w-full border-t border-gray-100 px-3 py-2.5 text-left text-xs font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            View all messages
                                        </button>
                                    </DropdownMenuContent>
                                </DropdownMenu>



                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-gray-100"
                                            type="button"
                                        >
                                            <UserAvatar src={resolveNavbarAvatar(user)} name={user.name} size={36} className="ring-1 ring-gray-200" />
                                            <FiChevronDown className="h-4 w-4 text-gray-600" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-[2100] w-[345px] rounded-2xl border border-gray-300 p-0 shadow-xl">
                                        <DropdownMenuLabel className="px-0 py-0">
                                            <div className="px-6 pb-4 pt-6 text-center">
                                                <div className="mx-auto mb-3 w-fit">
                                                    <UserAvatar src={resolveNavbarAvatar(user)} name={user.name} size={84} className="ring-1 ring-gray-200" />
                                                </div>
                                                <p className="text-[26px] font- bold tracking-tight text-gray-900">{user.name}</p>
                                                <p className="mt-0.5 truncate text-[15px] font-medium text-gray-500">{user.email}</p>

                                            </div>
                                        </DropdownMenuLabel>

                                        <div className=" px-6 py-3 border-t border-gray-300">
                                            <p className="text-[14px] font-medium text-gray-500">Viewing as: Creative</p>
                                        </div>



                                        <DropdownMenuSeparator className="mx-0 my-0 bg-gray-200" />

                                        <div className="px-2 py-2  border-t border-gray-300">
                                            <DropdownMenuItem
                                                onClick={() => navigate(dashboardAction.href)}
                                                className={profileDropdownItemClass(isRouteActive(dashboardAction.href))}
                                            >
                                                {user.role === "admin" ? (
                                                    <FiShield className="mr-3 h-5 w-5 text-emerald-600" />
                                                ) : dashboardAction.isOnboarding ? (
                                                    <AlertCircle className="mr-3 h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <FiUser className="mr-3 h-5 w-5" />
                                                )}
                                                {dashboardAction.label}
                                            </DropdownMenuItem>

                                            {user.role !== "admin" && (
                                                <DropdownMenuItem
                                                    onClick={() => navigate("/communities/manage?showCreate=1")}
                                                    className={profileDropdownItemClass(isRouteActive("/communities/manage"))}
                                                >
                                                    <Plus className="mr-3 h-5 w-5" />
                                                    Create Community
                                                </DropdownMenuItem>
                                            )}

                                            {!dashboardAction.isOnboarding && user.role !== "admin" && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate("/profile")}
                                                        className={profileDropdownItemClass(isRouteActive("/profile"))}
                                                    >
                                                        LocalSkillHub Profile
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => navigate("/settings")}
                                                        className={profileDropdownItemClass(isRouteActive("/settings"))}
                                                    >
                                                        {/* <FiSettings className="mr-3 h-5 w-5" /> */}
                                                        Settings
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </div>

                                        <DropdownMenuSeparator className="mx-0 my-0 bg-gray-200" />

                                        <div className="px-2 py-2">


                                            <DropdownMenuItem
                                                className={profileDropdownItemClass(isRouteActive("/help-center"))}
                                                onClick={() => navigate("/help-center")}
                                            >
                                                Help
                                                <FiExternalLink className="ml-auto h-4 w-4 text-gray-500" />
                                            </DropdownMenuItem>
                                        </div>

                                        <DropdownMenuSeparator className="mx-0 my-0 bg-gray-200" />

                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="px-6 py-3 text-[16px] font-semibold text-gray-900 hover:text-red-500"
                                        >
                                            <FiLogOut className="mr-3 h-5 w-5" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                        Log In
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button className="rounded-full bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700">
                                        Sign Up Free
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 md:hidden shrink-0">
                        {isAuthenticated && user ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => navigate(`${getDashboardLink()}?tab=messages`)}
                                    className="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
                                >
                                    <FiMessageSquare className="h-5 w-5 text-gray-600" />
                                    {unreadCount > 0 && (
                                        <>
                                            <span className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-red-500/60 animate-ping" />
                                            <span className="absolute -right-0.5 -top-0.5 z-20 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white shadow-sm" />
                                        </>
                                    )}
                                </button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="relative rounded-full p-0.5 transition-all hover:ring-2 hover:ring-blue-200"
                                            type="button"
                                        >
                                            <UserAvatar src={resolveNavbarAvatar(user)} name={user.name} size={32} className="ring-1 ring-gray-200" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-[2100] w-60">
                                        <div className="border-b border-gray-100 px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar src={resolveNavbarAvatar(user)} name={user.name} size={40} className="ring-1 ring-gray-200" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                                                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {(() => {
                                            const dashboardAction = getDashboardAction();
                                            return (
                                                <DropdownMenuItem
                                                    onClick={() => navigate(dashboardAction.href)}
                                                    className={dashboardAction.isOnboarding ? "mt-1 bg-blue-50" : "mt-1"}
                                                >
                                                    {user.role === "admin" ? (
                                                        <FiShield className="mr-2 h-4 w-4 text-emerald-600" />
                                                    ) : dashboardAction.isOnboarding ? (
                                                        <AlertCircle className="mr-2 h-4 w-4 text-blue-600" />
                                                    ) : (
                                                        <FiUser className="mr-2 h-4 w-4 text-gray-500" />
                                                    )}
                                                    <span className={dashboardAction.isOnboarding ? "font-medium text-blue-700" : "font-medium"}>
                                                        {dashboardAction.label}
                                                    </span>
                                                </DropdownMenuItem>
                                            );
                                        })()}

                                        <DropdownMenuItem onClick={() => navigate(`${getDashboardLink()}?tab=messages`)}>
                                            <div className="relative mr-2">
                                                <FiMessageSquare className="h-4 w-4 text-gray-500" />
                                                {unreadCount > 0 && (
                                                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                                                )}
                                            </div>
                                            <span className="font-medium">Messages</span>
                                            {unreadCount > 0 && (
                                                <span className="ml-auto rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600">
                                                    {unreadCount > 9 ? "9+" : unreadCount}
                                                </span>
                                            )}
                                        </DropdownMenuItem>

                                        {user.role !== "admin" && (
                                            <DropdownMenuItem onClick={() => navigate("/communities/manage?showCreate=1")}
                                            >
                                                <CiCirclePlus className="mr-2 h-4 w-4 text-gray-500" />
                                                <span className="font-medium">Create Community</span>
                                            </DropdownMenuItem>
                                        )}

                                        {!getDashboardAction().isOnboarding && user.role !== "admin" && (
                                            <>
                                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                                    <FiUser className="mr-2 h-4 w-4 text-gray-500" />
                                                    <span className="font-medium">Profile</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        const dashboardPath = user.role === "client"
                                                            ? (user.accountType === "company" ? "/company-dashboard" : "/dashboard/client")
                                                            : "/dashboard/freelancer";
                                                        navigate(`${dashboardPath}?tab=contracts`);
                                                    }}
                                                >
                                                    <FiFileText className="mr-2 h-4 w-4 text-gray-500" />
                                                    <span className="font-medium">Contracts</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate("/settings")}>
                                                    <FiSettings className="mr-2 h-4 w-4 text-gray-500" />
                                                    <span className="font-medium">Settings</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                            <FiLogOut className="mr-2 h-4 w-4" />
                                            <span className="font-medium">Log Out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : null}

                        <button
                            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle navigation"
                            type="button"
                        >
                            {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {mobileOpen && (
                <div className="border-t border-gray-100 bg-white shadow-lg md:hidden">
                    <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-3 py-3">
                        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                            Navigation
                        </p>
                        <div className="space-y-0.5">
                            {visibleNavLinks.map((link) => {
                                const isActive = location.pathname === link.href;
                                return (
                                    <div key={link.href}>
                                        <Link
                                            to={link.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                        >
                                            <span>{link.label}</span>
                                            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                                        </Link>

                                        {link.label === "Jobs" && user?.role !== "admin" && (
                                            <div className="mb-1 mt-1">
                                                {hireMenuItems.map((item) => {
                                                    const isHireItemActive =
                                                        location.pathname === item.href ||
                                                        (item.href.includes("tab=my-jobs") && location.search.includes("tab=my-jobs"));
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            to={item.href}
                                                            onClick={() => setMobileOpen(false)}
                                                            className={`ml-3 flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isHireItemActive
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                                }`}
                                                        >
                                                            <span className="flex items-center">
                                                                <item.icon className="mr-2 h-4 w-4" />
                                                                {item.label}
                                                            </span>
                                                            {isHireItemActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {(!isAuthenticated || !user) && (
                            <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                                    <Button variant="outline" className="w-full text-sm">Log In</Button>
                                </Link>
                                <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                                    <Button className="w-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
