import { useEffect, useState, useRef } from 'react';
import { FiMapPin, FiUser, FiBriefcase, FiFilter, FiX } from 'react-icons/fi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';

interface MapViewProps {
  type: 'freelancers' | 'jobs';
  initialCenter?: { lat: number; lng: number };
  height?: string;
}

interface MarkerData {
  id: string;
  position: { lat: number; lng: number };
  type: 'freelancer' | 'job';
  data: any;
}

interface ClusterData {
  center: { lat: number; lng: number };
  count: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

const MapView = ({ type, initialCenter, height = '600px' }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(initialCenter || { lat: 28.6139, lng: 77.2090 }); // Delhi default
  const [zoom, setZoom] = useState(10);
  const [radius, setRadius] = useState(50);
  const [filters, setFilters] = useState<{
    skills?: string[];
    category?: string;
    minRating?: number;
    minBudget?: number;
    maxBudget?: number;
    available?: boolean;
    remote?: boolean;
  }>({});

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation && !initialCenter) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [initialCenter]);

  useEffect(() => {
    fetchMapData();
  }, [center, radius, filters, type]);

  const fetchMapData = async () => {
    try {
      setLoading(true);

      if (type === 'freelancers') {
        const response = await api.findFreelancersNearby({
          latitude: center.lat,
          longitude: center.lng,
          radius,
          skills: filters.skills,
          minRating: filters.minRating,
          available: filters.available,
        });

        if (response.data && Array.isArray(response.data)) {
          const freelancerMarkers: MarkerData[] = (response.data as any).map((freelancer: any) => ({
            id: freelancer._id,
            position: {
              lat: freelancer.location.coordinates[1],
              lng: freelancer.location.coordinates[0],
            },
            type: 'freelancer' as const,
            data: freelancer,
          }));
          setMarkers(freelancerMarkers);
        }
      } else {
        const response = await api.findJobsNearby({
          latitude: center.lat,
          longitude: center.lng,
          radius,
          skills: filters.skills,
          category: filters.category,
          minBudget: filters.minBudget,
          maxBudget: filters.maxBudget,
          remote: filters.remote,
        });

        if (response.data && Array.isArray(response.data)) {
          const jobMarkers: MarkerData[] = (response.data as any).map((job: any) => ({
            id: job._id,
            position: {
              lat: job.location.coordinates[1],
              lng: job.location.coordinates[0],
            },
            type: 'job' as const,
            data: job,
          }));
          setMarkers(jobMarkers);
        }
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await api.getMapClusters({
        type,
        zoom,
      });

      if (response.data && Array.isArray(response.data)) {
        setClusters(response.data as any);
      }
    } catch (error) {
      console.error('Error fetching clusters:', error);
    }
  };

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
  };

  const handleRadiusChange = (value: string) => {
    setRadius(parseInt(value));
  };

  const renderMarkerCard = (marker: MarkerData) => {
    if (marker.type === 'freelancer') {
      const freelancer = marker.data;
      return (
        <Card className="absolute bottom-0 left-0 right-0 m-4 p-4 shadow-lg z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUser className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                <p className="text-sm text-gray-600">{freelancer.title || 'Freelancer'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMarker(null)}
            >
              <FiX className="h-4 w-4" />
            </Button>
          </div>

          {freelancer.skills && freelancer.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {freelancer.skills.slice(0, 5).map((skill: string, idx: number) => (
                <Badge key={idx} variant="secondary">{skill}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Rating:</span>
                <span className="ml-1 font-semibold">{freelancer.rating || 'N/A'} ⭐</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Distance:</span>
                <span className="ml-1 font-semibold">{freelancer.distance?.toFixed(1)} km</span>
              </div>
            </div>
            <Button size="sm" onClick={() => window.location.href = `/freelancers/${freelancer._id}`}>
              View Profile
            </Button>
          </div>
        </Card>
      );
    } else {
      const job = marker.data;
      return (
        <Card className="absolute bottom-0 left-0 right-0 m-4 p-4 shadow-lg z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiBriefcase className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.category}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMarker(null)}
            >
              <FiX className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.description}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Budget:</span>
                <span className="ml-1 font-semibold">₹{job.budget?.toLocaleString()}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Distance:</span>
                <span className="ml-1 font-semibold">{job.distance?.toFixed(1)} km</span>
              </div>
            </div>
            <Button size="sm" onClick={() => window.location.href = `/jobs/${job._id}`}>
              View Job
            </Button>
          </div>
        </Card>
      );
    }
  };

  return (
    <div className="relative">
      {/* Filters Bar */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiMapPin className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {type === 'freelancers' ? 'Freelancers' : 'Jobs'} Near You
              </span>
            </div>

            <Select value={radius.toString()} onValueChange={handleRadiusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
                <SelectItem value="200">200 km</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline" className="text-sm">
              {markers.length} found
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid md:grid-cols-3 gap-4">
            {type === 'freelancers' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Minimum Rating
                  </label>
                  <Select
                    value={filters.minRating?.toString() || ''}
                    onValueChange={(value) => setFilters({ ...filters, minRating: parseFloat(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any rating</SelectItem>
                      <SelectItem value="3">3+ ⭐</SelectItem>
                      <SelectItem value="4">4+ ⭐</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Availability
                  </label>
                  <Select
                    value={filters.available?.toString() || 'all'}
                    onValueChange={(value) => 
                      setFilters({ ...filters, available: value === 'true' ? true : value === 'false' ? false : undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Available Now</SelectItem>
                      <SelectItem value="false">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Min Budget
                  </label>
                  <Input
                    type="number"
                    placeholder="Minimum"
                    value={filters.minBudget || ''}
                    onChange={(e) => setFilters({ ...filters, minBudget: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Max Budget
                  </label>
                  <Input
                    type="number"
                    placeholder="Maximum"
                    value={filters.maxBudget || ''}
                    onChange={(e) => setFilters({ ...filters, maxBudget: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Remote Jobs
                  </label>
                  <Select
                    value={filters.remote?.toString() || 'all'}
                    onValueChange={(value) => 
                      setFilters({ ...filters, remote: value === 'true' ? true : value === 'false' ? false : undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Remote Only</SelectItem>
                      <SelectItem value="false">On-site Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Map Container */}
      <div className="relative" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map data...</p>
            </div>
          </div>
        )}

        {/* Simple Map Placeholder - Replace with actual map library like Leaflet or Google Maps */}
        <div
          ref={mapRef}
          className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative"
        >
          {/* Map background grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Markers */}
          <div className="absolute inset-0">
            {markers.map((marker) => (
              <div
                key={marker.id}
                className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110"
                style={{
                  left: `${((marker.position.lng - center.lng) * 1000 + 50)}%`,
                  top: `${((center.lat - marker.position.lat) * 1000 + 50)}%`,
                }}
                onClick={() => handleMarkerClick(marker)}
              >
                {marker.type === 'freelancer' ? (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <FiUser className="h-5 w-5 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <FiBriefcase className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Center marker */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
          </div>

          {/* Map attribution */}
          <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-3 py-1 rounded text-xs text-gray-600">
            Interactive Map View - Replace with Leaflet/Google Maps for production
          </div>
        </div>

        {/* Selected Marker Info Card */}
        {selectedMarker && renderMarkerCard(selectedMarker)}
      </div>

      {/* Instructions */}
      <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a simplified map visualization. For production, integrate with 
          <a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer" className="underline ml-1">
            Leaflet
          </a> or 
          <a href="https://developers.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline ml-1">
            Google Maps API
          </a> for full interactive mapping, clustering, and geocoding features.
        </p>
      </Card>
    </div>
  );
};

export default MapView;
