import React from "react";

interface MainContentProps {
  children?: React.ReactNode;
}

/**
 * MainContent Component
 * 
 * Right main content area for displaying tabs and content.
 * Works alongside ProfileSidebar in Behance-style layout.
 */
export const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="flex-1 w-full">
      {children}
    </main>
  );
};
