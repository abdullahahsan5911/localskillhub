import api from '@/lib/api';

export interface BrowserResolvedLocation {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName?: string;
}

export const getCurrentBrowserPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });

export const resolveCurrentBrowserLocation = async (): Promise<BrowserResolvedLocation> => {
  const position = await getCurrentBrowserPosition();
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const response = await api.reverseGeocodeCoordinates(latitude, longitude);
  const data = (response.data || {}) as any;

  return {
    city: data.city || '',
    state: data.state || '',
    country: data.country || 'India',
    latitude,
    longitude,
    displayName: data.displayName,
  };
};

export const buildPointLocation = (input: {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}) => ({
  city: input.city,
  state: input.state,
  country: input.country,
  coordinates: {
    type: 'Point' as const,
    coordinates: [input.longitude, input.latitude],
  },
});