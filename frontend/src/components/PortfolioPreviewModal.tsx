import React from "react";
import { FiX } from "react-icons/fi";
import { BsTools } from "react-icons/bs";
import { BiSolidFolderOpen } from "react-icons/bi";
import { LuShare } from "react-icons/lu";
import Avatar from "./Avatar";
import { MdThumbUp } from "react-icons/md";
import { IoIosMail } from "react-icons/io";
import { Plus } from "lucide-react";
import { getToolIcon, getToolIconColorClass } from "@/constants/tools";
import { getSkillIcon } from "@/constants/skills";

interface AuthorInfo {
    id: string;
    name?: string;
    avatarUrl?: string;
    verified?: boolean;
}

interface StatsInfo {
    completedJobs?: number;
    views?: number;
    rating?: number;
}

interface PortfolioPreviewModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    imageUrl?: string;
    author: AuthorInfo;
    stats?: StatsInfo;
    onSaveClick?: () => void;
    isSaved?: boolean;
    onFollowClick?: () => void;
    isFollowing?: boolean;
    onHireClick?: () => void;
    onShareClick?: () => void;
    onAppreciateClick?: () => void;
    isAppreciated?: boolean;
    appreciationCount?: number;
    onProfileClick?: () => void;
    iconGridItems?: Array<{ label: string; type: "tool" | "skill" }>;
}

