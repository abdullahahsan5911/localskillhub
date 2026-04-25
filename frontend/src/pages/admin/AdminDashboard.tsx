import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '@/lib/adminApi';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, FileText, CreditCard, Scale, AlertTriangle,
  TrendingUp, ShieldAlert, CheckCircle, Clock, BarChart3, Globe,
  ArrowUpRight, Zap
} from 'lucide-react';
import type { AdminAnalytics } from '@/lib/adminApi';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon, accent, href }: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: 'slate' | 'blue' | 'emerald' | 'amber' | 'red' | 'violet';
  href?: string;
}) {
  const accentMap = {
    slate:   { icon: 'bg-slate-100 text-slate-600',   border: 'hover:border-slate-300',  arrow: 'text-slate-400' },
    blue:    { icon: 'bg-blue-50 text-blue-600',       border: 'hover:border-blue-200',   arrow: 'text-blue-400' },
    emerald: { icon: 'bg-emerald-50 text-emerald-600', border: 'hover:border-emerald-200',arrow: 'text-emerald-400' },
    amber:   { icon: 'bg-amber-50 text-amber-600',     border: 'hover:border-amber-200',  arrow: 'text-amber-400' },
    red:     { icon: 'bg-red-50 text-red-600',         border: 'hover:border-red-200',    arrow: 'text-red-400' },
    violet:  { icon: 'bg-violet-50 text-violet-600',   border: 'hover:border-violet-200', arrow: 'text-violet-400' },
  };
  const a = accentMap[accent];

  const content = (
    <div className={`group bg-white border border-slate-200 rounded-2xl p-5 transition-all duration-200 ${a.border} hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.icon}`}>
          {icon}
        </div>
        {href && (
          <ArrowUpRight
            size={15}
            className={`${a.arrow} opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
          />
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-slate-600 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({
  count, label, href, severity,
}: {
  count: number; label: string; href: string; severity: 'red' | 'amber';
}) {
  if (!count) return null;
  const is = severity === 'red';
  return (
    <a
      href={href}
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-150 hover:brightness-95 ${
        is
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle size={15} className={is ? 'text-red-500' : 'text-amber-500'} />
        <span className="text-sm font-semibold">{count.toLocaleString()}</span>
        <span className="text-sm">{label}</span>
      </div>
      <ArrowUpRight size={14} className="opacity-60" />
    </a>
  );
}

// ─── Bar Row ──────────────────────────────────────────────────────────────────
function BarRow({ rank, label, count, max, color }: {
  rank: number; label: string; count: number; max: number; color: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-slate-400 font-medium w-4 text-right">{rank}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-600 w-28 truncate">{label || 'Unknown'}</span>
      <span className="text-xs font-semibold text-slate-800 tabular-nums w-8 text-right">{count}</span>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{children}</p>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ['adminAnalytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const o = data?.overview || {};
  const m = data?.marketplace || {};
  const c = data?.contracts || {};
  const r = data?.revenue || {};

  const gmv = r.gmv || 0;
  const platformFees = r.platformFees || 0;
  const processingFees = r.processingFees || 0;
  const feeRatio = gmv > 0 ? ((platformFees / gmv) * 100).toFixed(1) : '0.0';

  const hasAlerts = o.pendingVerifications > 0 || c.openDisputes > 0 || o.highRiskUsers > 0 || m.flaggedJobs > 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-end justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform health at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Live · refreshes every 60s
        </div>
      </div>

      {/* ── Alerts ── */}
      {hasAlerts && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-amber-500" />
            <SectionLabel>Needs Attention</SectionLabel>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <AlertBanner count={o.pendingVerifications} label="Pending Verifications" href="/admin/verifications" severity="amber" />
            <AlertBanner count={c.openDisputes} label="Open Disputes" href="/admin/disputes" severity="red" />
            <AlertBanner count={o.highRiskUsers} label="High Risk Users" href="/admin/users?riskLevel=high" severity="red" />
            <AlertBanner count={m.flaggedJobs} label="Flagged Jobs" href="/admin/jobs/flagged" severity="amber" />
          </div>
        </div>
      )}

      {/* ── Primary KPIs ── */}
      <div className="space-y-2.5">
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Users"
            value={o.totalUsers || 0}
            sub={`+${o.newUsers30d || 0} this month`}
            icon={<Users size={18} />}
            accent="blue"
            href="/admin/users"
          />
          <StatCard
            title="Total Jobs"
            value={m.totalJobs || 0}
            sub={`${m.activeJobs || 0} active`}
            icon={<Briefcase size={18} />}
            accent="blue"
            href="/admin/jobs"
          />
          <StatCard
            title="Contracts"
            value={c.totalContracts || 0}
            sub={`${c.activeContracts || 0} active`}
            icon={<FileText size={18} />}
            accent="violet"
            href="/admin/contracts"
          />
          <StatCard
            title="Platform Fees Earned"
            value={`$${platformFees.toFixed(2)}`}
            sub={`GMV: $${gmv.toLocaleString()}`}
            icon={<CreditCard size={18} />}
            accent="emerald"
          />
        </div>
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Disputed Contracts"
          value={c.disputedContracts || 0}
          sub={`${c.disputeRate || 0}% dispute rate`}
          icon={<Scale size={18} />}
          accent="red"
          href="/admin/disputes"
        />
        <StatCard
          title="Banned Users"
          value={o.bannedUsers || 0}
          icon={<ShieldAlert size={18} />}
          accent="red"
          href="/admin/users?isBanned=true"
        />
        <StatCard
          title="Conversion Rate"
          value={`${m.conversionRate || 0}%`}
          sub="Jobs → Completed"
          icon={<TrendingUp size={18} />}
          accent="amber"
        />
        <StatCard
          title="Communities"
          value={o.totalCommunities || 0}
          icon={<Globe size={18} />}
          accent="slate"
          href="/admin/communities"
        />
      </div>

      {/* ── Earnings Breakdown ── */}
      <div className="space-y-2.5">
        <SectionLabel>Platform Earnings</SectionLabel>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header strip */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CreditCard size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Earnings Breakdown</p>
              <p className="text-xs text-slate-400">All-time platform revenue summary</p>
            </div>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="px-6 py-5">
              <p className="text-xs font-medium text-slate-400 mb-1">Gross Merchandise Value</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                ${gmv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total contract value transacted</p>
            </div>

            <div className="px-6 py-5">
              <p className="text-xs font-medium text-slate-400 mb-1">Platform Fees Collected</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                ${platformFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-1">~{feeRatio}% of GMV</p>
            </div>

            <div className="px-6 py-5">
              <p className="text-xs font-medium text-slate-400 mb-1">Processing Fees (Client-Paid)</p>
              <p className="text-2xl font-bold text-amber-600 tabular-nums">
                ${processingFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Card fees charged to clients</p>
            </div>

            <div className="px-6 py-5 bg-emerald-50">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Net Admin Earnings</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                ${platformFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-500 mt-1">Platform fees (card fees paid by clients)</p>
            </div>
          </div>

         
        </div>
      </div>

      {/* ── Insights ── */}
      <div className="space-y-2.5">
        <SectionLabel>Marketplace Insights</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Top Cities */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Globe size={14} className="text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Top Cities</p>
            </div>
            <div className="space-y-3">
              {(data?.insights?.topCities || []).slice(0, 6).map((city: { _id: string; count: number }, i: number) => (
                <BarRow
                  key={i}
                  rank={i + 1}
                  label={city._id}
                  count={city.count}
                  max={data?.insights?.topCities?.[0]?.count || 1}
                  color="bg-blue-500"
                />
              ))}
              {(data?.insights?.topCities || []).length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No data available</p>
              )}
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <BarChart3 size={14} className="text-violet-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Jobs by Category</p>
            </div>
            <div className="space-y-3">
              {(data?.insights?.jobsByCategory || []).slice(0, 6).map((cat: { _id: string; count: number }, i: number) => (
                <BarRow
                  key={i}
                  rank={i + 1}
                  label={cat._id || 'Uncategorized'}
                  count={cat.count}
                  max={data?.insights?.jobsByCategory?.[0]?.count || 1}
                  color="bg-violet-500"
                />
              ))}
              {(data?.insights?.jobsByCategory || []).length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Role Breakdown ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <Users size={14} className="text-slate-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900">User Role Breakdown</p>
        </div>
        <div className="flex flex-wrap gap-5">
          {(data?.insights?.roleBreakdown || []).map((rb: { _id: string; count: number }) => {
            const dotColor =
              rb._id === 'freelancer' ? 'bg-blue-500' :
              rb._id === 'client' ? 'bg-emerald-500' :
              'bg-violet-500';
            return (
              <div key={rb._id} className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                <span className="capitalize text-sm text-slate-600">{rb._id}</span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">{rb.count.toLocaleString()}</span>
              </div>
            );
          })}
          {(data?.insights?.roleBreakdown || []).length === 0 && (
            <p className="text-xs text-slate-400">No role data available</p>
          )}
        </div>
      </div>

    </div>
  );
}