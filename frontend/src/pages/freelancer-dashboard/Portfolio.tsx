import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Upload, Loader, FileText, ExternalLink, FolderOpen, Link2, Tag, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { PortfolioItem } from "./types";

// ── shared field wrapper ───────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div className="space-y-1.5">
		<label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</label>
		{children}
	</div>
);

const inputCls =
	"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all";

// ── main component ─────────────────────────────────────────────────────
const Portfolio = ({ profile, onRefresh }: any) => {
	const [showForm, setShowForm]       = useState(false);
	const [editItem, setEditItem]       = useState<PortfolioItem | null>(null);
	const [form, setForm]               = useState<PortfolioItem>({ title: "", description: "", images: [""], link: "", category: "", tags: [] });
	const [tagInput, setTagInput]       = useState("");
	const [saving, setSaving]           = useState(false);
	const [imageUploading, setImageUploading] = useState(false);
	const [mounted, setMounted]         = useState(false);
	const imageFileRef                  = useRef<HTMLInputElement>(null);

	useEffect(() => { setMounted(true); }, []);

	const portfolio: PortfolioItem[] = profile?.portfolio || [];

	const resetForm = () => {
		setForm({ title: "", description: "", images: [""], link: "", category: "", tags: [] });
		setTagInput("");
		setEditItem(null);
		setShowForm(false);
	};

	const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;
		setImageUploading(true);
		try {
			const urls = await Promise.all(files.map(f => uploadToCloudinary(f).then(r => r.url)));
			setForm(f => ({ ...f, images: [...f.images.filter(Boolean), ...urls] }));
		} catch (err: any) {
			alert(err.message || "Upload failed");
		} finally {
			setImageUploading(false);
			if (imageFileRef.current) imageFileRef.current.value = "";
		}
	};

	const handleEdit = (item: PortfolioItem) => {
		setForm({ ...item });
		setEditItem(item);
		setShowForm(true);
	};

	const handleAddTag = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
			setTagInput("");
		}
	};

	const handleSave = async () => {
		if (!form.title.trim()) return;
		setSaving(true);
		try {
			const payload = { ...form, images: form.images.filter(Boolean) };
			if (editItem?._id) {
				await api.updatePortfolioItem(editItem._id, payload);
			} else {
				await api.addPortfolioItem(payload);
			}
			onRefresh();
			resetForm();
		} catch (e) {
			console.error(e);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this project?")) return;
		try {
			await api.deletePortfolioItem(id);
			onRefresh();
		} catch { }
	};

	return (
		<div className="space-y-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

			{/* ── header ─────────────────────────────────────────── */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-bold text-slate-900 tracking-tight">Showcase Your Work</h2>
					<p className="text-xs text-slate-500 mt-0.5">
						{portfolio.length} project{portfolio.length !== 1 ? "s" : ""} · visible to clients
					</p>
				</div>
				<button
					onClick={() => { setShowForm(true); setEditItem(null); }}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
				>
					<Plus className="w-4 h-4" /> Add Project
				</button>
			</div>

			{/* ── form panel ─────────────────────────────────────── */}
			{showForm && (
				<div
					className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
				>
					{/* form header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
						<div className="flex items-center gap-2.5">
							<div className="w-1.5 h-5 bg-blue-500 rounded-full" />
							<h3 className="font-semibold text-slate-900 text-sm">
								{editItem ? "Edit Project" : "New Project"}
							</h3>
						</div>
						<button
							onClick={resetForm}
							className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					<div className="p-6 space-y-5">
						<div className="grid sm:grid-cols-2 gap-4">
							<Field label="Project Title *">
								<input
									type="text"
									className={inputCls}
									placeholder="e.g. E-commerce Website Redesign"
									value={form.title}
									onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
								/>
							</Field>
							<Field label="Category">
								<select
									className={`${inputCls} cursor-pointer`}
									value={form.category}
									onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
								>
									<option value="">Select category</option>
									{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
								</select>
							</Field>
						</div>

						<Field label="Description">
							<textarea
								rows={3}
								className={`${inputCls} resize-none`}
								placeholder="Describe what you built, the problem it solved, and your role..."
								value={form.description}
								onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
							/>
						</Field>

						<Field label="Project Link">
							<div className="relative">
								<Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
								<input
									type="url"
									className={`${inputCls} pl-10`}
									placeholder="https://..."
									value={form.link}
									onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
								/>
							</div>
						</Field>

						<Field label="Images">
							<div className="flex flex-wrap gap-3">
								{form.images.filter(Boolean).map((img, i) => (
									<div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-white/[0.08] shadow-sm">
										<img src={img} alt="" className="w-full h-full object-cover" />
										<button
											type="button"
											onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
											className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X className="w-5 h-5 text-white" />
										</button>
									</div>
								))}
								<button
									type="button"
									onClick={() => imageFileRef.current?.click()}
									disabled={imageUploading}
									className="w-24 h-24 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-blue-500/50 bg-white hover:bg-blue-500/5 flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-400 transition-all disabled:opacity-40"
								>
									{imageUploading
										? <Loader className="w-5 h-5 animate-spin" />
										: <><Upload className="w-5 h-5" /><span className="text-[10px] font-medium">Upload</span></>
									}
								</button>
							</div>
							<input ref={imageFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageFileUpload} />
							<p className="text-[10px] text-slate-600 mt-1.5">Multiple files supported · JPG, PNG, WebP</p>
						</Field>

						<Field label="Tags (press Enter to add)">
							<div className="relative">
								<Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
								<input
									type="text"
									className={`${inputCls} pl-10`}
									placeholder="React, Figma, Node.js..."
									value={tagInput}
									onChange={e => setTagInput(e.target.value)}
									onKeyDown={handleAddTag}
								/>
							</div>
							{(form.tags || []).length > 0 && (
								<div className="flex flex-wrap gap-1.5 mt-2">
									{(form.tags || []).map((tag, i) => (
										<span key={i} className="flex items-center gap-1 bg-blue-500/15 text-blue-300 border border-blue-500/25 text-xs px-2.5 py-1 rounded-full">
											{tag}
											<button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}>
												<X className="w-3 h-3" />
											</button>
										</span>
									))}
								</div>
							)}
						</Field>

						<div className="flex gap-3 pt-2 border-t border-white/[0.06]">
							<button
								onClick={handleSave}
								disabled={saving || !form.title.trim()}
								className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
							>
								{saving && <Loader className="w-4 h-4 animate-spin" />}
								{saving ? "Saving..." : editItem ? "Update Project" : "Add Project"}
							</button>
							<button
								onClick={resetForm}
								className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── empty state ─────────────────────────────────────── */}
			{portfolio.length === 0 && !showForm && (
				<div
					className="rounded-2xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center bg-white shadow-[0_10px_25px_rgba(15,23,42,0.04)]"
				>
					<div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
						<FolderOpen className="w-7 h-7 text-blue-500" />
					</div>
					<p className="text-sm font-semibold text-slate-800">No projects yet</p>
					<p className="text-xs text-slate-500 mt-1 max-w-xs">
						Showcase your best work to attract higher-paying clients
					</p>
					<button
							onClick={() => setShowForm(true)}
							className="mt-5 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
						>
						<Plus className="w-4 h-4" /> Add Your First Project
					</button>
				</div>
			)}

			{/* ── grid ────────────────────────────────────────────── */}
			{portfolio.length > 0 && (
				<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
					{portfolio.map((item, idx) => {
						const cat  = CATEGORIES.find(c => c.id === item.category);
						const Icon = cat?.icon;
						return (
							<div
								key={item._id}
								className="group rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-200 transition-all duration-300 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.05)]"
								style={{
									opacity: mounted ? 1 : 0,
									transform: mounted ? "translateY(0)" : "translateY(10px)",
									transition: `opacity .3s ease ${idx * 50}ms, transform .3s ease ${idx * 50}ms, box-shadow .25s, border-color .25s`,
								}}
							>
								{/* thumbnail */}
								<div className="relative aspect-video overflow-hidden bg-slate-100">
									{item.images?.[0] ? (
										<img
											src={item.images[0]}
											alt={item.title}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
											onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
										/>
									) : (
										<div
											className="absolute inset-0 flex items-center justify-center"
											style={{ background: `linear-gradient(135deg, ${cat?.color || "#3b82f6"}14, ${cat?.lightColor || "#eff6ff"})` }}
										>
											{Icon
												? <Icon className="w-10 h-10 opacity-25" style={{ color: cat?.color || "#3b82f6" }} />
												: <FolderOpen className="w-10 h-10 text-slate-700" />
											}
										</div>
									)}

									{/* hover overlay */}
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100">
										<button
											onClick={() => handleEdit(item)}
											className="w-9 h-9 bg-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500/20 hover:scale-110 transition-all"
											title="Edit"
										>
											<FileText className="w-4 h-4 text-blue-600" />
										</button>
										{item.link && (
											<a
												href={item.link}
												target="_blank"
												rel="noopener noreferrer"
												className="w-9 h-9 bg-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-500/20 hover:scale-110 transition-all"
												title="View live"
											>
												<ExternalLink className="w-4 h-4 text-emerald-600" />
											</a>
										)}
										<button
											onClick={() => handleDelete(item._id!)}
											className="w-9 h-9 bg-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-rose-500/20 hover:scale-110 transition-all"
											title="Delete"
										>
											<X className="w-4 h-4 text-rose-500" />
										</button>
									</div>

									{/* category badge */}
									{cat && (
										<div className="absolute top-2.5 left-3">
											<span
												className="text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm"
												style={{
													color: cat.color || "#3b82f6",
													background: `${cat.color || "#3b82f6"}18`,
													border: `1px solid ${cat.color || "#3b82f6"}30`,
												}}
											>
												{cat.name}
											</span>
										</div>
									)}

									{/* image count */}
									{(item.images?.filter(Boolean).length ?? 0) > 1 && (
										<div className="absolute bottom-2 right-2.5 text-[10px] text-white/90 font-medium bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded">
											+{item.images.filter(Boolean).length - 1}
										</div>
									)}
								</div>

								{/* card body */}
								<div className="p-4">
									<div className="flex items-start justify-between gap-2 mb-1.5">
										<h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">
											{item.title}
										</h3>
										{item.link && (
											<a
												href={item.link}
												target="_blank"
												rel="noopener noreferrer"
												className="flex-shrink-0 text-slate-600 hover:text-blue-400 transition-colors"
											>
												<ChevronRight className="w-4 h-4" />
											</a>
										)}
									</div>

									{item.description && (
										<p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
											{item.description}
										</p>
									)}

									{item.tags?.length > 0 && (
										<div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
											{item.tags.slice(0, 4).map(tag => (
												<span
													key={tag}
													className="text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
												>
													{tag}
												</span>
											))}
											{item.tags.length > 4 && (
												<span className="text-[10px] text-slate-600">
													+{item.tags.length - 4}
												</span>
											)}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default Portfolio;