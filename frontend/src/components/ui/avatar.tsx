import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const FALLBACK_AVATAR = "/assets/fallbackavatar.jpg";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, onError, ...props }, ref) => {
  const normalizedSrc = String(src || "").trim();
  const resolvedSrc =
    normalizedSrc &&
    normalizedSrc !== "null" &&
    normalizedSrc !== "undefined" &&
    !/ui-avatars\.com/i.test(normalizedSrc)
      ? normalizedSrc
      : FALLBACK_AVATAR;

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={resolvedSrc}
      className={cn("aspect-square h-full w-full", className)}
      onError={(event) => {
        event.currentTarget.src = FALLBACK_AVATAR;
        onError?.(event);
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  >
    <img src={FALLBACK_AVATAR} alt="Default avatar" className="h-full w-full object-cover" />
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
