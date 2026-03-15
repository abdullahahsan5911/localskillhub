import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L, { Map as LeafletMap } from 'leaflet';
import { FiBriefcase, FiFilter, FiMapPin, FiStar, FiUser } from 'react-icons/fi';
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
import api from '@/lib/api';
import { userInfo } from 'os';
import ClientProfile from '@/pages/ClientProfile';

interface MapViewProps {
  type: 'freelancers' | 'jobs';
  initialCenter?: { lat: number; lng: number };
  height?: string;
}

interface MarkerData {
  id: string;
  position: { lat: number; lng: number };
  type: 'freelancer' | 'job';
  distanceKm: number;
  rateOrBudget: number;
  ratingScore: number;
  data: any;
}

type SortOption = 'distance' | 'rates' | 'rating';

interface MissingMapItem {
  id: string;
  title: string;
  locationLabel: string;
  type: 'freelancer' | 'job';
  reason: string;
  city?: string;
  state?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const isValidCoordinatePair = (lat: number, lng: number) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
};

const uniqueSorted = (values: unknown[]) =>
  [...new Set(values.map((v) => String(v ?? '').trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

const getLocationMeta = (item: any, itemType: 'freelancer' | 'job') => {
  if (itemType === 'freelancer') {
    return {
      city: item.userId?.location?.city || item.location?.city || '',
      state: item.userId?.location?.state || item.location?.state || '',
    };
  }

  return {
    city: item.location?.city || '',
    state: item.location?.state || '',
  };
};

const parseCollectionResponse = <T,>(responseData: any, key: 'freelancers' | 'jobs'): T[] => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.[key])) return responseData[key];
  if (Array.isArray(responseData?.data?.[key])) return responseData.data[key];
  return [];
};

const buildLocationLabel = (city?: string, state?: string) =>
  [city, state].filter(Boolean).join(', ') || 'Location missing';

const haversineDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCoordinates = (item: any, itemType: 'freelancer' | 'job') => {
  if (item.__resolvedCoordinates) {
    const lat = toNumber(item.__resolvedCoordinates.lat, NaN);
    const lng = toNumber(item.__resolvedCoordinates.lng, NaN);
    return isValidCoordinatePair(lat, lng) ? { lat, lng } : null;
  }

  if (itemType === 'freelancer') {
    const profileCoords = item.location?.coordinates?.coordinates || item.location?.coordinates;
    const userCoords =
      item.userId?.location?.coordinates?.coordinates ||
      item.userId?.location?.coordinates;
    const coords = Array.isArray(profileCoords)
      ? profileCoords
      : Array.isArray(userCoords)
        ? userCoords
        : null;

    if (coords && coords.length >= 2) {
      const lat = toNumber(coords[1], NaN);
      const lng = toNumber(coords[0], NaN);
      return isValidCoordinatePair(lat, lng) ? { lat, lng } : null;
    }

    return null;
  }

  const coords = item.location?.coordinates?.coordinates || item.location?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const lat = toNumber(coords[1], NaN);
    const lng = toNumber(coords[0], NaN);
    return isValidCoordinatePair(lat, lng) ? { lat, lng } : null;
  }

  return null;
};

