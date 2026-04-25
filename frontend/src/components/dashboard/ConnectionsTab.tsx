import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, UserMinus, MapPin } from "lucide-react";
import api from "@/lib/api";
import Avatar from "@/components/Avatar";

interface ConnectionsTabProps {
  user: any;
}

interface ConnectionUser {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
  location?: { city?: string; state?: string; country?: string };
}

const ConnectionsTab = ({ user }: ConnectionsTabProps) => {
  const [followingUsers, setFollowingUsers] = useState<ConnectionUser[]>([]);
  const [followerUsers, setFollowerUsers] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConnections = async () => {
      try {
        setLoading(true);
        const followingIds: string[] = (user as any)?.following || [];
        const followerIds: string[] = (user as any)?.followers || [];

        const followingPromises = followingIds.map(async (id) => {
          try {
            const res = await api.getUser(id);
            const backendUser: any = (res as any).data?.user || (res as any).data;
            if (!backendUser) return null;
            return {
              _id: backendUser._id,
              name: backendUser.name,
              avatar: backendUser.avatar,
              role: backendUser.role,
              location: backendUser.location,
            } as ConnectionUser;
          } catch {
            return null;
          }
        });

        const followerPromises = followerIds.map(async (id) => {
          try {
            const res = await api.getUser(id);
            const backendUser: any = (res as any).data?.user || (res as any).data;
            if (!backendUser) return null;
            return {
              _id: backendUser._id,
              name: backendUser.name,
              avatar: backendUser.avatar,
              role: backendUser.role,
              location: backendUser.location,
            } as ConnectionUser;
          } catch {
            return null;
          }
        });

        const [followingResult, followersResult] = await Promise.all([
          Promise.all(followingPromises),
          Promise.all(followerPromises),
        ]);

        setFollowingUsers(followingResult.filter((u): u is ConnectionUser => Boolean(u)));
        setFollowerUsers(followersResult.filter((u): u is ConnectionUser => Boolean(u)));
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      loadConnections();
    } else {
      setLoading(false);
    }
  }, [user?._id]);

  const hasAnyConnections = followingUsers.length > 0 || followerUsers.length > 0;

  return (
    <div className="space-y-6 font-sans">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Following */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Following</p>
                <p className="text-xs text-slate-500">People you follow on LocalSkillHub</p>
              </div>
            </div>
            <span className="text-xs font-medium rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              {followingUsers.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : followingUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">You aren&apos;t following anyone yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {followingUsers.map((u) => {
                const isClient = u.role === "client";
                const profileLink = isClient ? `/clients/${u._id}` : `/freelancers/${u._id}`;
                const city = u.location?.city;
                const state = u.location?.state;

                return (
                  <Link
                    key={u._id}
                    to={profileLink}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size={40} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 capitalize truncate">{u.role}</p>
                      </div>
                    </div>
                    {(city || state) && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[140px]">
                          {city}
                          {state ? `, ${state}` : ""}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Followers */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Followers</p>
                <p className="text-xs text-slate-500">People who follow you</p>
              </div>
            </div>
            <span className="text-xs font-medium rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              {followerUsers.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : followerUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No followers yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {followerUsers.map((u) => {
                const isClient = u.role === "client";
                const profileLink = isClient ? `/clients/${u._id}` : `/freelancers/${u._id}`;
                const city = u.location?.city;
                const state = u.location?.state;

                return (
                  <Link
                    key={u._id}
                    to={profileLink}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size={40} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 capitalize truncate">{u.role}</p>
                      </div>
                    </div>
                    {(city || state) && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[140px]">
                          {city}
                          {state ? `, ${state}` : ""}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!loading && !hasAnyConnections && (
        <p className="text-xs text-slate-500">You don&apos;t have any connections yet. Start following people to build your network.</p>
      )}
    </div>
  );
};

export default ConnectionsTab;
