import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
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
    location: "",
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

  // Load job if editing
  useEffect(() => {
    if (jobId) {
      const loadJob = async () => {
        try {
          const res = await api.getCommunityJobs({ includeImages: true, includeLinks: true });
          const jobs = Array.isArray(res.data) ? res.data : [];
          const job = jobs.find((j: any) => j._id === jobId);
          if (job) {
            setJobForm({
              title: job.title || "",
              description: job.description || "",
              location: job.location || "",
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
      toast({
        title: "Job title is required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        location: jobForm.location.trim(),
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => navigate(`/communities/${communityId}`)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              type="button"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Share that you're hiring
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Reach candidates outside your network with a job post
              </p>
            </div>
          </div>

          {/* Job Form Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FiBriefcase size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Job Details</h2>
                  <p className="text-sm text-slate-500">Fill in the job information</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Job Title *
                  </label>
                  <Input
                    placeholder="e.g. Senior Frontend Developer"
                    value={jobForm.title}
                    onChange={(e) =>
                      setJobForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="text-base"
                  />
                </div>

                {/* Location and Salary Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      <FiMapPin className="inline mr-1" size={14} />
                      Location
                    </label>
                    <Input
                      placeholder="e.g. New York, NY or Remote"
                      value={jobForm.location}
                      onChange={(e) =>
                        setJobForm((p) => ({ ...p, location: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      <FiDollarSign className="inline mr-1" size={14} />
                      Salary (Optional)
                    </label>
                    <Input
                      placeholder="e.g. $80,000 - $120,000"
                      value={jobForm.salary}
                      onChange={(e) =>
                        setJobForm((p) => ({ ...p, salary: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    <FiClock className="inline mr-1" size={14} />
                    Job Type
                  </label>
                  <select
                    value={jobForm.type}
                    onChange={(e) =>
                      setJobForm((p) => ({ ...p, type: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Job Description
                  </label>
                  <Textarea
                    placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity great..."
                    value={jobForm.description}
                    onChange={(e) =>
                      setJobForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="min-h-32 text-base resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Include key responsibilities, required skills, and benefits
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Images (Optional)
            </label>
            <p className="text-sm text-slate-500 mb-4">
              Add images to showcase your company, office, or team
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors">
                {jobImageUploading ? (
                  <>
                    <FiLoader size={14} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <FiPlus size={14} /> Add images
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={jobImageUploading}
                  onChange={(e) =>
                    void uploadAttachmentImage(Array.from(e.target.files || []))
                  }
                />
              </label>
            </div>

            {jobImages.length > 0 && (
              <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {jobImages.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative overflow-hidden rounded-lg border border-slate-200 bg-white group"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setJobImages((c) => c.filter((_, idx) => idx !== i))
                      }
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Application Links (Optional)
            </label>
            <p className="text-sm text-slate-500 mb-4">
              Add links to your application form, company careers page, or job listing
            </p>
            <div className="flex gap-2">
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
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addAttachmentLink}
                className="shrink-0 rounded-lg px-4"
              >
                Add
              </Button>
            </div>

            {jobLinks.length > 0 && (
              <div className="mt-4 space-y-2">
                {jobLinks.map((link) => (
                  <div
                    key={link}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiLink size={14} className="text-slate-400 shrink-0" />
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
                      onClick={() =>
                        setJobLinks((c) => c.filter((l) => l !== link))
                      }
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/communities/${communityId}`)}
              disabled={submitting}
              className="rounded-lg px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={createJob}
              disabled={submitting || !jobForm.title.trim()}
              className="rounded-lg px-6"
            >
              {submitting
                ? "Posting..."
                : jobId
                  ? "Update Job"
                  : "Post Job"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}