const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

type QueryParams = Record<string, unknown>;

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function request<T = unknown>(
  method: string,
  path: string,
  { params, body }: { params?: QueryParams; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

const get = <T = unknown>(path: string, params?: QueryParams) => request<T>('GET', path, { params });
const post = <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, { body });
const put = <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, { body });
const del = <T = unknown>(path: string, body?: unknown) => request<T>('DELETE', path, { body });

// Get user's admin notifications
export const getAdminNotifications = (params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) => get('/notifications', params);

// Mark notification as read
export const markNotificationAsRead = (notificationId: string) => 
  put(`/notifications/${notificationId}/read`);

// Mark all notifications as read
export const markAllNotificationsAsRead = () => 
  put('/notifications/mark-all/read');

// Delete notification
export const deleteNotification = (notificationId: string) => 
  del(`/notifications/${notificationId}`);
