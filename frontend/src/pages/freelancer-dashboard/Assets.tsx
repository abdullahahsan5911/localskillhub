import React, { useState, useRef, useEffect } from "react";
import { Plus, Upload, Loader, X, Tag, Package, Star, Download, Pencil, Trash2, FileCheck, Image as ImageIcon } from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { AssetItem } from "./types";
import { DEFAULT_CURRENCY } from "@/lib/currency";

// ── field label ────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div className="space-y-1.5">
		<label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</label>
		{children}
	</div>
);

const inputDark =
	"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all";

// ── main ───────────────────────────────────────────────────────────────
const Assets = ({ assets, onRefresh }: { assets: AssetItem[]; onRefresh: () => void }) => {
	const [showForm, setShowForm]             = useState(false);
	const [editItem, setEditItem]             = useState<AssetItem | null>(null);
	const [saving, setSaving]                 = useState(false);
	const [form, setForm]                     = useState<AssetItem>({ title: "", description: "", category: "", tags: [], price: 0, currency: DEFAULT_CURRENCY, fileUrl: "", previewImages: [] });
	const [tagInput, setTagInput]             = useState("");
	const [uploadingPreview, setUploadingPreview] = useState(false);
	const [uploadingFile, setUploadingFile]   = useState(false);
	const [mounted, setMounted]               = useState(false);
	const previewInputRef                     = useRef<HTMLInputElement>(null);
	const fileInputRef                        = useRef<HTMLInputElement>(null);

	useEffect(() => { setMounted(true); }, []);

	const resetForm = () => {
		setForm({ title: "", description: "", category: "", tags: [], price: 0, currency: DEFAULT_CURRENCY, fileUrl: "", previewImages: [] });
		setTagInput("");
		setEditItem(null);
		setShowForm(false);
	};

	const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
			setTagInput("");
		}
	};

	const handleUploadPreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;
		setUploadingPreview(true);
		try {
			const results = await Promise.all(files.map(f => uploadToCloudinary(f)));
			setForm(f => ({ ...f, previewImages: [...(f.previewImages || []), ...results.map(r => r.url)] }));
		} catch (err) { console.error(err); }
		finally {
			setUploadingPreview(false);
			if (previewInputRef.current) previewInputRef.current.value = "";
		}
	};

	const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingFile(true);
		try {
			const res = await uploadToCloudinary(file);
			setForm(f => ({ ...f, fileUrl: res.url }));
		} catch (err) { console.error(err); }
		finally {
			setUploadingFile(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleSave = async () => {
		if (!form.title.trim() || !form.fileUrl || !form.previewImages?.length) return;
		setSaving(true);
		try {
			const payload = { title: form.title, description: form.description, category: form.category, tags: form.tags, price: 0, currency: DEFAULT_CURRENCY, fileUrl: form.fileUrl, previewImages: form.previewImages };
			if (editItem?._id) { await api.updateAsset(editItem._id, payload); }
			else { await api.createAsset(payload); }
			resetForm();
			onRefresh();
		} catch (err) { console.error(err); }
		finally { setSaving(false); }
	};

	const handleEdit = (asset: AssetItem) => {
		setForm({ _id: asset._id, title: asset.title, description: asset.description, category: asset.category, tags: asset.tags || [], price: 0, currency: DEFAULT_CURRENCY, fileUrl: asset.fileUrl || "", previewImages: asset.previewImages || [], downloads: asset.downloads, ratings: asset.ratings });
		setEditItem(asset);
		setShowForm(true);
	};

	const handleDelete = async (asset: AssetItem) => {
		if (!asset._id || !confirm("Delete this asset?")) return;
		try { await api.deleteAsset(asset._id); onRefresh(); } catch (err) { console.error(err); }
	};

	const cat = (id: string) => CATEGORIES.find(c => c.id === id);

	return (
		<div className="space-y-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

			{/* ── header ─────────────────────────────────────────── */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-bold text-slate-900 tracking-tight">Digital Assets</h2>
					<p className="text-xs text-slate-500 mt-0.5">Turn your best work into products that earn while you sleep</p>
				</div>
				<button
					type="button"
						onClick={() => { setEditItem(null); setForm({ title: "", description: "", category: "", tags: [], price: 0, currency: DEFAULT_CURRENCY, fileUrl: "", previewImages: [] }); setShowForm(v => !v); }}
					className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
				>
					<Plus className="w-4 h-4" /> New Asset
				</button>
			</div>

			{/* ── form panel — DARK ──────────────────────────────── */}
			{showForm && (
				<div
					className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
				>
					{/* panel header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
						<div className="flex items-center gap-2.5">
							<div className="w-1.5 h-5 bg-violet-500 rounded-full" />
							<h3 className="text-sm font-semibold text-slate-900">{editItem ? "Edit Asset" : "New Digital Asset"}</h3>
						</div>
						<button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
							<X className="w-4 h-4" />
						</button>
					</div>

					<div className="p-6 grid md:grid-cols-2 gap-6">
						{/* left col */}
						<div className="space-y-4">
							<Field label="Asset Title *">
								<input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputDark} placeholder="React Admin Dashboard UI Kit" />
							</Field>

							<Field label="Description">
								<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputDark} resize-none`} rows={4} placeholder="What's included? Who is it for?" />
							</Field>

							<Field label="Category">
								<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`${inputDark} cursor-pointer`}>
									<option value="">Select category</option>
									{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
								</select>
							</Field>

							<Field label="Tags (press Enter)">
								<div className={`${inputDark} flex flex-wrap gap-1.5 min-h-[42px] h-auto`}>
									{(form.tags || []).map((tag, i) => (
										<span key={i} className="flex items-center gap-1 bg-violet-500/15 text-violet-300 border border-violet-500/25 text-[11px] px-2 py-0.5 rounded-full">
											{tag}
											<button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}><X className="w-3 h-3" /></button>
										</span>
									))}
									<input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder={form.tags?.length ? "" : "Figma, React, Tailwind…"} className="flex-1 min-w-[100px] bg-transparent text-xs text-white placeholder-slate-600 outline-none" />
								</div>
							</Field>
						</div>

						{/* right col */}
						<div className="space-y-4">
							

							{/* preview images */}
							<Field label="Preview Images">
								<div className="flex flex-wrap gap-2 mb-2">
									{(form.previewImages || []).map((img, i) => (
										<div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/[0.08]">
											<img src={img} alt="" className="w-full h-full object-cover" />
											<button type="button" onClick={() => setForm(f => ({ ...f, previewImages: (f.previewImages || []).filter((_, j) => j !== i) }))} className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
												<X className="w-4 h-4 text-white" />
											</button>
										</div>
									))}
									<button type="button" onClick={() => previewInputRef.current?.click()} disabled={uploadingPreview} className="w-20 h-20 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-violet-500/50 bg-white hover:bg-violet-500/5 flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-violet-400 transition-all disabled:opacity-40">
										{uploadingPreview ? <Loader className="w-4 h-4 animate-spin" /> : <><ImageIcon className="w-4 h-4" /><span className="text-[10px]">Add</span></>}
									</button>
								</div>
								<input ref={previewInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadPreview} />
							</Field>

							{/* asset file */}
							<Field label="Asset File *">
								{form.fileUrl ? (
									<div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
										<FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
										<span className="text-xs text-emerald-300 flex-1 truncate">File uploaded</span>
										<button type="button" onClick={() => setForm(f => ({ ...f, fileUrl: "" }))} className="text-[10px] text-rose-400 hover:text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-lg">Remove</button>
									</div>
								) : (
									<button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/[0.08] hover:border-violet-500/40 bg-white hover:bg-violet-500/5 rounded-xl text-slate-500 hover:text-violet-400 text-xs font-medium transition-all disabled:opacity-40">
										{uploadingFile ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
										{uploadingFile ? "Uploading…" : "Upload asset file (ZIP, PDF, Figma…)"}
									</button>
								)}
								<input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFile} />
							</Field>
						</div>
					</div>

					{/* form footer */}
					<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
						<button onClick={resetForm} className="px-5 py-2 text-slate-400 hover:text-white text-sm font-medium rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all">
							Cancel
						</button>
						<button
							type="button" onClick={handleSave}
							disabled={saving || !form.title.trim() || !form.fileUrl || !form.previewImages?.length}
							className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-600/20"
						>
							{saving && <Loader className="w-4 h-4 animate-spin" />}
							{saving ? "Saving…" : editItem ? "Update Asset" : "Publish Asset"}
						</button>
					</div>
				</div>
			)}

			{/* ── empty state ─────────────────────────────────────── */}
			{assets.length === 0 && !showForm && (
				<div className="rounded-2xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center bg-white shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
					<div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
						<Package className="w-7 h-7 text-blue-500" />
					</div>
					<p className="text-sm font-semibold text-slate-800">No assets published yet</p>
					<p className="text-xs text-slate-500 mt-1 max-w-xs">Upload templates, UI kits, or code snippets people can download anytime</p>
					<button onClick={() => setShowForm(true)} className="mt-5 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20">
						<Plus className="w-4 h-4" /> Upload First Asset
					</button>
				</div>
			)}

			{/* ── cards grid — LIGHT ─────────────────────────────── */}
			{assets.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{assets.map((asset, idx) => {
						const category = cat(asset.category);
						const Icon = category?.icon;
						return (
							<div
								key={asset._id}
								className="group rounded-2xl border border-slate-200 overflow-hidden hover:border-violet-200 transition-all duration-300 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.05)]"
								style={{
									opacity: mounted ? 1 : 0,
									transform: mounted ? "translateY(0)" : "translateY(10px)",
									transition: `opacity .3s ease ${idx * 50}ms, transform .3s ease ${idx * 50}ms, box-shadow .25s`,
								}}
							>
								{/* thumbnail */}
								<div className="relative aspect-video overflow-hidden bg-slate-100">
									{asset.previewImages?.[0] ? (
										<img src={asset.previewImages[0]} alt={asset.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
									) : (
										<div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${category?.color || "#8b5cf6"}12, ${category?.lightColor || "#f5f3ff"})` }}>
											{Icon ? <Icon className="w-10 h-10 opacity-20" style={{ color: category?.color || "#8b5cf6" }} /> : <Package className="w-10 h-10 text-slate-700" />}
										</div>
									)}

									{/* access badge */}
									<div className="absolute top-2.5 right-3">
										<span
											className="text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-400"
											style={{
												background: "rgba(10,13,24,0.82)",
												border: "1px solid rgba(52,211,153,0.35)",
												backdropFilter: "blur(4px)",
											}}
										>
											Free
										</span>
									</div>

									{/* category badge */}
									{category && (
										<div className="absolute top-2.5 left-3">
											<span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full" 
											style={{ color: category.color || "#8b5cf6",
											 background: "rgba(10,13,24,0.82)", border: `1px solid ${category.color || "#8b5cf6"}50`,
											 backdropFilter: "blur(4px)" }}>
												{category.name}
											</span>
										</div>
									)}

									{/* hover actions */}
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100">
										<button onClick={() => handleEdit(asset)} className="w-9 h-9 bg-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-500/20 hover:scale-110 transition-all" title="Edit">
											<Pencil className="w-4 h-4 text-blue-600" />
										</button>
										<button onClick={() => handleDelete(asset)} className="w-9 h-9 bg-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-rose-500/20 hover:scale-110 transition-all" title="Delete">
											<Trash2 className="w-4 h-4 text-rose-500" />
										</button>
									</div>
								</div>

								{/* card body */}
								<div className="p-4 bg-white">
									<h3 className="text-sm font-semibold text-slate-900 truncate mb-1">{asset.title}</h3>
									{asset.description && <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{asset.description}</p>}

									{/* tags */}
									{asset.tags?.length > 0 && (
										<div className="flex flex-wrap gap-1.5 mt-2.5">
											{asset.tags.slice(0, 3).map(tag => (
												<span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">{tag}</span>
											))}
											{asset.tags.length > 3 && <span className="text-[10px] text-slate-600">+{asset.tags.length - 3}</span>}
										</div>
									)}

									{/* stats row */}
									<div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
										<div className="flex items-center gap-3">
											<span className="flex items-center gap-1 text-[11px] text-slate-500">
												<Download className="w-3 h-3" /> {asset.downloads ?? 0}
											</span>
											{asset.ratings?.count ? (
												<span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
													<Star className="w-3 h-3 fill-current" /> {asset.ratings.average.toFixed(1)}
													<span className="text-slate-600 font-normal">({asset.ratings.count})</span>
												</span>
											) : (
												<span className="text-[11px] text-slate-600">New</span>
											)}
										</div>
										<div className="flex items-center gap-1">
											<button onClick={() => handleEdit(asset)} className="p-1.5 rounded-lg hover:bg-white/[0.07] text-slate-600 hover:text-blue-400 transition-colors" title="Edit">
												<Pencil className="w-3.5 h-3.5" />
											</button>
											<button onClick={() => handleDelete(asset)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-colors" title="Delete">
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default Assets;