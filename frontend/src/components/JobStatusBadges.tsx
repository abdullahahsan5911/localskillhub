import { AlertCircle, Trash2, Star } from 'lucide-react';

export function JobStatusBadges({ job }: { job: Record<string, any> }) {
  const badges = [];

  if (job.isFlagged) {
    badges.push(
      <div key="flagged" className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-700">
        <AlertCircle size={12} />
        <span>🚩 Flagged</span>
        {job.flagReason && <span className="text-red-600 text-xs ml-1">• {job.flagReason}</span>}
      </div>
    );
  }

  if (job.isFeatured) {
    badges.push(
      <div key="featured" className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 border border-amber-300 rounded text-xs text-amber-700">
        <Star size={12} />
        <span>Featured</span>
      </div>
    );
  }

  if (job.isDeleted) {
    badges.push(
      <div key="deleted" className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700">
        <Trash2 size={12} />
        <span>Deleted</span>
      </div>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {badges}
    </div>
  );
}
