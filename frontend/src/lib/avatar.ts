export const FALLBACK_AVATAR = "/assets/fallbackavatar.jpg";

export const resolveAvatarSrc = (value?: string | null): string => {
  const normalized = String(value || "").trim();

  if (!normalized) return FALLBACK_AVATAR;
  if (normalized === "null" || normalized === "undefined") return FALLBACK_AVATAR;
  if (/ui-avatars\.com/i.test(normalized)) return FALLBACK_AVATAR;

  return normalized;
};
