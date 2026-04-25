import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { OnboardingReminder } from "../OnboardingReminder";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const [showOnboardingReminder, setShowOnboardingReminder] = useState(false);

  useEffect(() => {
    // Show reminder if user is logged in, hasn't completed onboarding, and is NOT an admin
    if (user && !user.onboardingCompleted && user.role !== 'admin') {
      // Don't show on onboarding page itself
      if (!window.location.pathname.includes('/onboarding')) {
        setShowOnboardingReminder(true);
      }
    } else {
      setShowOnboardingReminder(false);
    }
  }, [user]);

  return (
    <div className="flex  flex-col bg-white">
      {showOnboardingReminder && (
        <OnboardingReminder 
          isVisible={showOnboardingReminder}
          onDismiss={() => setShowOnboardingReminder(false)}
        />
      )}
      <Navbar />
      <main className="w-full flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
