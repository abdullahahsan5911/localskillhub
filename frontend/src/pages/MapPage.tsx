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

    const isFreelancerRole = user.role === 'freelancer';
    if (!isFreelancerRole) return false;

    const coordinates =
      (user.location?.coordinates as any)?.coordinates ?? user.location?.coordinates;
    const hasCoords = Array.isArray(coordinates) && coordinates.length >= 2;

    // If we have valid map coordinates, consider the profile "map-ready"
    // even if city/state strings are missing, to avoid false warnings
    // when the user already appears on the map.
    return !hasCoords;
  }, [isAuthenticated, user]);

  return (
    <Layout>
      <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="mb-4 sm:mb-6 rounded-lg sm:rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1 sm:mb-2">
                Local Discovery
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">Map Search</h1>
              <p className="max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
                Discover nearby freelancers and jobs with cleaner filters, live region data, and a focused map-first layout.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm min-w-full sm:min-w-[260px]">
              <Card className="p-2 sm:p-3 border-slate-200 shadow-none bg-white/80">
                <p className="text-slate-500 text-[9px] sm:text-xs mb-0.5 sm:mb-1">Discovery</p>
                <p className="font-semibold text-slate-900 text-xs sm:text-sm">City, state, distance</p>
              </Card>
              <Card className="p-2 sm:p-3 border-slate-200 shadow-none bg-white/80">
                <p className="text-slate-500 text-[9px] sm:text-xs mb-0.5 sm:mb-1">Sort</p>
                <p className="font-semibold text-slate-900 text-xs sm:text-sm">Distance, rate, rating</p>
              </Card>
            </div>
          </div>
        </div>

        {/* {showLocationAlert && (
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
        )} */}

        <Card className="p-2 sm:p-3 md:p-4 mb-4 sm:mb-5 border-slate-200 shadow-sm">
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-700">View Mode</span>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              <Button
                variant={viewType === 'freelancers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('freelancers')}
                className="flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                <FiUser className="h-3 w-3 sm:h-4 sm:w-4" />
                Freelancers
              </Button>
              <Button
                variant={viewType === 'jobs' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('jobs')}
                className="flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                <FiBriefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                Jobs
              </Button>
            </div>
          </div>
        </Card>
        <MapView type={viewType} />
      </div>
    </Layout>
  );
};

export default MapPage;
