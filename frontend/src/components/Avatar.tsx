const fallbackAvatar = "/assets/fallbackavatar.jpg";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: number | string;
  className?: string;
}

export default function Avatar({ src, name, size, className = "" }: AvatarProps) {
  const normalizedSrc = String(src || "").trim();
  const hasValidSrc =
    !!normalizedSrc &&
    normalizedSrc !== "null" &&
    normalizedSrc !== "undefined" &&
    !/ui-avatars\.com/i.test(normalizedSrc);
  
  // Default sizes if none provided
  const width = size || 64; 
  const height = size || 64;

  return (
    <div
      style={size ? { width, height } : {}}
      className={`rounded-full overflow-hidden shrink-0 bg-gray-200 flex items-center justify-center ${!size ? 'w-16 h-16 sm:w-16 sm:h-16' : ''} ${className}`}
    >
      {hasValidSrc ? (
        <img
          src={normalizedSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = fallbackAvatar;
          }}
        />
      ) : (
        <img
          src={fallbackAvatar}
          alt={name || "User avatar"}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}