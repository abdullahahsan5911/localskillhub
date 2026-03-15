const fallbackAvatar = "/assets/fallbackavatar.jpg";

export default function Avatar({ src, name, size = 40 }) {
  const initials = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
    //   style={{ width: size, height: size }}
      className="rounded-full overflow-hidden w-16 h-16 bg-gray-200 flex items-center justify-center"
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = fallbackAvatar;
          }}
        />
      ) : (
        <img
          src={fallbackAvatar}
          alt="default avatar"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}