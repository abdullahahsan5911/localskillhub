import React, { useEffect, useState } from "react";
import { Eye, CheckCircle2, DollarSign, Star, Target, TrendingUp, Trophy, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { Analytics, FreelancerProfile, Contract } from "./types";

// ── tiny shimmer skeleton ──────────────────────────────────────────────
const Skeleton = ({ className = "" }: { className?: string }) => (
	<div className={`animate-pulse rounded bg-slate-200 ${className}`} />
);

// ── sparkline (pure SVG) ───────────────────────────────────────────────
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
	const max = Math.max(...data);
	const min = Math.min(...data);
	const range = max - min || 1;
	const w = 80, h = 28;
	const pts = data
		.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
		.join(" ");
	return (
		<svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7" fill="none">
			<polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
};

// ── delta badge ────────────────────────────────────────────────────────
const Delta = ({ value }: { value: number }) => {
	if (value === 0) return <span className="flex items-center gap-0.5 text-xs text-slate-500"><Minus className="w-3 h-3" />0%</span>;
	const up = value > 0;
	return (
		<span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}>
			{up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
			{Math.abs(value)}%
		</span>
	);
};

// ── main component ─────────────────────────────────────────────────────
const Overview = ({
	analytics,
	profile,
	loading,
	contracts,
}: {
	analytics: Analytics | null;
	profile: FreelancerProfile | null;
	loading: boolean;
	contracts?: Contract[];
}) => {
	const [mounted, setMounted] = useState(false);
	useEffect(() => { setMounted(true); }, []);

	// Derive net earnings from contracts so Overview matches Contracts tab
	const allContracts = Array.isArray(contracts) ? contracts : [];

	const calcNetReleased = (c: Contract): number => {
		const total = c.amount?.total ?? 0;
		if (!total) return 0;
		const platformFeePercentage = (c as any).platformFee?.percentage ?? 3;
		const platformFee = (total * platformFeePercentage) / 100;
		const freelancerNet = total - platformFee;
		const grossReleased = c.totalPaid ?? 0;
		const releaseRatio = total > 0 ? Math.min(grossReleased / total, 1) : 0;
		if (releaseRatio <= 0) return 0;
		return freelancerNet * releaseRatio;
	};

	let netLifetimeEarnings = analytics?.totalEarnings ?? 0;
	let netCurrentMonthEarnings = analytics?.currentMonthEarnings ?? 0;

	if (allContracts.length > 0) {
		netLifetimeEarnings = allContracts.reduce((sum, c) => sum + calcNetReleased(c), 0);

		const now = new Date();
		netCurrentMonthEarnings = allContracts.reduce((sum, c) => {
			if (c.status !== "completed") return sum;
			const completedAtRaw = (c as any).actualEndDate || (c as any).updatedAt || (c as any).endDate;
			if (!completedAtRaw) return sum;
			const completedAt = new Date(completedAtRaw);
			if (
				completedAt.getFullYear() === now.getFullYear() &&
				completedAt.getMonth() === now.getMonth()
			) {
				return sum + calcNetReleased(c);
			}
			return sum;
		}, 0);
	}

	// fake sparkline data per card for visual richness
	const sparks = {
		views:    [18, 24, 20, 30, 28, 35, 32, 40, 38, 45],
		jobs:     [2,  3,  2,  4,  3,  5,  4,  6,  5,  7],
		earnings: [12, 18, 14, 22, 20, 28, 24, 32, 30, 38],
		rating:   [4.1, 4.2, 4.0, 4.3, 4.2, 4.4, 4.3, 4.5, 4.4, 4.6],
	};

	const completionItems = [
		{ label: "Profile title",   done: !!profile?.title },
		{ label: "Bio & overview",  done: !!profile?.bio },
		{ label: "Skills",          done: (profile?.skills?.length ?? 0) > 0 },
		{ label: "Portfolio item",  done: (profile?.portfolio?.length ?? 0) > 0 },
		{ label: "Hourly rate",     done: !!profile?.rates?.minRate },
	];
	const doneCount   = completionItems.filter(i => i.done).length;
	const completePct = Math.round((doneCount / completionItems.length) * 100);
	const circumference = 2 * Math.PI * 26; // r=26

	const kpis = [
		{
			label: "Profile Views",
			value: analytics?.profileViews ?? 0,
			display: (analytics?.profileViews ?? 0).toLocaleString(),
			delta: 12,
			icon: Eye,
			accent: "#3b82f6",
			spark: sparks.views,
		},
		{
			label: "Completed Jobs",
			value: analytics?.completedJobs ?? 0,
			display: (analytics?.completedJobs ?? 0).toLocaleString(),
			delta: 8,
			icon: CheckCircle2,
			accent: "#10b981",
			spark: sparks.jobs,
		},
		{
			label: "Total Earnings",
			value: netLifetimeEarnings,
			display: `${netLifetimeEarnings.toLocaleString()}`,
			delta: 21,
			icon: DollarSign,
			accent: "#f59e0b",
			spark: sparks.earnings,
		},
		{
			label: "Avg Rating",
			value: analytics?.averageRating ?? 0,
			display: analytics?.averageRating ? analytics.averageRating.toFixed(1) : "—",
			delta: 3,
			icon: Star,
			accent: "#a855f7",
			spark: sparks.rating,
		},
	];

	return (
		<div
			className="space-y-5 font-sans"
			style={{ fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif" }}
		>
			{/* ── top metric cards ─────────────────────────────────── */}
			<div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
				{kpis.map((kpi, i) => {
					const Icon = kpi.icon;
					return (
						<div
							key={kpi.label}
							className="relative overflow-hidden rounded-2xl p-5 border border-slate-300 bg-white"
							style={{
								opacity: mounted ? 1 : 0,
								transform: mounted ? "translateY(0)" : "translateY(12px)",
								transition: `opacity .35s ease ${i * 60}ms, transform .35s ease ${i * 60}ms`,
								boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
							}}
						>
							{/* subtle glow blob */}
							<div
								className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
								style={{ background: kpi.accent }}
							/>

							<div className="relative flex items-start justify-between mb-4">
								<div
									className="w-9 h-9 rounded-xl flex items-center justify-center"
									style={{ background: `${kpi.accent}22` }}
								>
									<Icon className="w-4.5 h-4.5" style={{ color: kpi.accent, width: 18, height: 18 }} />
								</div>
								<Delta value={kpi.delta} />
							</div>

							{loading ? (
								<>
									<Skeleton className="h-7 w-24 mb-1" />
									<Skeleton className="h-3.5 w-16" />
								</>
							) : (
								<>
									<p className="text-[1.6rem] font-bold tracking-tight text-slate-900 leading-none">
										{kpi.display}
									</p>
									<p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
								</>
							)}

							<div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
								<span className="text-[10px] text-slate-600 uppercase tracking-wider">vs last month</span>
								<Sparkline data={kpi.spark} color={kpi.accent} />
							</div>
						</div>
					);
				})}
			</div>

			{/* ── lower row ────────────────────────────────────────── */}
			<div className="grid lg:grid-cols-3 gap-4">

				{/* Profile Health */}
				<div
					className="rounded-2xl border border-slate-300 bg-white p-5"
					style={{ boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}
				>
					<div className="flex items-center justify-between mb-5">
						<h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
							<Target className="w-4 h-4 text-blue-400" /> Profile Health
						</h3>
						<span className="text-xs font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
							{completePct}%
						</span>
					</div>

					{/* circular progress */}
					<div className="flex items-center gap-5 mb-5">
						<div className="relative w-16 h-16 flex-shrink-0">
							<svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
								<circle cx="30" cy="30" r="26" fill="none" stroke="#e5e7eb" strokeWidth="5" />
								<circle
									cx="30" cy="30" r="26" fill="none"
									stroke="#3b82f6" strokeWidth="5"
									strokeLinecap="round"
									strokeDasharray={circumference}
									strokeDashoffset={circumference - (completePct / 100) * circumference}
									style={{ transition: "stroke-dashoffset .6s ease" }}
								/>
							</svg>
							<span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">
								{doneCount}/{completionItems.length}
							</span>
						</div>
						<p className="text-xs text-slate-500 leading-relaxed">
							{completePct === 100
								? "Your profile is fully optimised 🎉"
								: `Complete ${completionItems.length - doneCount} more ${completionItems.length - doneCount === 1 ? "item" : "items"} to boost visibility.`}
						</p>
					</div>

					<div className="space-y-2.5">
						{completionItems.map(item => (
							<div key={item.label} className="flex items-center gap-3">
								{item.done ? (
									<CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
								) : (
									<div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
								)}
								<span className={`text-xs ${item.done ? "text-slate-700" : "text-slate-500"}`}>
									{item.label}
								</span>
								{item.done && (
									<span className="ml-auto text-[10px] text-emerald-600 font-medium">Done</span>
								)}
							</div>
						))}
					</div>
				</div>

				{/* This Month */}
				<div
					className="rounded-2xl border border-slate-300 bg-white p-5"
					style={{ boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}
				>
					<div className="flex items-center justify-between mb-5">
						<h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
							<TrendingUp className="w-4 h-4 text-emerald-400" /> This Month
						</h3>
						<Delta value={21} />
					</div>

					<div className="mb-5">
						{loading ? (
							<Skeleton className="h-10 w-36" />
						) : (
							<p className="text-4xl font-bold tracking-tight text-slate-900">
								{netCurrentMonthEarnings.toLocaleString()}
							</p>
						)}
						<p className="text-xs text-slate-500 mt-1">Monthly earnings</p>
					</div>

					{/* mini bar chart */}
					<div className="flex items-end gap-1 h-12 mb-5" aria-hidden="true">
						{[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
							<div
								key={i}
								className="flex-1 rounded-sm"
								style={{
									height: `${h}%`,
									background: i === 6
										? "#10b981"
										: `rgba(16,185,129,${0.12 + i * 0.05})`,
									transition: `height .5s ease ${i * 40}ms`,
								}}
							/>
						))}
					</div>

					<div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-300">
						<div className="bg-slate-50 rounded-xl p-3">
							<p className="text-xl font-bold text-slate-900">{analytics?.activeContracts ?? 0}</p>
							<p className="text-[10px] text-slate-500 mt-0.5">Active contracts</p>
						</div>
						<div className="bg-slate-50 rounded-xl p-3">
							<p className="text-xl font-bold text-slate-900">
								{analytics?.completedJobs ?? 0}
							</p>
							<p className="text-[10px] text-slate-500 mt-0.5">Completed jobs</p>
						</div>
					</div>
				</div>

				{/* Local Rank */}
				<div
					className="rounded-2xl border border-slate-300 bg-white p-5 flex flex-col"
					style={{ boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}
				>
					<div className="flex items-center justify-between mb-5">
						<h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
							<Trophy className="w-4 h-4 text-amber-400" /> Local Rank
						</h3>
						{analytics?.localRank && (
							<span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
								Top {Math.round((analytics.localRank.rank / analytics.localRank.totalFreelancers) * 100)}%
							</span>
						)}
					</div>

					{analytics?.localRank ? (
						<>
							<div className="flex-1 flex flex-col items-center justify-center py-4">
								{/* medal ring */}
								<div className="relative w-24 h-24 mb-3">
									<svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
										<circle cx="48" cy="48" r="40" fill="none" stroke="#1e2535" strokeWidth="6" />
										<circle
											cx="48" cy="48" r="40" fill="none"
											stroke="url(#goldGrad)" strokeWidth="6"
											strokeLinecap="round"
											strokeDasharray={2 * Math.PI * 40}
											strokeDashoffset={2 * Math.PI * 40 * 0.25}
										/>
										<defs>
											<linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
												<stop offset="0%" stopColor="#f59e0b" />
												<stop offset="100%" stopColor="#fcd34d" />
											</linearGradient>
										</defs>
									</svg>
									<div className="absolute inset-0 flex flex-col items-center justify-center">
										<span className="text-3xl font-black text-white leading-none">
											#{analytics.localRank.rank}
										</span>
									</div>
								</div>
								<p className="text-sm font-semibold text-slate-300">{analytics.localRank.city}</p>
								<p className="text-xs text-slate-600 mt-0.5">
									of {analytics.localRank.totalFreelancers.toLocaleString()} freelancers
								</p>
							</div>

							{/* podium mini viz */}
							<div className="flex items-end justify-center gap-2 pt-4 border-t border-white/[0.05]">
								{[
									{ pos: 2, h: 32, color: "#94a3b8" },
									{ pos: 1, h: 44, color: "#f59e0b" },
									{ pos: 3, h: 24, color: "#b45309" },
								].map(p => (
									<div key={p.pos} className="flex flex-col items-center gap-1">
										<span className="text-[9px] text-slate-600">#{p.pos}</span>
										<div
											className="w-8 rounded-t-sm"
											style={{ height: p.h, background: p.color, opacity: p.pos === 1 ? 1 : 0.4 }}
										/>
									</div>
								))}
							</div>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-center py-6">
							<Trophy className="w-10 h-10 text-slate-700 mb-3" />
							<p className="text-sm text-slate-600">Complete your profile</p>
							<p className="text-xs text-slate-500 mt-1">to unlock local ranking</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Overview;