const MapView = ({ type, initialCenter, height = '680px' }: MapViewProps) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerInstancesRef = useRef<Record<string, L.Marker>>({});
  const geocodeCacheRef = useRef<Record<string, { lat: number; lng: number } | null>>({});

  const [markerData, setMarkerData] = useState<MarkerData[]>([]);
  const [sourceItems, setSourceItems] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationReady, setLocationReady] = useState(!!initialCenter);
  const [center, setCenter] = useState(initialCenter || { lat: 28.6139, lng: 77.2090 });
  const [radius, setRadius] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [fetchSummary, setFetchSummary] = useState({ fetched: 0, mapped: 0 });
  const [missingMapItems, setMissingMapItems] = useState<MissingMapItem[]>([]);
  const [repairingId, setRepairingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    city: string;
    state: string;
    keyword: string;
    skill: string;
    category?: string;
    minRating?: number;
    minBudget?: number;
    maxBudget?: number;
    available?: boolean;
    remote?: boolean;
  }>({ city: '', state: '', keyword: '', skill: '' });

  useEffect(() => {
    if (!mapDivRef.current || mapInstanceRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [center.lat, center.lng],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (initialCenter) {
      setLocationReady(true);
      return;
    }

    if (!navigator.geolocation) {
      setLocationReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationReady(true);
      },
      () => setLocationReady(true),
      { timeout: 5000 }
    );
  }, [initialCenter]);

  useEffect(() => {
    if (!locationReady) return;
    fetchMapData();
  }, [locationReady, type, radius, filters, center, sortBy]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerInstancesRef.current = {};

    const youIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;background:#ef4444;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #ef4444;"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker([center.lat, center.lng], { icon: youIcon })
      .bindPopup('<strong>Your Location</strong>')
      .addTo(layer);

    markerData.forEach((marker) => {
      const isFreelancer = marker.type === 'freelancer';
      const color = isFreelancer ? '#2563eb' : '#16a34a';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:34px;height:34px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      });

      const leafletMarker = L.marker([marker.position.lat, marker.position.lng], { icon })
        .bindPopup(buildPopupHtml(marker), { maxWidth: 330, closeButton: false })
        .addTo(layer);

      leafletMarker.on('mouseover', () => {
        setActiveResultId(marker.id);
        leafletMarker.openPopup();
      });

      leafletMarker.on('mouseout', () => {
        if (activeResultId !== marker.id) {
          leafletMarker.closePopup();
        }
      });

      leafletMarker.on('click', () => {
        setActiveResultId(marker.id);
        leafletMarker.openPopup();
      });

      markerInstancesRef.current[marker.id] = leafletMarker;
    });

    requestAnimationFrame(() => {
      map.invalidateSize();

      if (markerData.length > 0) {
        const bounds = L.latLngBounds(
          markerData.map((marker) => [marker.position.lat, marker.position.lng] as [number, number])
        );
        bounds.extend([center.lat, center.lng]);
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
      } else {
        map.setView([center.lat, center.lng], 6);
      }
    });
  }, [markerData, center]);

  useEffect(() => {
    if (!activeResultId) return;

    const activeMarker = markerInstancesRef.current[activeResultId];
    if (activeMarker) {
      activeMarker.openPopup();
    }
  }, [activeResultId]);
  const visibleResults = useMemo(() => markerData, [markerData]);

  const liveFilterOptions = useMemo(() => {
    if (type === 'freelancers') {
      const cities = uniqueSorted(
        sourceItems.map(
          (item) => item.userId?.location?.city || item.location?.city || ''
        )
      );
      const states = uniqueSorted(
        sourceItems.map(
          (item) => item.userId?.location?.state || item.location?.state || ''
        )
      );
      const skills = uniqueSorted(
        sourceItems.flatMap((item) =>
          (item.skills || []).map((skill: any) =>
            typeof skill === 'string' ? skill : skill.name || ''
          )
        )
      );
      const rates = sourceItems
        .map((item) => toNumber(item.rates?.minRate, 0))
        .filter((value) => value > 0);

      return {
        cities,
        states,
        categories: [] as string[],
        skills,
        minValue: rates.length ? Math.min(...rates) : 0,
        maxValue: rates.length ? Math.max(...rates) : 0,
      };
    }

    const cities = uniqueSorted(sourceItems.map((item) => item.location?.city || ''));
    const states = uniqueSorted(sourceItems.map((item) => item.location?.state || ''));
    const categories = uniqueSorted(sourceItems.map((item) => item.category || ''));
    const skills = uniqueSorted(
      sourceItems.flatMap((item) => (item.skills || []).map((skill: string) => skill || ''))
    );
    const budgets = sourceItems
      .map((item) => toNumber(item.budget?.amount, 0))
      .filter((value) => value > 0);

    return {
      cities,
      states,
      categories,
      skills,
      minValue: budgets.length ? Math.min(...budgets) : 0,
      maxValue: budgets.length ? Math.max(...budgets) : 0,
    };
  }, [sourceItems, type]);

  const buildPopupHtml = (marker: MarkerData) => {
    if (marker.type === 'freelancer') {
      const freelancer = marker.data;
      const name = escapeHtml(freelancer.userId?.name || freelancer.name || 'Freelancer');
      const title = escapeHtml(freelancer.title || 'Local Professional');
      const city = escapeHtml(
        freelancer.userId?.location?.city || freelancer.location?.city || 'Unknown city'
      );
      const state = escapeHtml(
        freelancer.userId?.location?.state || freelancer.location?.state || 'Unknown state'
      );
      const profileId = freelancer.userId?._id || freelancer._id;
      const skills = (freelancer.skills || [])
        .slice(0, 4)
        .map((s: any) => escapeHtml(typeof s === 'string' ? s : s.name || 'Skill'))
        .join(', ');

      const minRate = toNumber(freelancer.rates?.minRate);
      const maxRate = toNumber(freelancer.rates?.maxRate, minRate);
      const rateType = freelancer.rates?.rateType || 'hourly';
      const rating = toNumber(freelancer.ratings?.average, 0).toFixed(1);
      const reviews = toNumber(freelancer.ratings?.count, 0);
      const endorsements = toNumber((freelancer.endorsements || []).length, 0);
      const completedJobs = toNumber(freelancer.completedJobs, 0);

      const localTrust = toNumber(freelancer.localScore, 0);
      const skillTrust = toNumber(freelancer.skillScore, 0);
      const overall = Math.round((localTrust + toNumber(freelancer.globalScore, 0) + skillTrust) / 3);

      return `<div style="min-width:240px;font-family:inherit;line-height:1.3;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div>
            <div style="font-weight:700;font-size:14px;">${name}</div>
            <div style="font-size:12px;color:#4b5563;">${title}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:2px;">${city}, ${state}</div>
          </div>
          <div style="font-size:11px;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:999px;">${marker.distanceKm.toFixed(1)} km</div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;">
          <span style="font-size:11px;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:999px;">${skills || 'No tags'}</span>
        </div>

        <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Rates:</strong> Rs ${minRate} - ${maxRate} / ${escapeHtml(rateType)}</div>
        <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Availability:</strong> ${escapeHtml(freelancer.availability?.status || 'available')}</div>
        <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Past Jobs + Reviews:</strong> ${completedJobs} jobs | ${rating} rating (${reviews})</div>
        <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Endorsements:</strong> ${endorsements}</div>
        <div style="font-size:12px;color:#111827;margin-bottom:8px;"><strong>Trust Score:</strong> Overall ${overall} | Local ${localTrust} | Skill ${skillTrust}</div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">Social proof: ${reviews > 0 ? 'reviewed' : 'new profile'}, ${endorsements > 0 ? 'endorsed' : 'awaiting endorsements'}</div>

        <a href="/profile/${profileId}" style="display:block;text-align:center;font-size:12px;background:#2563eb;color:white;padding:7px 12px;border-radius:6px;text-decoration:none;">View Profile</a>
      </div>`;
    }

    const job = marker.data;
    const title = escapeHtml(job.title || 'Local Job');
    const category = escapeHtml(job.category || 'General');
    const city = escapeHtml(job.location?.city || 'Unknown city');
    const state = escapeHtml(job.location?.state || 'Unknown state');
    const skills = (job.skills || [])
      .slice(0, 4)
      .map((s: string) => escapeHtml(s))
      .join(', ');
    const amount = toNumber(job.budget?.amount, 0);
    const budgetType = escapeHtml(job.budget?.type || 'fixed');
    const milestones = toNumber((job.milestones || []).length, 0);
    const invited = toNumber((job.invitedFreelancers || []).length, 0);
    const proposals = toNumber(job.applicants || (job.proposals || []).length, 0);
    const remote = job.remoteAllowed ? 'Remote/Hybrid' : 'On-site local';

    return `<div style="min-width:240px;font-family:inherit;line-height:1.3;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;">${title}</div>
          <div style="font-size:12px;color:#4b5563;">${category}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">${city}, ${state}</div>
        </div>
        <div style="font-size:11px;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:999px;">${marker.distanceKm.toFixed(1)} km</div>
      </div>

      <div style="font-size:12px;color:#111827;margin:8px 0 6px;"><strong>Budget/Rate:</strong> Rs ${amount.toLocaleString()} (${budgetType})</div>
      <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Location Zone:</strong> ${remote}</div>
      <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Skills:</strong> ${skills || 'Not specified'}</div>
      <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Milestones:</strong> ${milestones}</div>
      <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Proposals/Invites:</strong> ${proposals} proposals | ${invited} invited</div>
      <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">Workflow: post local job, set budget/rate, add milestones, invite proposals, choose package.</div>

      <a href="/jobs/${job._id}" style="display:block;text-align:center;font-size:12px;background:#16a34a;color:white;padding:7px 12px;border-radius:6px;text-decoration:none;">Open Job</a>
    </div>`;
  };

  const focusMarker = (entryId: string) => {
    const marker = markerInstancesRef.current[entryId];
    const entry = markerData.find((item) => item.id === entryId);
    const map = mapInstanceRef.current;

    if (!marker || !entry || !map) return;

    setActiveResultId(entryId);
    map.flyTo([entry.position.lat, entry.position.lng], Math.max(map.getZoom(), 11), {
      duration: 0.8,
    });
    marker.openPopup();
  };

  const resolveLocationCoordinates = async (city?: string, state?: string) => {
    const key = `${(city || '').trim().toLowerCase()}|${(state || '').trim().toLowerCase()}`;
    if (!key || key === '|') return null;

    if (key in geocodeCacheRef.current) {
      return geocodeCacheRef.current[key];
    }

    try {
      const address = [city, state, 'India'].filter(Boolean).join(', ');
      const response = await api.geocodeAddress(address);
      const lat = toNumber((response.data as any)?.latitude, NaN);
      const lng = toNumber((response.data as any)?.longitude, NaN);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const resolved = { lat, lng };
        geocodeCacheRef.current[key] = resolved;
        return resolved;
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }

    geocodeCacheRef.current[key] = null;
    return null;
  };

  const buildMissingMapItems = (items: any[], itemType: 'freelancer' | 'job') =>
    items
      .filter((item) => !getCoordinates(item, itemType))
      .map((item) => {
        const { city, state } = getLocationMeta(item, itemType);
        return {
          id: item._id,
          title: itemType === 'freelancer' ? item.title || item.userId?.name || 'Freelancer' : item.title || 'Job',
          locationLabel: buildLocationLabel(city, state),
          type: itemType,
          reason: city || state ? 'Geocoding failed for this location' : 'No city or state saved',
          city,
          state,
        } satisfies MissingMapItem;
      });

  const hydrateItemsWithCoordinates = async (items: any[], itemType: 'freelancer' | 'job') => {
    const hydrated = await Promise.all(
      items.map(async (item) => {
        if (getCoordinates(item, itemType)) {
          return item;
        }

        const { city, state } = getLocationMeta(item, itemType);
        if (!city && !state) {
          return item;
        }

        const resolved = await resolveLocationCoordinates(city, state);
        if (!resolved) {
          return item;
        }

        return {
          ...item,
          __resolvedCoordinates: resolved,
        };
      })
    );

    return { hydrated, missingItems: buildMissingMapItems(hydrated, itemType) };
  };

  const handleFixLocation = async (item: MissingMapItem) => {
    if (!item.city && !item.state) return;

    setRepairingId(item.id);
    try {
      const resolved = await resolveLocationCoordinates(item.city, item.state);
      if (!resolved) return;

      const updatedItems = sourceItems.map((sourceItem) =>
        sourceItem._id === item.id
          ? { ...sourceItem, __resolvedCoordinates: resolved }
          : sourceItem
      );

      const normalized = normalizeAndSort(updatedItems, type === 'freelancers' ? 'freelancer' : 'job');
      setSourceItems(updatedItems);
      setMarkerData(normalized);
      setMissingMapItems(buildMissingMapItems(updatedItems, type === 'freelancers' ? 'freelancer' : 'job'));
      setFetchSummary({ fetched: updatedItems.length, mapped: normalized.length });
    } finally {
      setRepairingId(null);
    }
  };

  const normalizeAndSort = (items: any[], itemType: 'freelancer' | 'job') => {
    const cityFilter = filters.city.trim().toLowerCase();
    const stateFilter = filters.state.trim().toLowerCase();
    const keywordFilter = filters.keyword.trim().toLowerCase();
    const skillFilter = filters.skill.trim().toLowerCase();

    const normalized = items
      .map((item): MarkerData | null => {
        const position = getCoordinates(item, itemType);
        if (!position) return null;

        const itemCity =
          itemType === 'freelancer'
            ? (item.userId?.location?.city || item.location?.city || '').toLowerCase()
            : (item.location?.city || '').toLowerCase();

        const itemState =
          itemType === 'freelancer'
            ? (item.userId?.location?.state || item.location?.state || '').toLowerCase()
            : (item.location?.state || '').toLowerCase();

        if (cityFilter && !itemCity.includes(cityFilter)) return null;
        if (stateFilter && !itemState.includes(stateFilter)) return null;

        if (keywordFilter) {
          const haystack =
            itemType === 'freelancer'
              ? [item.title, item.bio, item.userId?.name]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
              : [item.title, item.description, item.category]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
          if (!haystack.includes(keywordFilter)) return null;
        }

        const distanceKm = haversineDistanceKm(center.lat, center.lng, position.lat, position.lng);
        if (radius !== null && distanceKm > radius) return null;

        if (itemType === 'freelancer') {
          if (skillFilter) {
            const skillText = (item.skills || [])
              .map((skill: any) =>
                typeof skill === 'string' ? skill : skill?.name || ''
              )
              .join(' ')
              .toLowerCase();

            if (!skillText.includes(skillFilter)) return null;
          }

          const ratingScore = toNumber(item.ratings?.average, 0);
          const rateOrBudget = toNumber(item.rates?.minRate, 0);

          if (filters.minRating && ratingScore < filters.minRating) return null;
          if (filters.available !== undefined) {
            const status = item.availability?.status;
            const isAvailable = status === 'available';
            if (filters.available !== isAvailable) return null;
          }

          return {
            id: item._id,
            type: 'freelancer',
            position,
            distanceKm,
            ratingScore,
            rateOrBudget,
            data: item,
          };
        }

        const budget = toNumber(item.budget?.amount, 0);
        if (filters.minBudget && budget < filters.minBudget) return null;
        if (filters.maxBudget && budget > filters.maxBudget) return null;
        if (filters.remote !== undefined && Boolean(item.remoteAllowed) !== filters.remote) return null;
        if (filters.category && item.category !== filters.category) return null;

        return {
          id: item._id,
          type: 'job',
          position,
          distanceKm,
          ratingScore: 0,
          rateOrBudget: budget,
          data: item,
        };
      })
      .filter(Boolean) as MarkerData[];

    normalized.sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'rates') return b.rateOrBudget - a.rateOrBudget;
      return b.ratingScore - a.ratingScore;
    });

    return normalized;
  };

  const fetchMapData = async () => {
    setLoading(true);
    try {
      if (type === 'freelancers') {
        const response = await api.getFreelancers({
          city: filters.city || undefined,
          search: filters.keyword || filters.skill || undefined,
          skills: filters.skill || undefined,
          limit: 200,
          completeOnly: false,
        });
        const safeItems = parseCollectionResponse<any>(response.data, 'freelancers');
        const { hydrated, missingItems } = await hydrateItemsWithCoordinates(safeItems, 'freelancer');
        const normalized = normalizeAndSort(hydrated, 'freelancer');
        setSourceItems(hydrated);
        setMarkerData(normalized);
        setMissingMapItems(missingItems);
        setFetchSummary({ fetched: safeItems.length, mapped: normalized.length });
      } else {
        const response = await api.getJobs({
          city: filters.city || undefined,
          category: filters.category,
          search: filters.keyword || undefined,
          limit: 200,
          status: 'open',
        });
        const safeItems = parseCollectionResponse<any>(response.data, 'jobs');
        const { hydrated, missingItems } = await hydrateItemsWithCoordinates(safeItems, 'job');
        const normalized = normalizeAndSort(hydrated, 'job');
        setSourceItems(hydrated);
        setMarkerData(normalized);
        setMissingMapItems(missingItems);
        setFetchSummary({ fetched: safeItems.length, mapped: normalized.length });
      }
    } catch (error) {
      console.error('Map feed error:', error);
      setSourceItems([]);
      setMarkerData([]);
      setMissingMapItems([]);
      setFetchSummary({ fetched: 0, mapped: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Card className="p-4 mb-4 relative z-[1200] overflow-visible border-slate-200 shadow-sm bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {type === 'freelancers' ? (
                <FiUser className="h-5 w-5 text-blue-600" />
              ) : (
                <FiBriefcase className="h-5 w-5 text-green-600" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {type === 'freelancers' ? 'Freelancer Map View' : 'Local Job Feed'}
              </span>
            </div>

            <Select value={radius === null ? 'all' : radius.toString()} onValueChange={(v) => setRadius(v === 'all' ? null : parseInt(v, 10))}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2500]">
                <SelectItem value="all">Any distance</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
                <SelectItem value="200">200 km</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger className="w-44 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2500]">
                <SelectItem value="distance">Sort: Distance</SelectItem>
                <SelectItem value="rates">Sort: Rates/Budget</SelectItem>
                <SelectItem value="rating">Sort: Rating</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline" className="text-sm">
              {loading ? 'Loading' : markerData.length} results
            </Badge>

          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
              <FiFilter className="h-4 w-4 mr-2" />
              Region Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
              <Select
                value={filters.city || 'all'}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    city: v === 'all' ? '' : v,
                  }))
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent className="z-[2500]">
                  <SelectItem value="all">All cities</SelectItem>
                  {liveFilterOptions.cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">State</label>
              <Select
                value={filters.state || 'all'}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    state: v === 'all' ? '' : v,
                  }))
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent className="z-[2500]">
                  <SelectItem value="all">All states</SelectItem>
                  {liveFilterOptions.states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Keyword</label>
              <Input
                placeholder="skill, role, job"
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              />
            </div>

            {type === 'freelancers' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Skill</label>
                  <Select
                    value={filters.skill || 'all'}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        skill: v === 'all' ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="All skills" />
                    </SelectTrigger>
                    <SelectContent className="z-[2500]">
                      <SelectItem value="all">All skills</SelectItem>
                      {liveFilterOptions.skills.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Minimum Rating</label>
                  <Select
                    value={filters.minRating?.toString() || '0'}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        minRating: parseFloat(v) || undefined,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent className="z-[2500]">
                      <SelectItem value="0">Any rating</SelectItem>
                      <SelectItem value="3">3+ stars</SelectItem>
                      <SelectItem value="4">4+ stars</SelectItem>
                      <SelectItem value="4.5">4.5+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Availability</label>
                  <Select
                    value={
                      filters.available === undefined ? 'all' : filters.available ? 'true' : 'false'
                    }
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        available: v === 'all' ? undefined : v === 'true',
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[2500]">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Available local</SelectItem>
                      <SelectItem value="false">Busy/Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select
                    value={filters.category || 'all'}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        category: v === 'all' ? undefined : v,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="z-[2500]">
                      <SelectItem value="all">All categories</SelectItem>
                      {liveFilterOptions.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Min Budget (Rs)</label>
                  <Input
                    type="number"
                    placeholder="Minimum"
                    value={filters.minBudget || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minBudget: parseInt(e.target.value, 10) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Budget (Rs)</label>
                  <Input
                    type="number"
                    placeholder="Maximum"
                    value={filters.maxBudget || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxBudget: parseInt(e.target.value, 10) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Remote Zone</label>
                  <Select
                    value={
                      filters.remote === undefined ? 'all' : filters.remote ? 'true' : 'false'
                    }
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        remote: v === 'all' ? undefined : v === 'true',
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[2500]">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Remote/Hybrid</SelectItem>
                      <SelectItem value="false">On-site only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="md:col-span-2 xl:col-span-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-700">
              Live data: {sourceItems.length} records, {liveFilterOptions.cities.length} cities,
              {' '}{liveFilterOptions.states.length} states, {liveFilterOptions.skills.length} skills
              {type === 'jobs' ? `, ${liveFilterOptions.categories.length} categories` : ''}.
              {' '}
              {liveFilterOptions.maxValue > 0
                ? `Range: Rs ${liveFilterOptions.minValue.toLocaleString()} - Rs ${liveFilterOptions.maxValue.toLocaleString()}`
                : 'Range will appear when data is available.'}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1.7fr)] items-start">

        <Card className="p-3 sm:p-4 border-slate-200 shadow-sm bg-white lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {type === 'freelancers' ? 'All freelancers' : 'All jobs'}
              </p>
              <p className="text-xs text-slate-500">Click a result to focus it on the map. Hover markers to preview details.</p>
            </div>
            <Badge variant="outline" className="rounded-full">{visibleResults.length}</Badge>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {visibleResults.map((entry) => {
              if (entry.type === 'freelancer') {
                const f = entry.data;
                const name = f.userId?.name || f.name || 'Freelancer';
                const city = f.userId?.location?.city || f.location?.city || 'Unknown city';
                const state = f.userId?.location?.state || f.location?.state || 'Unknown state';
                const rating = toNumber(f.ratings?.average, 0);
                const reviews = toNumber(f.ratings?.count, 0);
                const rate = toNumber(f.rates?.minRate, 0);
                const localTrust = toNumber(f.localScore, 0);
                const skillTrust = toNumber(f.skillScore, 0);
                const overall = Math.round((localTrust + toNumber(f.globalScore, 0) + skillTrust) / 3);
                const isActive = activeResultId === entry.id;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => focusMarker(entry.id)}
                    onMouseEnter={() => setActiveResultId(entry.id)}
                    className="block w-full text-left"
                  >
                    <Card className={`p-4 rounded-xl shadow-none transition-colors ${isActive ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{name}</h3>
                          <p className="text-sm text-gray-600">{f.title || 'Local Specialist'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <FiMapPin className="h-3 w-3" /> {city}, {state}
                          </p>
                        </div>
                        <Badge variant="outline">{entry.distanceKm.toFixed(1)} km</Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(f.skills || []).slice(0, 4).map((skill: any, idx: number) => (
                          <Badge key={`${entry.id}-skill-${idx}`} variant="secondary" className="text-xs">
                            {typeof skill === 'string' ? skill : skill.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-3 text-sm text-gray-700 space-y-1">
                        <p>Rates: Rs {rate} / {f.rates?.rateType || 'hourly'}</p>
                        <p>Availability: {f.availability?.status || 'available'}</p>
                        <p>Past jobs + reviews: {toNumber(f.completedJobs, 0)} jobs | {rating.toFixed(1)} ({reviews})</p>
                        <p>Endorsements: {toNumber((f.endorsements || []).length, 0)}</p>
                      </div>

                      <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
                        <strong>Reputation:</strong> Overall Score {overall} | Local Trust {localTrust} | Skill Trust {skillTrust}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <FiStar className="h-3 w-3" /> Social proof enabled
                        </span>
                        <a href={`/profile/${f.userId?._id || f._id}`} className="text-blue-600 font-medium">
                          Open profile
                        </a>
                      </div>
                    </Card>
                  </button>
                );
              }

              const j = entry.data;
              const city = j.location?.city || 'Unknown city';
              const state = j.location?.state || 'Unknown state';
              const budget = toNumber(j.budget?.amount, 0);
              const isActive = activeResultId === entry.id;

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => focusMarker(entry.id)}
                  onMouseEnter={() => setActiveResultId(entry.id)}
                  className="block w-full text-left"
                >
                  <Card className={`p-4 rounded-xl shadow-none transition-colors ${isActive ? 'border-green-500 bg-green-50/60' : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{j.title || 'Local Job'}</h3>
                        <p className="text-sm text-gray-600">{j.category || 'General'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FiMapPin className="h-3 w-3" /> {city}, {state}
                        </p>
                      </div>
                      <Badge variant="outline">{entry.distanceKm.toFixed(1)} km</Badge>
                    </div>

                    <div className="mt-3 text-sm text-gray-700 space-y-1">
                      <p>Budget/rate: Rs {budget.toLocaleString()} ({j.budget?.type || 'fixed'})</p>
                      <p>Milestones: {toNumber((j.milestones || []).length, 0)}</p>
                      <p>Proposals: {toNumber(j.applicants || (j.proposals || []).length, 0)}</p>
                      <p>Invites: {toNumber((j.invitedFreelancers || []).length, 0)}</p>
                      <p>Remote zone: {j.remoteAllowed ? 'Enabled' : 'Local on-site'}</p>
                    </div>

                    <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-900">
                      <strong>Hiring workflow:</strong> post local jobs, set budget/rate, add milestones, invite proposals, choose service packages.
                    </div>

                    <div className="mt-3 text-right">
                      <a href={`/jobs/${j._id}`} className="text-green-700 font-medium text-sm">
                        Open job
                      </a>
                    </div>
                  </Card>
                </button>
              );
            })}
            {!loading && missingMapItems.length > 0 && (
              <div className="rounded-xl  p-4">
                <div className="flex items-center justify-between gap-3 mb-3">

                  <Badge variant="outline" className="rounded-full border-amber-300 text-amber-800">
                    {missingMapItems.length} {missingMapItems[0]?.type} with missing location
                  </Badge>
                </div>

                <div className="space-y-2">
                  {missingMapItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-amber-200 bg-white/80 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          <p className="text-xs text-red-600">{item.locationLabel}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary" className="text-[10px] rounded-full bg-amber-100 text-amber-900 hover:bg-amber-100">
                            {item.type}
                          </Badge>

                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2"> Reason: {item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!loading && visibleResults.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No results match the current filter set. Try Any distance or clear city/state filters.
              </div>
            )}
          </div>
        </Card>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <Badge variant="secondary" className="rounded-full px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-100">
              {radius === null ? 'Any distance' : `${radius} km radius`}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-100">
              Sorted by {sortBy}
            </Badge>
            {filters.city && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-100">
                City: {filters.city}
              </Badge>
            )}
            {filters.state && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-100">
                State: {filters.state}
              </Badge>
            )}
          </div>

          <div
            style={{ height }}
            className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white relative z-0"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-[1000]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Loading local map feed...</p>
                </div>
              </div>
            )}
            <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-5 px-1 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow" />
              <span>Your location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow" />
              <span>Freelancer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-green-600 border-2 border-white shadow" />
              <span>Job</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MapView;
