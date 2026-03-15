import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import MapView from '../components/MapView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiUser, FiBriefcase, FiMapPin } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

const MapPage = () => {
  const [viewType, setViewType] = useState<'freelancers' | 'jobs'>('freelancers');
  const { user, isAuthenticated } = useAuth();

  const showLocationAlert = useMemo(() => {
    if (!isAuthenticated || !user) return false;

    const isFreelancerRole = user.role === 'freelancer' || user.role === 'both';
    if (!isFreelancerRole) return false;

    const city = user.location?.city?.trim();
    const state = user.location?.state?.trim();
    const coordinates =
      (user.location?.coordinates as any)?.coordinates ?? user.location?.coordinates;
    const hasCoords = Array.isArray(coordinates) && coordinates.length >= 2;

    return !city || !state || !hasCoords;
  }, [isAuthenticated, user]);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Local Discovery
              </p>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Map Search</h1>
              <p className="max-w-2xl text-slate-600">
                Discover nearby freelancers and jobs with cleaner filters, live region data, and a focused map-first layout.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm min-w-[260px]">
              <Card className="p-3 border-slate-200 shadow-none bg-white/80">
                <p className="text-slate-500 text-xs mb-1">Discovery</p>
                <p className="font-semibold text-slate-900">City, state, distance</p>
              </Card>
              <Card className="p-3 border-slate-200 shadow-none bg-white/80">
                <p className="text-slate-500 text-xs mb-1">Sort</p>
                <p className="font-semibold text-slate-900">Distance, rate, rating</p>
              </Card>
            </div>
          </div>
        </div>

        {showLocationAlert && (
          <Card className="mb-4 border-amber-200 bg-amber-50/80">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-1.5 text-amber-700">
                <FiMapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Add your location to appear on the map
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Profiles without city, state are hidden from Map Search.
                  Update your location to be shown on the map.
                </p>
                <Link
                  to="/dashboard/freelancer?tab=settings"
                  className="mt-2 inline-flex text-[11px] font-medium text-amber-900 underline underline-offset-2"
                >
                  Update your location settings
                </Link>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-3 sm:p-4 mb-5 border-slate-200 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-slate-700">View Mode</span>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={viewType === 'freelancers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('freelancers')}
                className="flex items-center gap-2 rounded-full"
              >
                <FiUser className="h-4 w-4" />
                Freelancers
              </Button>
              <Button
                variant={viewType === 'jobs' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('jobs')}
                className="flex items-center gap-2 rounded-full"
              >
                <FiBriefcase className="h-4 w-4" />
                Jobs
              </Button>
            </div>
          </div>
        </Card>
        <MapView type={viewType} height="480px" />
      </div>
    </Layout>
  );
};

export default MapPage;
