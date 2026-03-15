import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapPin, ChevronLeft, Loader2, Shield, Star } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  followers?: string[];
  following?: string[];
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  role: string;
}

interface ReputationStats {
  stats?: {
    totalJobsCompleted?: number;
    profileViews?: number;
    successRate?: number;
  };
  scoreBreakdown?: {
    reviews?: number;
  };
}

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [client, setClient] = useState<ClientUser | null>(null);
  const [reputation, setReputation] = useState<ReputationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const [userRes, repRes] = await Promise.all([
          api.getUser(id),
          api.getReputation(id),
        ]);

        const backendUser: any = (userRes as any).data?.user || (userRes as any).data;
        const repData: any = (repRes as any).data || repRes;

        if (!backendUser) {
          setError("Client not found");
          setClient(null);
          return;
        }

        if (backendUser.role !== "client" && backendUser.role !== "both") {
          setError("This user is not a client.");
        }

        setClient(backendUser);
        setReputation(repData);
      } catch (err: any) {
        setError(err.message || "Failed to load client profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const locationText = client?.location
    ? [client.location.city, client.location.state, client.location.country]
        .filter(Boolean)
        .join(", ")
    : "";

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-red-600 mb-4">{error || "Client not found"}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            ← Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const followerCount = client.followers?.length || 0;
  const followingCount = client.following?.length || 0;
  const completedJobs = reputation?.stats?.totalJobsCompleted ?? 0;
  const profileViews = reputation?.stats?.profileViews ?? 0;
  const successRate = reputation?.stats?.successRate ?? 0;
  const reviewScore = reputation?.scoreBreakdown?.reviews ?? 0;

  return (
    <Layout>
      <section className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">Client Profile</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-6 bg-white">
            <div className="h-32 md:h-40 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900" />

            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
                <div className="flex items-end gap-4">
                  {client.avatar ? (
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-blue-600 border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">
                      {getInitials(client.name)}
                    </div>
                  )}
                  <div className="pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        {client.name}
                      </h1>
                      {(client.isEmailVerified || client.isPhoneVerified) && (
                        <Shield className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Trusted client on LocalSkillHub</p>
                    {locationText && (
                      <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {locationText}
                      </p>
                    )}
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      className="rounded-xl text-xs sm:text-sm border-gray-300"
                      onClick={() => navigate("/dashboard/client")}
                    >
                      Go to client dashboard
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-2">
                <div>
                  <p className="text-gray-500">Followers</p>
                  <p className="font-semibold text-gray-900">{followerCount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Following</p>
                  <p className="font-semibold text-gray-900">{followingCount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Jobs Completed</p>
                  <p className="font-semibold text-gray-900">{completedJobs}</p>
                </div>
                <div>
                  <p className="text-gray-500">Profile Views</p>
                  <p className="font-semibold text-gray-900">{profileViews}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <aside className="space-y-4 md:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 text-sm">
                <p className="font-semibold text-gray-900 mb-3">Client Insights</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Jobs completed with freelancers</span>
                    <span className="font-semibold text-gray-900">{completedJobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Success rate</span>
                    <span className="font-semibold text-gray-900">{successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Average review score</span>
                    <span className="flex items-center gap-1 font-semibold text-gray-900">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {reviewScore ? `${(reviewScore / 20).toFixed(1)}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <main className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 text-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-2">About this client</h2>
                <p className="text-gray-600">
                  This client hires local talent on LocalSkillHub. Their detailed
                  hiring history and preferences will appear here as they
                  complete more jobs and interact with freelancers.
                </p>
              </div>
            </main>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ClientProfile;
