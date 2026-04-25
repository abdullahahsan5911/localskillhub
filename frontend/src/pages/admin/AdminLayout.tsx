import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, ShieldCheck, Briefcase, FileText,
  Scale, CreditCard, Star, Globe, BarChart3, Settings,
  ScrollText, ChevronDown, ChevronRight, Menu, X, Bell,
  LogOut, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveAvatarSrc } from '@/lib/avatar';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/admin' },
  {
    label: 'Users', icon: <Users size={18} />,
    children: [
      { label: 'All Users', href: '/admin/users' },
      { label: 'Verifications', href: '/admin/verifications' },
      { label: 'Banned Users', href: '/admin/users/banned' },
      { label: 'Ban Appeals', href: '/admin/appeals' },
      { label: 'Company Verifications', href: '/admin/companies' },
    ]
  },
  {
    label: 'Jobs', icon: <Briefcase size={18} />,
    children: [
      { label: 'All Jobs', href: '/admin/jobs' },
      { label: 'Flagged Jobs', href: '/admin/jobs/flagged' },
    ]
  },
  {
    label: 'Contracts', icon: <FileText size={18} />,
    children: [
      { label: 'Active', href: '/admin/contracts?status=active' },
      { label: 'Completed', href: '/admin/contracts?status=completed' },
      { label: 'Hiring Requests', href: '/admin/hiring-requests' },
      { label: 'Disputes', href: '/admin/disputes' },
    ]
  },
  {
    label: 'Payments', icon: <CreditCard size={18} />,
    children: [
      { label: 'Escrow Monitor', href: '/admin/payments/escrow' },
      { label: 'Transactions', href: '/admin/payments/transactions' },
      { label: 'Withdrawal Requests', href: '/admin/payments/withdrawals' },
    ]
  },
  {
    label: 'Reputation', icon: <Star size={18} />,
    children: [
      { label: 'Review Moderation', href: '/admin/reviews' },
      { label: 'Scores', href: '/admin/reputation' },
    ]
  },
  {
    label: 'Community', icon: <Globe size={18} />,
    children: [
      { label: 'Communities', href: '/admin/communities' },
    ]
  },
  // { label: 'Analytics', icon: <BarChart3 size={18} />, href: '/admin/analytics' },
  { label: 'Audit Logs', icon: <ScrollText size={18} />, href: '/admin/logs' },
  { label: 'Settings', icon: <Settings size={18} />, href: '/admin/settings' },
];

function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some(c => location.pathname === c.href || location.pathname.startsWith(c.href.split('?')[0]));
  });

  if (item.href) {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        )}
      >
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  }

  const isAnyChildActive = item.children?.some(c =>
    location.pathname === c.href || location.pathname.startsWith(c.href.split('?')[0])
  );

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
          isAnyChildActive
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        )}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-7 mt-1 space-y-0.5 border-l border-slate-400 pl-3">
          {item.children?.map(child => {
            const isActive = location.pathname === child.href || location.pathname.startsWith(child.href.split('?')[0]);
            return (
              <Link
                key={child.href}
                to={child.href}
                className={cn(
                  'block px-2 py-1.5 rounded text-sm transition-colors',
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { user, isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in at all → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin → show access denied (prevents redirect loop)
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <ShieldCheck size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-1">Your account does not have admin privileges.</p>
          <p className="text-gray-500 text-sm mb-6">Logged in as: <span className="text-gray-700">{user.email}</span> (role: <span className="text-amber-600">{user.role}</span>)</p>
          <p className="text-gray-500 text-xs mb-6 max-w-sm mx-auto">
            To grant admin access, update your user document in MongoDB:<br />
            <code className="text-blue-600 text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              db.users.updateOne({'{'}"email": "{user.email}"{'}'}, {'{'}"$set": {'{'}"role": "admin"{'}'}{'}'}{'}'})
            </code>
          </p>
          <button onClick={logout} className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg text-sm transition-colors">
            Sign out &amp; use a different account
          </button>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className={cn(
      'h-full flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-gray-900 font-bold text-sm leading-none">Admin Panel</p>
            <p className="text-blue-600 text-xs mt-0.5">LocalSkillHub</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavGroup key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-300">
        <div className="flex items-center gap-3">
          <img
            src={resolveAvatarSrc(user.avatar)}
            alt={user.name}
            className="w-8 h-8 rounded-full shrink-0 ring-2 ring-blue-500/30"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-medium truncate">{user.name}</p>
              <p className="text-blue-600 text-xs">Super Admin</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white text-black">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0" style={{ width: collapsed ? 64 : 240 }}>
        <div className="fixed top-0 bottom-0" style={{ width: collapsed ? 64 : 240 }}>
          {sidebar}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 shrink-0">{sidebar}</div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-14 flex items-center gap-4 px-4 bg-gray-50/80 backdrop-blur border-b border-gray-200">
          {/* Desktop: toggle sidebar collapse */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:block text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Menu size={20} />
          </button>
          {/* Mobile: open slide-out drawer */}
          <button
            onClick={() => setMobileOpen(m => !m)}
            className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
              <AlertTriangle size={12} />
              Admin Mode
            </div>
            <button className="text-gray-600 hover:text-gray-900 transition-colors p-1.5">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