const PortfolioPreviewModal: React.FC<PortfolioPreviewModalProps> = ({
    open,
    onClose,
    title,
    description,
    imageUrl,
    author,
    stats,
    onSaveClick,
    isSaved,
    onFollowClick,
    isFollowing,
    onHireClick,
    onShareClick,
    onAppreciateClick,
    isAppreciated,
    appreciationCount,
    onProfileClick,
    iconGridItems = [],
}) => {
    if (!open) return null;

    const displayName = author.name || "Freelancer";
    const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-3"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full h-full text-white rounded-none md:rounded-2xl overflow-hidden flex flex-col">
                {/* Top bar */}
                <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden text-sm font-semibold shrink-0">
                            <Avatar
                                src={author.avatarUrl}
                                name={displayName}
                            // size={"md"}
                            />

                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{displayName}</p>
                            {title && (
                                <p className="text-xs text-slate-400 truncate">{title}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onFollowClick}
                            disabled={!onFollowClick}
                            className="inline-flex md:hidden items-center max-w-[86px] sm:max-w-none truncate px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 border border-slate-700"
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </button>
                        {onProfileClick && (
                            <button
                                type="button"
                                onClick={onProfileClick}
                                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 border border-slate-700"
                            >
                                View profile
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-slate-300 shrink-0"
                            aria-label="Close preview"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="relative flex-1  flex flex-col md:flex-row overflow-hidden min-h-0">
                    {/* Main image / content */}
                    <div className="relative z-0 flex-1  bg-black overflow-y-auto overflow-x-hidden min-h-0 pb-36 md:pb-0">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={title || "Portfolio item"}
                                className="block w-full h-full md:min-h-full object-cover object-center md:object-top"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-600 text-sm">No image available</div>
                        )}
                    </div>

                    {/* Right rail actions & meta */}
                    <aside className="absolute bottom-0 left-0 right-0 z-20 w-full md:static md:w-24 h-auto md:h-fit flex flex-row md:flex-col justify-center md:justify-evenly items-stretch md:items-center border-t md:border-t-0 md:border-l border-slate-800/80 bg-black/80 md:bg-black/40 backdrop-blur-md md:backdrop-blur-sm">
                        <div className="w-full p-2 sm:p-3 md:p-5">
                            <div className="hidden md:flex items-center md:flex-col justify-center gap-1 rounded-xl py-2 mb-2">
                                <button
                                    type="button"
                                    onClick={onFollowClick}
                                    className="relative shrink-0"
                                    disabled={!onFollowClick}
                                >
                                    <Avatar
                                        src={author.avatarUrl}
                                        name={displayName}
                                        size="md"
                                    />
                                    <span
                                        className={`absolute bottom-0 right-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${isFollowing ? "bg-white text-blue-700 border border-blue-700" : "bg-blue-700 text-white"}`}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </span>
                                </button>
                                <span className="text-gray-400 text-sm">
                                    {isFollowing ? "Following" : "Follow"}
                                </span>
                            </div>
                            {/* Action buttons (Behance-inspired, but generic) */}
                            <div className="flex flex-row md:flex-col items-center md:items-stretch gap-1 md:gap-0 text-[11px] text-slate-200 overflow-x-auto md:overflow-visible pb-0 md:pb-0">
                                <button
                                    type="button"
                                    onClick={onHireClick}
                                    disabled={!onHireClick}
                                    className="min-w-[62px] md:min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 md:py-2"
                                >
                                    <IoIosMail className="h-8 w-8 md:h-10 md:w-10 p-1.5 md:p-2 bg-white rounded-full text-black" />
                                    <span className="text-gray-400 text-[10px] md:text-[11px]">Hire</span>
                                </button>
                                <button
                                    type="button"
                                    className="group relative min-w-[62px] md:min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 md:py-2"
                                >
                                    <BsTools className="h-8 w-8 md:h-10 md:w-10 p-1 bg-white rounded-full text-black" />
                                    <span className="text-gray-400 text-[10px] md:text-[11px]">Tools</span>

                                    {iconGridItems.length > 0 && (
                                        <div className="pointer-events-none absolute right-full -mr-1 top-1/2 z-40 hidden min-w-[148px] -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-black/85 p-2.5 opacity-0 shadow-[0_0_22px_rgba(56,189,248,0.26)] ring-1 ring-slate-600/40 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 hover:pointer-events-auto hover:opacity-100 md:block">
                                            <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                                                {iconGridItems.some((item) => item.type === "tool") ? "Tools" : "Skills"}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {iconGridItems.slice(0, 12).map((item, idx) => {
                                                    const Icon = item.type === "tool" ? getToolIcon(item.label) : getSkillIcon(item.label);
                                                    const iconColor = item.type === "tool" ? getToolIconColorClass(item.label) : "text-cyan-300";

                                                    return (
                                                        <div
                                                            key={`${item.type}-${item.label}-${idx}`}
                                                            className="group/icon relative z-0 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-zinc-900/85 shadow-[0_0_10px_rgba(15,23,42,0.55)] transition-all group-hover/icon:z-50"
                                                            title={item.label}
                                                        >
                                                            {React.createElement(Icon, { className: `h-5 w-5 ${iconColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]` })}
                                                            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover/icon:opacity-100">
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onSaveClick}
                                    disabled={!onSaveClick}
                                    className="min-w-[62px] md:min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 md:py-2"
                                >
                                    <BiSolidFolderOpen className="h-8 w-8 md:h-10 md:w-10 p-1.5 md:p-2 bg-white rounded-full text-black" />
                                    <span className="text-gray-400 text-[10px] md:text-[11px]">{isSaved ? "Saved" : "Save"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onShareClick}
                                    disabled={!onShareClick}
                                    className="min-w-[62px] md:min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 md:py-2"
                                >
                                    <LuShare className="h-8 w-8 md:h-10 md:w-10 p-1.5 md:p-2 bg-white rounded-full text-black" />
                                    <span className="text-gray-400 text-[10px] md:text-[11px]">Share</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onAppreciateClick}
                                    disabled={!onAppreciateClick}
                                    className="min-w-[62px] md:min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 md:py-2"
                                >
                                    <MdThumbUp
                                        className={`h-8 w-8 md:h-10 md:w-10 p-1.5 md:p-2 rounded-full ${isAppreciated ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}
                                    />
                                    <span className="text-gray-400 text-[10px] md:text-[11px]">
                                        {isAppreciated ? 'Appreciated' : 'Appreciate'}
                                        {typeof appreciationCount === 'number' && (
                                            <span className="ml-1 text-[10px] text-slate-400">{appreciationCount}</span>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>

                    </aside>
                </div>
            </div>
        </div>
    );
};

export default PortfolioPreviewModal;
