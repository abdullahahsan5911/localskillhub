import React, { useEffect, useState } from "react";
import { Camera, Loader, Check, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export interface ProfileHeaderProps {
  bannerUrl?: string;
  avatarUrl: string;
  name: string;
  onBannerUpdate?: (url: string) => void;
  onAvatarUpdate?: (url: string) => void;
}

/**
 * ProfileHeader Component
 * 
 * Displays banner image and profile avatar section.
 * Handles Cloudinary uploads directly (self-contained).
 * Matches Behance-style profile header layout.
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  bannerUrl: initialBannerUrl = "",
  avatarUrl: initialAvatarUrl,
  name,
  onBannerUpdate,
  onAvatarUpdate,
}) => {
  const { refreshUser } = useAuth();
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingBannerPreviewUrl, setPendingBannerPreviewUrl] = useState<string | null>(null);
  const [pendingAvatarPreviewUrl, setPendingAvatarPreviewUrl] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setBannerUrl(initialBannerUrl);
  }, [initialBannerUrl]);

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  useEffect(() => {
    return () => {
      if (pendingBannerPreviewUrl) URL.revokeObjectURL(pendingBannerPreviewUrl);
      if (pendingAvatarPreviewUrl) URL.revokeObjectURL(pendingAvatarPreviewUrl);
    };
  }, [pendingBannerPreviewUrl, pendingAvatarPreviewUrl]);

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (pendingBannerPreviewUrl) {
      URL.revokeObjectURL(pendingBannerPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingBannerFile(file);
    setPendingBannerPreviewUrl(previewUrl);
    setBannerUrl(previewUrl);
    e.target.value = "";
  };

  const cancelPendingBanner = () => {
    if (pendingBannerPreviewUrl) {
      URL.revokeObjectURL(pendingBannerPreviewUrl);
    }
    setPendingBannerFile(null);
    setPendingBannerPreviewUrl(null);
    setBannerUrl(initialBannerUrl);
  };

  const savePendingBanner = async () => {
    if (!pendingBannerFile) return;

    setBannerUploading(true);
    try {
      console.log("Starting banner upload...", pendingBannerFile);
      const result = await uploadToCloudinary(pendingBannerFile, 'banners');
      console.log("Cloudinary response:", result);
      
      if (!result || !result.url) {
        throw new Error("Invalid upload response: no URL returned");
      }
      
      setBannerUrl(result.url);
      
      console.log("Updating profile with banner URL:", result.url);
      const apiResponse = await api.updateProfile({ bannerImage: result.url });
      console.log("API response:", apiResponse);
      
      if (!apiResponse?.data) {
        throw new Error("Failed to update profile");
      }
      
      // Refresh user context to ensure data is synced
      await refreshUser?.();
      onBannerUpdate?.(result.url);
      if (pendingBannerPreviewUrl) {
        URL.revokeObjectURL(pendingBannerPreviewUrl);
      }
      setPendingBannerFile(null);
      setPendingBannerPreviewUrl(null);
      console.log("Banner upload completed successfully");
    } catch (err: any) {
      console.error("Banner upload error:", err);
      alert(err.message || "Banner upload failed");
      if (pendingBannerPreviewUrl) {
        URL.revokeObjectURL(pendingBannerPreviewUrl);
      }
      setPendingBannerFile(null);
      setPendingBannerPreviewUrl(null);
      setBannerUrl(initialBannerUrl);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (pendingAvatarPreviewUrl) {
      URL.revokeObjectURL(pendingAvatarPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarFile(file);
    setPendingAvatarPreviewUrl(previewUrl);
    setAvatarUrl(previewUrl);
    e.target.value = "";
  };

  const cancelPendingAvatar = () => {
    if (pendingAvatarPreviewUrl) {
      URL.revokeObjectURL(pendingAvatarPreviewUrl);
    }
    setPendingAvatarFile(null);
    setPendingAvatarPreviewUrl(null);
    setAvatarUrl(initialAvatarUrl);
  };

  const savePendingAvatar = async () => {
    if (!pendingAvatarFile) return;

    setAvatarUploading(true);
    try {
      console.log("Starting avatar upload...", pendingAvatarFile);
      const result = await uploadToCloudinary(pendingAvatarFile, 'avatars');
      console.log("Cloudinary response:", result);
      
      if (!result || !result.url) {
        throw new Error("Invalid upload response: no URL returned");
      }
      
      setAvatarUrl(result.url);
      
      console.log("Updating profile with avatar URL:", result.url);
      const apiResponse = await api.updateProfile({ avatar: result.url });
      console.log("API response:", apiResponse);
      
      if (!apiResponse?.data) {
        throw new Error("Failed to update profile");
      }
      
      // Refresh user context to ensure data is synced
      await refreshUser?.();
      onAvatarUpdate?.(result.url);
      if (pendingAvatarPreviewUrl) {
        URL.revokeObjectURL(pendingAvatarPreviewUrl);
      }
      setPendingAvatarFile(null);
      setPendingAvatarPreviewUrl(null);
      console.log("Avatar upload completed successfully");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      alert(err.message || "Avatar upload failed");
      if (pendingAvatarPreviewUrl) {
        URL.revokeObjectURL(pendingAvatarPreviewUrl);
      }
      setPendingAvatarFile(null);
      setPendingAvatarPreviewUrl(null);
      setAvatarUrl(initialAvatarUrl);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="relative mb-8 ">
      {/* Banner Section */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-slate-800 to-slate-700 rounded-b-2xl overflow-hidden group">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}

        {/* Uploading State */}
        {bannerUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="text-center">
              <Loader className="w-10 h-10 text-white mx-auto mb-2 animate-spin" />
              <p className="text-white text-sm font-semibold">Uploading Banner...</p>
            </div>
          </div>
        )}

        {/* Banner Upload Overlay */}
        <label
          htmlFor="banner-upload"
          className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center cursor-pointer opacity-0  z-40"
        >
          <div className="text-center pointer-events-none">
            <Camera className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white text-sm font-semibold">Add Banner</p>
            <p className="text-white/70 text-xs">3200 x 410px</p>
          </div>
        </label>

        {/* Hidden file input */}
        <input
          id="banner-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerFileSelect}
          disabled={bannerUploading}
        />

        {pendingBannerFile && !bannerUploading && (
          <div className="absolute right-3 top-3 z-50 flex items-center gap-2 rounded-xl bg-black/65 px-2.5 py-2">
            <button
              type="button"
              onClick={savePendingBanner}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600"
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button
              type="button"
              onClick={cancelPendingBanner}
              className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/25"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        )}

        {/* No Banner State */}
        {!bannerUrl && !bannerUploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-12 h-12 text-white/50 mx-auto mb-2" />
              <p className="text-white/70 text-sm font-semibold">Add a Banner Image</p>
              <p className="text-white/50 text-xs">Optimal dimensions 3200 x 410px</p>
            </div>
          </div>
        )}
      </div>

      {/* Avatar overlaid on banner */}
      <div className="absolute -bottom-12 left-6 sm:left-8 group/avatar">
        <div className="relative">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-white shadow-lg">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-slate-800 text-white text-3xl font-bold">
              {name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Avatar Uploading State */}
          {avatarUploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center z-50">
              <Loader className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
            </div>
          )}

          {/* Avatar Upload Overlay */}
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 rounded-full bg-black/30 group-hover/avatar:bg-black/50 transition-colors flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 z-40"
          >
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white pointer-events-none" />
          </label>

          {/* Hidden file input */}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileSelect}
            disabled={avatarUploading}
          />

          {pendingAvatarFile && !avatarUploading && (
            <div className="absolute -bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900/90 px-2 py-1.5 shadow-lg">
              <button
                type="button"
                onClick={savePendingAvatar}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600"
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button
                type="button"
                onClick={cancelPendingAvatar}
                className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/25"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
