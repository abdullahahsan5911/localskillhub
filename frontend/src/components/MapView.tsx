import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Link } from 'react-router-dom';
import L, { Map as LeafletMap } from 'leaflet';
import { FiBriefcase, FiFilter, FiMapPin, FiNavigation, FiStar, FiUser } from 'react-icons/fi';
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
// import { userInfo } from 'os';
import ClientProfile from '@/pages/ClientProfile';
import { formatCurrency } from '@/lib/currency';
import { set } from 'date-fns';
import { LocateIcon, LollipopIcon, NavigationIcon } from 'lucide-react';
import { CiLollipop } from 'react-icons/ci';

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
  const popupCloseTimeoutRef = useRef<number | null>(null);

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

  const clearPopupCloseTimeout = () => {
    if (popupCloseTimeoutRef.current !== null) {
      window.clearTimeout(popupCloseTimeoutRef.current);
      popupCloseTimeoutRef.current = null;
    }
  };

  const schedulePopupClose = (leafletMarker: L.Marker, delay = 800) => {
    clearPopupCloseTimeout();
    popupCloseTimeoutRef.current = window.setTimeout(() => {
      leafletMarker.closePopup();
      popupCloseTimeoutRef.current = null;
    }, delay);
  };

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

    clearPopupCloseTimeout();

    const freelancerIconSvg = renderToStaticMarkup(<FiUser size={16} />);
    const jobIconSvg = renderToStaticMarkup(<FiBriefcase size={16} />);
    const yourLocationIconSvg = renderToStaticMarkup(<FiNavigation size={14} />);

    const youIcon = L.divIcon({
      className: '',
      html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#ffffff;color:#ef4444;border:2px solid #ef4444;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,.22);">${yourLocationIconSvg}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    markerData.forEach((marker) => {
      const isFreelancer = marker.type === 'freelancer';
      const color = isFreelancer ? '#2563eb' : '#16a34a';
      const markerIconSvg = isFreelancer ? freelancerIconSvg : jobIconSvg;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:${color};color:#ffffff;border:2px solid ${color};border-radius:10px;box-shadow:0 3px 9px rgba(0,0,0,.24);">${markerIconSvg}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      });

      const leafletMarker = L.marker([marker.position.lat, marker.position.lng], {
        icon,
      })
        .bindPopup(buildPopupHtml(marker), { maxWidth: 330, closeButton: false })
        .addTo(layer);

      const onPopupMouseEnter = () => {
        clearPopupCloseTimeout();
      };

      const onPopupMouseLeave = () => {
        schedulePopupClose(leafletMarker);
      };

      leafletMarker.on('mouseover', () => {
        clearPopupCloseTimeout();
        setActiveResultId(marker.id);
        leafletMarker.openPopup();
      });

      leafletMarker.on('mouseout', () => {
        schedulePopupClose(leafletMarker);
      });

      leafletMarker.on('click', () => {
        clearPopupCloseTimeout();
        setActiveResultId(marker.id);
        leafletMarker.openPopup();
      });

      leafletMarker.on('popupopen', () => {
        const popupEl = leafletMarker.getPopup()?.getElement();
        if (!popupEl) return;
        popupEl.addEventListener('mouseenter', onPopupMouseEnter);
        popupEl.addEventListener('mouseleave', onPopupMouseLeave);
      });

      leafletMarker.on('popupclose', () => {
        const popupEl = leafletMarker.getPopup()?.getElement();
        if (!popupEl) return;
        popupEl.removeEventListener('mouseenter', onPopupMouseEnter);
        popupEl.removeEventListener('mouseleave', onPopupMouseLeave);
      });

      markerInstancesRef.current[marker.id] = leafletMarker;
    });

    L.marker([center.lat, center.lng], {
      icon: youIcon,
    })
      .bindPopup('<strong>Your Location</strong>')
      .addTo(layer);

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
      const skillsSource =
        (Array.isArray(freelancer.skills) && freelancer.skills.length > 0
          ? freelancer.skills
          : freelancer.userId?.skills) || [];
      const skills = skillsSource
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

      return `<div style="min-width:240px;font-family:inherit;line-height:1.4;">
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

        <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Rates:</strong> ${formatCurrency(minRate)} - ${formatCurrency(maxRate)} / ${escapeHtml(rateType)}</div>
        <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Availability:</strong> ${escapeHtml(freelancer.availability?.status || 'available')}</div>
        <div style="font-size:12px;color:#111827;margin-bottom:6px;"><strong>Past Jobs + Reviews:</strong> ${completedJobs} jobs | ${rating} rating (${reviews})</div>
        <div style="font-size:12px;color:#111827;margin-bottom:8px;"><strong>Trust Score:</strong> Overall ${overall} | Local ${localTrust} | Skill ${skillTrust}</div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">Social proof: ${reviews > 0 ? 'reviewed' : 'new profile'}, ${endorsements > 0 ? 'endorsed' : 'awaiting endorsements'}</div>

        <a href="/freelancers/${profileId}" style="display:block;text-align:center;font-size:12px;background:#2563eb;color:white;padding:7px 12px;border-radius:6px;text-decoration:none;">View Profile</a>
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

      <div style="font-size:12px;color:#111827;margin:8px 0 6px;"><strong>Budget/Rate:</strong> ${formatCurrency(amount, job.budget?.currency)} (${budgetType})</div>
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

  const isFreelancerMode = type === 'freelancers';
  const accentColor = isFreelancerMode ? 'blue' : 'emerald';

  return (
    <div className="flex flex-col gap-4 p-0 sm:p-1">

      {/* ── Top control bar ── */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm px-3 sm:px-5 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Left – mode label + controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Mode pill */}
            <div className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
              isFreelancerMode
                ? 'bg-blue-50 text-blue-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isFreelancerMode
                ? <FiUser className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                : <FiBriefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span className="truncate">{isFreelancerMode ? 'Freelancer Map' : 'Local Job Feed'}</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-5 w-px bg-slate-200" />

            {/* Radius select */}
            <Select
              value={radius === null ? 'all' : radius.toString()}
              onValueChange={(v) => setRadius(v === 'all' ? null : parseInt(v, 10))}
            >
              <SelectTrigger className="h-8 sm:h-9 w-32 sm:w-40 rounded-lg border-slate-200 bg-slate-50 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2500]">
                <SelectItem value="all">Any distance</SelectItem>
                <SelectItem value="10">Within 10 km</SelectItem>
                <SelectItem value="25">Within 25 km</SelectItem>
                <SelectItem value="50">Within 50 km</SelectItem>
                <SelectItem value="100">Within 100 km</SelectItem>
                <SelectItem value="200">Within 200 km</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort select */}
            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger className="h-8 sm:h-9 w-36 sm:w-44 rounded-lg border-slate-200 bg-slate-50 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2500]">
                <SelectItem value="distance">Sort: Nearest first</SelectItem>
                <SelectItem value="rates">Sort: Highest rate</SelectItem>
                <SelectItem value="rating">Sort: Top rated</SelectItem>
              </SelectContent>
            </Select>

            {/* Result count */}
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] sm:text-xs font-medium text-slate-600">
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-slate-400" />
                  Loading…
                </span>
              ) : (
                <>{markerData.length} result{markerData.length !== 1 ? 's' : ''}</>
              )}
            </span>
          </div>

          {/* Right – filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            className={`h-8 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto ${
              showFilters
                ? 'border-slate-400 bg-slate-100 text-slate-800'
                : 'border-slate-200 bg-white text-slate-600 '
            }`}
          >
            <FiFilter className="mr-2 h-3.5 w-3.5" />
            Filters
            {showFilters && (
              <span className="ml-2 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] text-white">
                ON
              </span>
            )}
          </Button>
        </div>

        {/* ── Expanded filters ── */}
        {showFilters && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* City */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                <Select
                  value={filters.city || 'all'}
                  onValueChange={(v) => setFilters((p) => ({ ...p, city: v === 'all' ? '' : v }))}
                >
                  <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-sm">
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent className="z-[2500]">
                    <SelectItem value="all">All cities</SelectItem>
                    {liveFilterOptions.cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">State</label>
                <Select
                  value={filters.state || 'all'}
                  onValueChange={(v) => setFilters((p) => ({ ...p, state: v === 'all' ? '' : v }))}
                >
                  <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-sm">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent className="z-[2500]">
                    <SelectItem value="all">All states</SelectItem>
                    {liveFilterOptions.states.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keyword */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keyword</label>
                <Input
                  placeholder="skill, role, job…"
                  value={filters.keyword}
                  onChange={(e) => setFilters((p) => ({ ...p, keyword: e.target.value }))}
                  className="h-9 rounded-lg border-slate-200 bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              {/* Mode-specific filters */}
              {isFreelancerMode ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skill</label>
                    <Select
                      value={filters.skill || 'all'}
                      onValueChange={(v) => setFilters((p) => ({ ...p, skill: v === 'all' ? '' : v }))}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-sm">
                        <SelectValue placeholder="All skills" />
                      </SelectTrigger>
                      <SelectContent className="z-[2500]">
                        <SelectItem value="all">All skills</SelectItem>
                        {liveFilterOptions.skills.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min Rating</label>
                    <Select
                      value={filters.minRating?.toString() || '0'}
                      onValueChange={(v) => setFilters((p) => ({ ...p, minRating: parseFloat(v) || undefined }))}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-sm">
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

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Availability</label>
                    <Select
                      value={filters.available === undefined ? 'all' : filters.available ? 'true' : 'false'}
                      onValueChange={(v) => setFilters((p) => ({ ...p, available: v === 'all' ? undefined : v === 'true' }))}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[2500]">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Available</SelectItem>
                        <SelectItem value="false">Busy / Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
                    <Select
                      value={filters.category || 'all'}
                      onValueChange={(v) => setFilters((p) => ({ ...p, category: v === 'all' ? undefined : v }))}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-sm">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent className="z-[2500]">
                        <SelectItem value="all">All categories</SelectItem>
                        {liveFilterOptions.categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min Budget (₹)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minBudget || ''}
                      onChange={(e) => setFilters((p) => ({ ...p, minBudget: parseInt(e.target.value, 10) || undefined }))}
                      className="h-9 rounded-lg border-slate-200 bg-white text-sm placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max Budget (₹)</label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.maxBudget || ''}
                      onChange={(e) => setFilters((p) => ({ ...p, maxBudget: parseInt(e.target.value, 10) || undefined }))}
                      className="h-9 rounded-lg border-slate-200 bg-white text-sm placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work Zone</label>
                    <Select
                      value={filters.remote === undefined ? 'all' : filters.remote ? 'true' : 'false'}
                      onValueChange={(v) => setFilters((p) => ({ ...p, remote: v === 'all' ? undefined : v === 'true' }))}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[2500]">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Remote / Hybrid</SelectItem>
                        <SelectItem value="false">On-site only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Data summary bar */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
              <span><span className="font-semibold text-slate-700">{sourceItems.length}</span> records</span>
              <span className="text-slate-300">·</span>
              <span><span className="font-semibold text-slate-700">{liveFilterOptions.cities.length}</span> cities</span>
              <span className="text-slate-300">·</span>
              <span><span className="font-semibold text-slate-700">{liveFilterOptions.states.length}</span> states</span>
              <span className="text-slate-300">·</span>
              <span><span className="font-semibold text-slate-700">{liveFilterOptions.skills.length}</span> skills</span>
              {type === 'jobs' && (
                <>
                  <span className="text-slate-300">·</span>
                  <span><span className="font-semibold text-slate-700">{liveFilterOptions.categories.length}</span> categories</span>
                </>
              )}
              {liveFilterOptions.maxValue > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>Range: <span className="font-semibold text-slate-700">{formatCurrency(liveFilterOptions.minValue)} – {formatCurrency(liveFilterOptions.maxValue)}</span></span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main body: sidebar + map ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* ── Sidebar list ── */}
        <div
          className="w-full lg:w-72 flex-shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ height: '640px' }}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isFreelancerMode ? 'Freelancers nearby' : 'Open jobs nearby'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Hover a card to preview on map</p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {visibleResults.length}
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {visibleResults.map((entry) => {
              const isActive = activeResultId === entry.id;

              if (entry.type === 'freelancer') {
                const f = entry.data;
                const name = f.userId?.name || f.name || 'Freelancer';
                const city = f.userId?.location?.city || f.location?.city || '—';
                const state = f.userId?.location?.state || f.location?.state || '';
                const rating = toNumber(f.ratings?.average, 0);
                const reviews = toNumber(f.ratings?.count, 0);
                const rate = toNumber(f.rates?.minRate, 0);
                const localTrust = toNumber(f.localScore, 0);
                const skillTrust = toNumber(f.skillScore, 0);
                const overall = Math.round((localTrust + toNumber(f.globalScore, 0) + skillTrust) / 3);

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => focusMarker(entry.id)}
                    onMouseEnter={() => setActiveResultId(entry.id)}
                    className="w-full text-left"
                  >
                    <div className={`rounded-xl border p-3 transition-all duration-150 ${
                      isActive
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-slate-150 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                          <p className="truncate text-xs text-slate-500">{f.title || 'Local Specialist'}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <FiMapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{city}{state ? `, ${state}` : ''}</span>
                          </p>
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                          {entry.distanceKm.toFixed(1)} km
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(((Array.isArray(f.skills) && f.skills.length > 0) ? f.skills : f.userId?.skills) || [])
                          .slice(0, 3)
                          .map((skill: any, idx: number) => (
                            <span key={`${entry.id}-skill-${idx}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {typeof skill === 'string' ? skill : skill.name}
                            </span>
                          ))}
                      </div>

                      {/* Stats row */}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{formatCurrency(rate)} / {f.rates?.rateType || 'hr'}</span>
                        <span className="flex items-center gap-0.5">
                          <FiStar className="h-3 w-3 text-amber-400" />
                          {rating.toFixed(1)}
                          <span className="text-slate-400 ml-0.5">({reviews})</span>
                        </span>
                      </div>

                      {/* Trust bar */}
                      <div className="mt-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] text-blue-700">
                        Trust {overall} · Local {localTrust} · Skill {skillTrust}
                      </div>

                      <div className="mt-2 text-right">
                        <a href={`/freelancers/${f.userId?._id || f._id}`} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                          View profile →
                        </a>
                      </div>
                    </div>
                  </button>
                );
              }

              const j = entry.data;
              const city = j.location?.city || '—';
              const state = j.location?.state || '';
              const budget = toNumber(j.budget?.amount, 0);

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => focusMarker(entry.id)}
                  onMouseEnter={() => setActiveResultId(entry.id)}
                  className="w-full text-left"
                >
                  <div className={`rounded-xl border p-3 transition-all duration-150 ${
                    isActive
                      ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                      : 'border-slate-150 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{j.title || 'Local Job'}</p>
                        <p className="truncate text-xs text-slate-500">{j.category || 'General'}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <FiMapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{city}{state ? `, ${state}` : ''}</span>
                        </p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        {entry.distanceKm.toFixed(1)} km
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{formatCurrency(budget, j.budget?.currency)}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {j.budget?.type || 'fixed'}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span>{toNumber((j.milestones || []).length, 0)} milestones</span>
                      <span className="text-slate-300">·</span>
                      <span>{toNumber(j.applicants || (j.proposals || []).length, 0)} proposals</span>
                      <span className="text-slate-300">·</span>
                      <span>{j.remoteAllowed ? 'Remote' : 'On-site'}</span>
                    </div>

                    <div className="mt-2 text-right">
                      <a href={`/jobs/${j._id}`} className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
                        View job →
                      </a>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Missing location items */}
            {!loading && missingMapItems.length > 0 && (
              <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-xs font-semibold text-amber-800">
                  {missingMapItems.length} item{missingMapItems.length !== 1 ? 's' : ''} missing location
                </p>
                <div className="space-y-1.5">
                  {missingMapItems.map((item) => (
                    <div key={item.id} className="rounded-lg bg-white/80 border border-amber-100 px-3 py-2">
                      <p className="text-xs font-medium text-slate-800">{item.title}</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">{item.locationLabel}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && visibleResults.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <FiMapPin className="mb-2 h-6 w-6 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No results found</p>
                <p className="mt-1 text-xs text-slate-400">Try expanding the distance or clearing filters</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Map area ── */}
        <div className="flex-1 flex flex-col gap-3">

          {/* Active filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {radius === null ? 'Any distance' : `≤ ${radius} km`}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {sortBy === 'distance' ? 'Nearest first' : sortBy === 'rates' ? 'Highest rate' : 'Top rated'}
            </span>
            {filters.city && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                 {filters.city}
              </span>
            )}
            {filters.state && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                 {filters.state}
              </span>
            )}
          </div>

          {/* Map container — explicit px height required for Leaflet to initialise */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: window.innerWidth < 640 ? '340px' : '560px', width: '100%' }}>
            {loading && (
              <div className="absolute inset-0  flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                <p className="mt-3 text-sm font-medium text-slate-600">Loading map data…</p>
              </div>
            )}
            <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 rounded-xl border border-slate-200 bg-white px-3 sm:px-5 py-2.5 sm:py-3">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400 mr-1">Legend</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500 ring-2 ring-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-slate-600">You</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-blue-600 ring-2 ring-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-slate-600">Freelancer</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-600 ring-2 ring-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-slate-600">Job</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;