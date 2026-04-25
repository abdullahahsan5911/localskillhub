import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/layout/Navbar";
import {
  Bell, LogOut, ChevronRight, Menu, X
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  href?: string;
  children?: NavItem[];
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

const DashboardLayout = ({
  navItems,
  activeTab,
  setActiveTab,
  children,
  headerActions,
  notificationCount = 0,
  onNotificationClick,
}: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    navigate("/login");
  };

  const handleNavClick = (item: NavItem) => {
    if (item.href) {
      navigate(item.href);
    } else {
      setActiveTab(item.id);
    }
    setSidebarOpen(false);
  };

  const resolveActiveLabel = useMemo(() => {
    const findItem = (items: NavItem[]): NavItem | undefined => {
      for (const item of items) {
        if (item.id === activeTab) return item;
        if (item.children && item.children.length) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const activeItem = findItem(navItems);
    return activeItem?.label || "Dashboard";
  }, [activeTab, navItems]);

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isChildActive = (node: NavItem): boolean => {
      if (node.id === activeTab) return true;
      return !!node.children?.some(isChildActive);
    };
    const isActive = isChildActive(item);

    const paddingLeft = level === 0 ? "pl-3" : level === 1 ? "pl-9" : "pl-12";

    if (hasChildren) {
      const isOpen = openGroups[item.id] ?? isActive;
      return (
        <div key={item.id} className="space-y-0.5">
          <button
            type="button"
            onClick={() => setOpenGroups((prev) => ({ ...prev, [item.id]: !isOpen }))}
            className={`w-full flex items-center gap-3 pr-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive
                ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className={`flex items-center gap-3 flex-1 ${paddingLeft}`}>
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1 text-left truncate">{item.label}</span>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${
                isOpen ? "rotate-90 text-blue-600" : "text-slate-500"
              }`}
            />
          </button>
          {isOpen && (
            <div className="space-y-0.5">
              {item.children!.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    const isLeafActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item)}
        className={`w-full flex items-center gap-3 pr-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
          isLeafActive
            ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className={`flex items-center gap-3 flex-1 ${paddingLeft}`}>
          <Icon className="w-[18px] h-[18px] flex-shrink-0" />
          <span className="flex-1 text-left truncate">{item.label}</span>
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
              isLeafActive ? "bg-blue-100 text-blue-700" : "bg-blue-50 text-blue-700"
            }`}
          >
            {item.badge}
          </span>
        )}
        {item.href && (
          <ChevronRight
            className={`w-3.5 h-3.5 ${isLeafActive ? "text-white/80" : "text-slate-500"}`}
          />
        )}
      </button>
    );
  };

  const SidebarContent = () => (
	<div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* User profile */}
      <div className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-200 flex-shrink-0">
        <button
          onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden pt-0">
      {/* Sidebar - hidden on mobile */}
    <aside className="hidden md:flex w-56 xl:w-60 flex-col flex-shrink-0 bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-60 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
      <header className="bg-white border-b border-slate-200 h-14 px-4 lg:px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
        <p className="font-semibold text-slate-900 text-sm hidden sm:block">
              {resolveActiveLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button 
              onClick={onNotificationClick}
              className="relative p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
              title="View notifications"
            >
              <Bell className={`w-5 h-5 transition-colors ${notificationCount > 0 ? "text-slate-900 group-hover:text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
              {notificationCount > 0 && (
                notificationCount > 9
                  ? <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 rounded-full text-[10px] font-bold text-white px-1 leading-none">9+</span>
                  : <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 rounded-full text-[10px] font-bold text-white px-1 leading-none">{notificationCount}</span>
              )}
            </button>
            <Avatar className="w-8 h-8 lg:hidden">
              <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </div>
  );
};

export default DashboardLayout;
