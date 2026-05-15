import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import LocationInput, { DetailedLocation } from "@/components/common/LocationInput";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiLink,
  FiLoader,
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiImage,
  FiGlobe,
} from "react-icons/fi";

export default function JobEditor() {
  const { communityId, jobId } = useParams<{
    communityId: string;
    jobId?: string;
  }>();
  const navigate = useNavigate();

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    location: { country: "", city: "", street: "" } as DetailedLocation,
    salary: "",
    type: "full-time",
  });
  const [jobImages, setJobImages] = useState<string[]>([]);
  const [jobLinks, setJobLinks] = useState<string[]>([]);
  const [jobLinkInput, setJobLinkInput] = useState("");
  const [jobImageUploading, setJobImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!communityId) navigate("/communities");
  }, [communityId, navigate]);

  useEffect(() => {
    if (jobId) {
      const loadJob = async () => {
        try {
          const res = await api.getCommunityJobs({ includeImages: true, includeLinks: true });
          const jobs = Array.isArray(res.data) ? res.data : [];
          const job = jobs.find((j: any) => j._id === jobId);
          if (job) {
            let parsedLocation: DetailedLocation = { country: "", city: "", street: "" };
            if (typeof job.location === "object" && job.location !== null) {
              parsedLocation = {
                country: job.location.country || "",
                city: job.location.city || "",
                street: job.location.street || "",
              };
            } else if (typeof job.location === "string") {
              parsedLocation.street = job.location;
            }
            setJobForm({
              title: job.title || "",
              description: job.description || "",
              location: parsedLocation,
              salary: job.salary || "",
              type: job.type || "full-time",
            });
            setJobImages(job.images || []);
            setJobLinks(job.links || []);
          }
        } catch (error) {
          toast({ title: "Failed to load job", variant: "destructive" });
        }
      };
      loadJob();
    }
  }, [jobId]);

  const uploadAttachmentImage = async (files: File[]) => {
    if (!files.length) return;
    setJobImageUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) => uploadToCloudinary(file, "community-jobs")),
      );
      const urls = uploaded.map((item) => item.url);
      setJobImages((prev) => [...prev, ...urls]);
      toast({ title: `${urls.length} image(s) uploaded` });
    } catch (error) {
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setJobImageUploading(false);
    }
  };

  const addAttachmentLink = () => {
    const trimmed = jobLinkInput.trim();
    if (!trimmed) return;
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (!jobLinks.includes(url)) {
      setJobLinks((prev) => [...prev, url]);
      setJobLinkInput("");
    }
  };

  const createJob = async () => {
    if (!jobForm.title.trim()) {
      toast({ title: "Job title is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        location: jobForm.location,
        salary: jobForm.salary.trim(),
        type: jobForm.type,
        images: jobImages,
        links: jobLinks,
        communityId,
      };
      if (jobId) {
        await api.updateCommunityJob(jobId, payload);
        toast({ title: "Job updated successfully" });
      } else {
        await api.createCommunityJob(payload);
        toast({ title: "Job posted successfully" });
      }
      navigate(`/communities/${communityId}`);
    } catch (error) {
      toast({ title: "Failed to post job", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const jobTypeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
  ];

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-50">
        {/* Top hero strip */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
            <button
              onClick={() => navigate(`/communities/${communityId}`)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all"
              type="button"
              aria-label="Go back"
            >
              <FiArrowLeft size={17} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <FiBriefcase size={19} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                  {jobId ? "Edit Job Posting" : "Post a Job"}
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Reach candidates beyond your network
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

          {/* ── Section 1: Job Details ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center gap-2">
              <FiBriefcase size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-800">Job Details</span>
            </div>

            <div className="px-5 sm:px-7 py-6 space-y-5">
              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Senior Frontend Developer"
                  value={jobForm.title}
                  onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))}
                  className="h-11 text-sm rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  <FiMapPin className="inline mr-1" size={12} />
                  Location
                </label>
                <LocationInput
                  value={jobForm.location}
                  onChange={(val) => setJobForm((p) => ({ ...p, location: val }))}
                />
              </div>

              {/* Salary + Job Type — side by side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    <FiDollarSign className="inline mr-1" size={12} />
                    Salary
                    <span className="ml-1 text-slate-400 normal-case font-normal">(optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. $80k – $120k"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm((p) => ({ ...p, salary: e.target.value }))}
                    className="h-11 text-sm rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    <FiClock className="inline mr-1" size={12} />
                    Job Type
                  </label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm((p) => ({ ...p, type: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                  >
                    {jobTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Description
                  <span className="ml-1 text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="Describe the role, responsibilities, required skills, and what makes this opportunity great…"
                  value={jobForm.description}
                  onChange={(e) => setJobForm((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-[130px] text-sm rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-100 resize-none"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Include key responsibilities, required skills, and benefits
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 2: Images ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center gap-2">
              <FiImage size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-800">
                Images
                <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>
              </span>
            </div>

            <div className="px-5 sm:px-7 py-6">
              <p className="text-xs text-slate-500 mb-4">
                Showcase your company, office, or team culture
              </p>

              {/* Upload button */}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
                {jobImageUploading ? (
                  <>
                    <FiLoader size={14} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FiPlus size={14} />
                    Add images
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={jobImageUploading}
                  onChange={(e) => void uploadAttachmentImage(Array.from(e.target.files || []))}
                />
              </label>

              {/* Image grid */}
              {jobImages.length > 0 && (
                <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {jobImages.map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-video"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setJobImages((c) => c.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Application Links ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center gap-2">
              <FiGlobe size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-800">
                Application Links
                <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>
              </span>
            </div>

            <div className="px-5 sm:px-7 py-6">
              <p className="text-xs text-slate-500 mb-4">
                Link to your application form, careers page, or job listing
              </p>

              {/* Input row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={jobLinkInput}
                  onChange={(e) => setJobLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAttachmentLink();
                    }
                  }}
                  placeholder="https://company.com/careers/apply"
                  className="flex-1 h-11 text-sm rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAttachmentLink}
                  className="h-11 shrink-0 rounded-lg px-5 text-sm border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                >
                  <FiPlus size={14} className="mr-1.5" />
                  Add
                </Button>
              </div>

              {/* Links list */}
              {jobLinks.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {jobLinks.map((link) => (
                    <li
                      key={link}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiLink size={13} className="text-blue-500 shrink-0" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {link}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setJobLinks((c) => c.filter((l) => l !== link))}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/communities/${communityId}`)}
              disabled={submitting}
              className="h-11 rounded-xl px-6 text-sm border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={createJob}
              disabled={submitting || !jobForm.title.trim()}
              className="h-11 rounded-xl px-8 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <FiLoader size={14} className="animate-spin" />
                  {jobId ? "Updating…" : "Posting…"}
                </span>
              ) : jobId ? "Update Job" : "Post Job"}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}