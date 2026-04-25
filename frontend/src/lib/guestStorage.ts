const isBrowser = typeof window !== 'undefined';

const readStringArray = (key: string): string[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value) => typeof value === 'string');
  } catch {
    return [];
  }
};

const writeStringArray = (key: string, values: string[]) => {
  if (!isBrowser) return;
  const unique = Array.from(new Set(values.filter((v) => typeof v === 'string')));
  window.localStorage.setItem(key, JSON.stringify(unique));
};

const GUEST_SAVED_JOBS_KEY = 'guest:savedJobs';
const GUEST_FOLLOWS_KEY = 'guest:follows';
const GUEST_SAVED_PORTFOLIOS_KEY = 'guest:savedPortfolios';

export const getGuestSavedJobs = (): string[] => readStringArray(GUEST_SAVED_JOBS_KEY);

export const addGuestSavedJob = (jobId: string) => {
  if (!jobId) return;
  const current = readStringArray(GUEST_SAVED_JOBS_KEY);
  if (current.includes(jobId)) return;
  current.push(jobId);
  writeStringArray(GUEST_SAVED_JOBS_KEY, current);
};

export const removeGuestSavedJob = (jobId: string) => {
  if (!jobId) return;
  const current = readStringArray(GUEST_SAVED_JOBS_KEY);
  if (!current.length) return;
  const next = current.filter((id) => id !== jobId);
  writeStringArray(GUEST_SAVED_JOBS_KEY, next);
};

export const clearGuestSavedJobs = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(GUEST_SAVED_JOBS_KEY);
};

export const getGuestFollows = (): string[] => readStringArray(GUEST_FOLLOWS_KEY);

export const toggleGuestFollow = (userId: string): boolean => {
  if (!userId) return false;
  const current = readStringArray(GUEST_FOLLOWS_KEY);
  if (current.includes(userId)) {
    const next = current.filter((id) => id !== userId);
    writeStringArray(GUEST_FOLLOWS_KEY, next);
    return false;
  }
  current.push(userId);
  writeStringArray(GUEST_FOLLOWS_KEY, current);
  return true;
};

export const clearGuestFollows = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(GUEST_FOLLOWS_KEY);
};

type GuestSavedPortfolio = {
  id: string;
  title?: string;
  image?: string;
  freelancerName?: string;
  freelancerId?: string;
};

const readPortfolioArray = (key: string): GuestSavedPortfolio[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string');
  } catch {
    return [];
  }
};

const writePortfolioArray = (key: string, values: GuestSavedPortfolio[]) => {
  if (!isBrowser) return;
  const byId: Record<string, GuestSavedPortfolio> = {};
  values.forEach((item) => {
    if (!item || !item.id) return;
    byId[item.id] = item;
  });
  window.localStorage.setItem(key, JSON.stringify(Object.values(byId)));
};

export const getGuestSavedPortfolios = (): GuestSavedPortfolio[] =>
  readPortfolioArray(GUEST_SAVED_PORTFOLIOS_KEY);

export const toggleGuestSavedPortfolio = (item: GuestSavedPortfolio): boolean => {
  if (!item?.id) return false;
  const current = readPortfolioArray(GUEST_SAVED_PORTFOLIOS_KEY);
  const exists = current.some((p) => p.id === item.id);
  const next = exists ? current.filter((p) => p.id !== item.id) : [...current, item];
  writePortfolioArray(GUEST_SAVED_PORTFOLIOS_KEY, next);
  return !exists;
};
