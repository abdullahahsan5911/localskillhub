import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Star, UserCheck, UserPlus } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface UserHoverCardData {
    id: string;
    name: string;
    avatarUrl?: string;
    projectImages?: string[];
    role?: string;
    city?: string;
    state?: string;
    country?: string;
    rating?: number;
    ratingCount?: number;
    completedJobs?: number;
    followers?: number;
    profileViews?: number;
}

interface UserHoverCardProps {
    user: UserHoverCardData;
    children: ReactNode;
}

const formatStat = (value?: number) => {
    if (value === undefined || value === null) return "0";
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
};

export const UserHoverCard = ({ user, children }: UserHoverCardProps) => {
    const navigate = useNavigate();
    const { isAuthenticated, user: currentUser } = useAuth();
    const [fetchedUser, setFetchedUser] = useState<UserHoverCardData | null>(null);
    const [open, setOpen] = useState(false);
    const [followerCount, setFollowerCount] = useState<number>(user.followers ?? 0);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const displayUser: UserHoverCardData = fetchedUser || user;

    const isOwnProfile = currentUser?._id === displayUser.id;

    const initials = displayUser.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U";

    const locationParts = [displayUser.city, displayUser.state, displayUser.country].filter(Boolean);
    const location = locationParts.join(", ");

    // Only ever show up to 3 project images in the header
    const projectImages = (displayUser.projectImages ?? []).slice(0, 3);

    const handleContact = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!displayUser.id) return;

        // If not logged in, send to login
        if (!currentUser) {
            navigate("/login");
            return;
        }

        // Logged-in users go to their dashboard messages tab
        let dashboardBase = "/";
        if (currentUser?.role === "client") dashboardBase = "/dashboard/client";
        else if (currentUser?.role === "freelancer") dashboardBase = "/dashboard/freelancer";
        else if (currentUser?.role === "both") dashboardBase = "/dashboard/both";

        navigate(`${dashboardBase}?tab=messages&userId=${displayUser.id}`);
    };

    const handleFollow = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();

        if (!displayUser.id) return;

        if (!currentUser) {
            navigate("/login");
            return;
        }

        setFollowLoading(true);
        try {
            if (following) {
                await api.unfollowUser(displayUser.id);
                setFollowing(false);
                setFollowerCount((prev) => Math.max((prev ?? 1) - 1, 0));
            } else {
                await api.followUser(displayUser.id);
                setFollowing(true);
                setFollowerCount((prev) => (prev ?? 0) + 1);
            }
        } catch (error) {
            console.error("Failed to toggle follow state", error);
        } finally {
            setFollowLoading(false);
        }
    };

    useEffect(() => {
        setFollowerCount(displayUser.followers ?? 0);
    }, [displayUser.followers]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!displayUser.id || !open) return;

            try {
                const [userRes, repRes] = await Promise.all([
                    api.getUser(displayUser.id),
                    api.getReputation(displayUser.id),
                ]);

                const backendUser: any = (userRes as any).data?.user;
                const reputation: any = (repRes as any).data;

                if (backendUser) {
                    const followersArray: string[] = Array.isArray(backendUser.followers)
                        ? backendUser.followers
                        : [];
                    const initialFollowerCount = followersArray.length;
                    const isCurrentlyFollowing = currentUser?._id
                        ? followersArray.includes(currentUser._id)
                        : false;

                    const merged: UserHoverCardData = {
                        ...displayUser,
                        id: backendUser._id || displayUser.id,
                        name: backendUser.name || displayUser.name,
                        avatarUrl: backendUser.avatar || displayUser.avatarUrl,
                        role: backendUser.role || displayUser.role,
                        city: backendUser.location?.city ?? displayUser.city,
                        state: backendUser.location?.state ?? displayUser.state,
                        country: backendUser.location?.country ?? displayUser.country,
                        followers: initialFollowerCount,
                        completedJobs: reputation?.stats?.totalJobsCompleted ?? displayUser.completedJobs,
                        profileViews: reputation?.stats?.profileViews ?? displayUser.profileViews,
                    };

                    setFetchedUser(merged);
                    setFollowerCount(initialFollowerCount);
                    setFollowing(isCurrentlyFollowing);
                }
            } catch (error) {
                console.error("Failed to fetch user hover data", error);
            }
        };

        fetchUserData();
    }, [open, displayUser.id, displayUser.city, displayUser.state, displayUser.country, displayUser.completedJobs, displayUser.profileViews, displayUser.name, displayUser.avatarUrl, displayUser.role, currentUser]);

    return (
        <HoverCardPrimitive.Root openDelay={150} closeDelay={150} open={open} onOpenChange={setOpen}>
            <HoverCardPrimitive.Trigger asChild>
                {/* Trigger is provided by parent, e.g. avatar or name */}
                <span className="inline-flex items-center gap-2 cursor-pointer">
                    {children}
                </span>
            </HoverCardPrimitive.Trigger>
            <HoverCardPrimitive.Content
                sideOffset={8}
                className="z-[9999] w-80 p-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
            >
                {/* Header banner + avatar */}
                <div className="relative h-20 w-full overflow-hidden">
                    {/* Background based on project images */}
                    {projectImages.length === 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500" />
                    )}

                    {projectImages.length === 1 && (
                        <img        
                            src={projectImages[0]}
                            alt="Project preview"
                            className="absolute inset-0 h-auto w-full object-cover "
                        />
                    )}

                    {projectImages.length === 2 && (
                        <div className="absolute inset-0 flex">
                            {projectImages.slice(0, 2).map((src, index) => (
                                <img
                                    key={index}
                                    src={src}
                                    alt="Project preview"
                                    className="h-auto w-1/2 object-cover"
                                />
                            ))}
                        </div>
                    )}

                    {projectImages.length >= 3 && (
                        <div className="absolute inset-0 grid grid-cols-3">
                            {projectImages.slice(0, 3).map((src, index) => (
                                <img
                                    key={index}
                                    src={src}
                                    alt="Project preview"
                                    className="h-full w-full object-cover"
                                />
                            ))}
                        </div>
                    )}

                    {/* Subtle overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                    <div className="  flex items-center ">

                        <div className="mt-6">

                            <p className="text-sm font-semibold text-gray-900 leading-tight bg-white/80 rounded-full px-3 py-1 inline-flex items-center gap-2 shadow-sm">
                                <span>{displayUser.name}</span>
                            </p>
                            {location && (
                                <p className="mt-1 text-xs text-gray-200 flex items-center gap-1">
                                    <span>{location}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="absolute left-32 right-left-32 flex top-10">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                        <AvatarImage src={displayUser.avatarUrl} alt={displayUser.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </div>
                {/* Body */}
                <div className="pt-10 px-4 pb-4 text-xs text-gray-600 space-y-3">
                    {displayUser.role && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                            {displayUser.role}
                        </p>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatStat(displayUser.completedJobs)}
                            </p>
                            <p className="text-[11px] text-gray-500">Jobs</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatStat(followerCount)}
                            </p>
                            <p className="text-[11px] text-gray-500">Followers</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatStat(displayUser.profileViews)}
                            </p>
                            <p className="text-[11px] text-gray-500">Views</p>
                        </div>
                    </div>

                    {/* Rating */}
                    {displayUser.rating !== undefined && (
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-700">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                    {displayUser.rating?.toFixed(1)}
                                </span>
                                {displayUser.ratingCount ? (
                                    <span className="text-gray-400">({displayUser.ratingCount})</span>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1 rounded-full bg-gray-900 text-white   h-8 text-xs"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                if (!displayUser.id) return;

                                if (displayUser.role === "client") {
                                    navigate(`/client/${displayUser.id}`);
                                } else {
                                    navigate(`/profile/${displayUser.id}`);
                                }
                            }}
                        >
                            View profile
                        </Button>
                        {!isOwnProfile && (
                            <Button
                                onClick={handleFollow}
                                disabled={followLoading}
                                variant={following ? "outline" : "default"}
                                size="sm"
                                className={`flex-1 rounded-full h-8 text-xs gap-1 ${
                                    following
                                        ? "border-blue-300 text-blue-600 bg-white hover:bg-blue-600"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                {followLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : following ? (
                                    <>
                                        <UserCheck className="w-3 h-3" />
                                        <span>Following</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-3 h-3" />
                                        <span>Follow</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    <div>
                        <Button
                            onClick={handleContact}
                            variant="outline"
                            size="sm"
                            className="flex flex-row w-full rounded-full   h-8 text-xs"

                        >
                            Message
                        </Button>
                    </div>
                </div>
            {/* </HoverCardContent> */}
            </HoverCardPrimitive.Content>
        </HoverCardPrimitive.Root>
    );
};

export default UserHoverCard;
