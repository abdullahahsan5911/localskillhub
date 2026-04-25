import React from "react";
import { MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProfileSidebarProps {
  name: string;
  title?: string;
  location?: string;
  email?: string;
  onEditClick?: () => void;
  onCustomizeClick?: () => void;
  availabilitySection?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * ProfileSidebar Component
 * 
 * Left sidebar showing profile info, location, and action buttons.
 * Matches Behance-style profile sidebar.
 */
export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  name,
  title,
  location,
  email,
  onEditClick,
  onCustomizeClick,
  availabilitySection,
  children,
}) => {
  return (
    <aside className="w-full md:w-72 shrink-0">
      <div className="space-y-4 sm:space-y-6">
        {/* Profile Info */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{name}</h1>
          {title && <p className="text-sm sm:text-base text-slate-600 font-semibold">{title}</p>}
          
          {location && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{location}</span>
            </div>
          )}

          {email && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 sm:space-y-3">
          <Button
            onClick={onEditClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full py-2 sm:py-3 text-sm sm:text-base"
          >
            Edit Profile Info
          </Button>

          <Button
            onClick={onCustomizeClick}
            variant="outline"
            className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold rounded-full py-2 sm:py-3 text-sm sm:text-base"
          >
            Customize Profile
          </Button>
        </div>

        {/* Availability Section */}
        {availabilitySection && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            {availabilitySection}
          </div>
        )}

        {/* Additional Content */}
        {children && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    </aside>
  );
};
