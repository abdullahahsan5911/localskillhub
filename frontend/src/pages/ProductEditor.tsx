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
  FiTrash2,
  FiLink,
  FiLoader,
  FiPackage,
  FiDollarSign,
  FiImage,
  FiEdit3,
  FiUsers,
  FiPlay,
  FiGlobe,
  FiCheck,
} from "react-icons/fi";

// Removed "review" — it had no UI and isStepComplete always returned true for it
type ProductStep =
  | "initial"
  | "details"
  | "about"
  | "media"
  | "customers"
  | "users";

interface Community {
  _id: string;
  name: string;
  logo?: string;
  category?: string;
  members?: number;
}

// Renamed internal param to avoid shadowing the outer `communityId` from useParams
interface ProductPayload {
  title: string;
  description: string;
  price: string;
  website: string;
  targetAudience: string;
  productDetails: string;
  tags: string[];
  logo: string;
  images: string[];
  links: string[];
  customers: string[];
  jobFunctions: string[];
  forEveryone: boolean;
  communityId: string | undefined;
}

const jobFunctions = [
  "Sales Specialist",
  "Sales Manager",
  "Commission Sales Associate",
  "Sales Staff",
  "Sales Representative",
  "Sales Professional",
  "Marketing Manager",
  "Marketing Specialist",
  "Business Development",
  "Account Manager",
  "Customer Success",
  "Product Manager",
  "Software Engineer",
  "Data Analyst",
  "Project Manager",
  "Consultant",
  "Operations Manager",
  "HR Manager",
  "Finance Manager",
  "Executive",
];

// Ordered steps for progress/navigation (excludes "initial" which has its own screen)
const ORDERED_STEPS: ProductStep[] = [
  "details",
  "about",
  "media",
  "customers",
  "users",
];

export default function ProductEditor() {
  const { communityId, productId } = useParams<{
    communityId: string;
    productId?: string;
  }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<ProductStep>("initial");
  const [sameNameAsOrg, setSameNameAsOrg] = useState<boolean | null>(null);

  // "features" removed — it was collected nowhere in the UI but was in state & payload
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    website: "",
    targetAudience: "",
    productDetails: "",
    tags: [] as string[],
  });

  const [productLogo, setProductLogo] = useState<string>("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productLinks, setProductLinks] = useState<string[]>([]);
  const [productLinkInput, setProductLinkInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [availableCommunities, setAvailableCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [selectedJobFunctions, setSelectedJobFunctions] = useState<string[]>([]);
  const [productForEveryone, setProductForEveryone] = useState<boolean>(true);

  // ─── Load community info ───────────────────────────────────────────────────
  useEffect(() => {
    if (!communityId) {
      navigate("/communities");
      return;
    }

    const loadCommunity = async () => {
      try {
        setCommunitiesLoading(true);
        const res = await api.getCommunityById(communityId);
        const community = res.data || res;
        setCommunityName((community as { name?: string })?.name ?? "");

        const communitiesRes = await api.getCommunities({ limit: 50 });

        let communities: Community[] = [];
        
        // Handle different possible response structures
        if (Array.isArray(communitiesRes.data)) {
          communities = communitiesRes.data;
        } else if (communitiesRes.data && typeof communitiesRes.data === 'object' && 'communities' in communitiesRes.data) {
          communities = (communitiesRes.data as any).communities || [];
        } else if (Array.isArray(communitiesRes)) {
          communities = communitiesRes;
        }

        if (!Array.isArray(communities) || communities.length === 0) {
          communities = [
            { _id: "test1", name: "Tech Innovators", category: "Technology", logo: "" },
            { _id: "test2", name: "Marketing Professionals", category: "Marketing", logo: "" },
            { _id: "test3", name: "Startup Founders", category: "Business", logo: "" },
            { _id: "test4", name: "Design Community", category: "Design", logo: "" },
          ];
        }

        // Use a local variable to avoid shadowing the outer communityId
        const filteredCommunities = communities.filter(
          (c: Community) => c._id !== communityId,
        );
        setAvailableCommunities(filteredCommunities);
      } catch (error) {
        console.error("Failed to load communities:", error);
        toast({ title: "Failed to load communities", variant: "destructive" });
      } finally {
        setCommunitiesLoading(false);
      }
    };

    void loadCommunity();
  }, [communityId, navigate]);

  // ─── Load product when editing ────────────────────────────────────────────
  useEffect(() => {
    if (!productId || !communityId) return;

    const loadProduct = async () => {
      try {
        // Pass communityId as a parameter in the params object
        const res = await api.getCommunityProducts({
          communityId,
          includeImages: true,
          includeLinks: true,
        });
        const products: Array<Record<string, unknown>> = Array.isArray(res.data)
          ? res.data
          : [];
        const product = products.find((p) => p._id === productId);
        if (product) {
          setProductForm({
            title: (product.title as string) || "",
            description: (product.description as string) || "",
            price: product.price ? String(product.price) : "",
            website: (product.website as string) || "",
            targetAudience: (product.targetAudience as string) || "",
            productDetails: (product.productDetails as string) || "",
            tags: Array.isArray(product.tags) ? (product.tags as string[]) : [],
          });
          setProductLogo((product.logo as string) || "");
          setProductImages(
            Array.isArray(product.images) ? (product.images as string[]) : [],
          );
          setProductLinks(
            Array.isArray(product.links) ? (product.links as string[]) : [],
          );
          setSelectedCommunities(
            Array.isArray(product.customers)
              ? (product.customers as string[])
              : [],
          );
          setSelectedJobFunctions(
            Array.isArray(product.jobFunctions)
              ? (product.jobFunctions as string[])
              : [],
          );
          setProductForEveryone(product.forEveryone !== false);
          setCurrentStep("details");
        }
      } catch (error) {
        console.error("Failed to load product:", error);
        toast({ title: "Failed to load product", variant: "destructive" });
      }
    };

    void loadProduct();
  }, [productId, communityId]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, "community-products");
      setProductLogo(uploaded.url);
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({ title: "Logo upload failed", variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || productForm.tags.includes(trimmed)) return;
    setProductForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setProductForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Renamed parameter to `id` to avoid shadowing the outer `communityId`
  const toggleCommunity = (id: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleJobFunction = (jobFunction: string) => {
    setSelectedJobFunctions((prev) =>
      prev.includes(jobFunction)
        ? prev.filter((jf) => jf !== jobFunction)
        : [...prev, jobFunction],
    );
  };

  const uploadAttachmentImage = async (files: File[]) => {
    if (!files.length) return;
    setProductImageUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) => uploadToCloudinary(file, "community-products")),
      );
      const urls = uploaded.map((item) => item.url);
      setProductImages((prev) => [...prev, ...urls]);
      toast({ title: `${urls.length} image(s) uploaded` });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setProductImageUploading(false);
    }
  };

  const addAttachmentLink = () => {
    const trimmed = productLinkInput.trim();
    if (!trimmed) return;
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (!productLinks.includes(url)) {
      setProductLinks((prev) => [...prev, url]);
      setProductLinkInput("");
    }
  };

  const createProduct = async () => {
    if (!productForm.title.trim()) {
      toast({ title: "Product title is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: ProductPayload = {
        title: productForm.title.trim(),
        description: productForm.description.trim(),
        price: productForm.price.trim(),
        website: productForm.website.trim(),
        targetAudience: productForm.targetAudience.trim(),
        productDetails: productForm.productDetails.trim(),
        tags: productForm.tags,
        logo: productLogo,
        images: productImages,
        links: productLinks,
        customers: selectedCommunities,
        jobFunctions: selectedJobFunctions,
        forEveryone: productForEveryone,
        communityId,
      };

      if (productId) {
        await api.updateCommunityProduct(productId, payload);
        toast({ title: "Product updated successfully" });
      } else {
        await api.createCommunityProduct(payload);
        toast({ title: "Product added successfully" });
      }
      navigate(`/communities/${communityId}`);
    } catch (error) {
      console.error("Product save error:", error);
      toast({ title: "Failed to save product", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitialNext = () => {
    if (sameNameAsOrg === null) {
      toast({ title: "Please select an option", variant: "destructive" });
      return;
    }
    if (sameNameAsOrg) {
      setProductForm((prev) => ({ ...prev, title: communityName }));
    }
    setCurrentStep("details");
  };

  const isStepComplete = (step: ProductStep): boolean => {
    switch (step) {
      case "initial":
        return sameNameAsOrg !== null;
      case "details":
        return (
          productForm.title.trim() !== "" &&
          productForm.productDetails.trim() !== ""
        );
      case "about":
        return productForm.description.trim() !== "";
      case "media":
        return true; // Optional
      case "customers":
        return true; // Optional
      case "users":
        return productForEveryone || selectedJobFunctions.length > 0;
      default:
        return false;
    }
  };

  const getStepNumber = (step: ProductStep): number => {
    // "initial" is its own screen; numbered steps start at "details"
    const idx = ORDERED_STEPS.indexOf(step);
    return idx === -1 ? 0 : idx + 1;
  };

  const goBack = () => {
    const idx = ORDERED_STEPS.indexOf(currentStep);
    if (idx === 0) setCurrentStep("initial");
    else setCurrentStep(ORDERED_STEPS[idx - 1]);
  };

  const goNext = () => {
    const idx = ORDERED_STEPS.indexOf(currentStep);
    if (idx < ORDERED_STEPS.length - 1) {
      setCurrentStep(ORDERED_STEPS[idx + 1]);
    }
  };

  // ─── Sub-components ───────────────────────────────────────────────────────
  const InitialStep = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
          <FiPackage size={32} />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Add product
        </h2>
        <p className="text-slate-600">
          Let's get started with your product information
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Do your product and organization have the same name?
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
            <input
              type="radio"
              name="sameName"
              checked={sameNameAsOrg === true}
              onChange={() => setSameNameAsOrg(true)}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-slate-900">
                Yes, my product and organization have the same name
              </p>
              <p className="text-sm text-slate-500 mt-1">
                We'll use "{communityName}" as your product name
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
            <input
              type="radio"
              name="sameName"
              checked={sameNameAsOrg === false}
              onChange={() => setSameNameAsOrg(false)}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-slate-900">
                No, my product has a different name
              </p>
              <p className="text-sm text-slate-500 mt-1">
                You'll enter a custom product name
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="button"
            onClick={handleInitialNext}
            disabled={sameNameAsOrg === null}
            className="px-8"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-slate-200 p-6 shrink-0">
      <div className="mb-8">
        <h3 className="font-semibold text-slate-900 mb-2">Product details</h3>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(getStepNumber(currentStep) / ORDERED_STEPS.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Step {getStepNumber(currentStep)} of {ORDERED_STEPS.length}
        </p>
      </div>

      <nav className="space-y-2">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Header</h4>
          <button
            type="button"
            onClick={() => setCurrentStep("details")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              currentStep === "details"
                ? "bg-amber-100 text-amber-800 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isStepComplete("details") && (
              <FiCheck size={14} className="text-green-600" />
            )}
            Product info
          </button>
        </div>

        <div className="space-y-1 pt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">About</h4>

          {(["about", "media", "customers", "users"] as ProductStep[]).map(
            (step) => {
              const labels: Record<string, string> = {
                about: "Overview",
                media: "Media",
                customers: "Customers",
                users: "Product users",
              };
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCurrentStep(step)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    currentStep === step
                      ? "bg-amber-100 text-amber-800 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {isStepComplete(step) && (
                    <FiCheck size={14} className="text-green-600" />
                  )}
                  {labels[step]}
                </button>
              );
            },
          )}
        </div>
      </nav>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        {currentStep === "initial" ? (
          <div className="py-16">
            <InitialStep />
          </div>
        ) : (
          <div className="flex h-screen pt-16">
            <Sidebar />

            <div className="flex-1 overflow-auto">
              <div className="max-w-4xl mx-auto px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/communities/${communityId}`)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <FiArrowLeft size={18} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                      {currentStep === "details" && "Update product information"}
                      {currentStep === "about" && "About the product"}
                      {currentStep === "media" && "Product media & screenshots"}
                      {currentStep === "customers" && "Customers"}
                      {currentStep === "users" && "Add product users"}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      * indicates required
                    </p>
                  </div>
                </div>

                {/* ── Details step ─────────────────────────────────────── */}
                {currentStep === "details" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <div className="space-y-6">
                      {/* Product Logo */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                          Product logo
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden">
                            {productLogo ? (
                              <img
                                src={productLogo}
                                alt="Product logo"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FiPackage size={24} className="text-slate-400" />
                            )}
                          </div>
                          <label className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium">
                            <FiEdit3 size={14} className="inline mr-1" />
                            {logoUploading ? "Uploading..." : "Edit"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={logoUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadLogo(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Product Name */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Product name *
                        </label>
                        <Input
                          placeholder="Enter your product name"
                          value={productForm.title}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              title: e.target.value,
                            }))
                          }
                          className="text-base"
                          maxLength={100}
                        />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-slate-400">
                            This will be displayed as your product's main title
                          </p>
                          <span className="text-xs text-slate-400">
                            {productForm.title.length}/100
                          </span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Tell more specific about your product *
                        </label>
                        <p className="text-sm text-slate-600 mb-3">
                          Provide specific details about what your product does
                          and its key features.
                        </p>
                        <Textarea
                          placeholder="e.g., AI-powered project management tool that automates task scheduling and team collaboration..."
                          value={productForm.productDetails}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              productDetails: e.target.value,
                            }))
                          }
                          className="min-h-24 text-base resize-none"
                          maxLength={500}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {productForm.productDetails.length}/500 characters
                        </p>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Tags
                        </label>
                        <p className="text-sm text-slate-600 mb-3">
                          Add tags to help people discover your product (e.g.,
                          SaaS, AI, productivity)
                        </p>
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Add a tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTag();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addTag}
                            className="shrink-0"
                          >
                            Add
                          </Button>
                        </div>
                        {productForm.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {productForm.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── About step ───────────────────────────────────────── */}
                {currentStep === "about" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <div className="space-y-6">
                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Add information about your product *
                        </label>
                        <Textarea
                          placeholder="Describe what your product does, key features, and benefits..."
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          className="min-h-32 text-base resize-none"
                          maxLength={2000}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {productForm.description.length}/2000 characters
                        </p>
                      </div>

                      {/* Website */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          <FiGlobe className="inline mr-1" size={14} />
                          Website
                        </label>
                        <p className="text-sm text-slate-600 mb-2">
                          Add a link to your website
                        </p>
                        <Input
                          placeholder="https://yourproduct.com"
                          value={productForm.website}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              website: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Target Audience */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          <FiUsers className="inline mr-1" size={14} />
                          This product is intended for
                        </label>
                        <Textarea
                          placeholder="Add roles that use your product (e.g., developers, marketers, small business owners...)"
                          value={productForm.targetAudience}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              targetAudience: e.target.value,
                            }))
                          }
                          className="min-h-20 text-base resize-none"
                        />
                      </div>

                      {/* Pricing */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          <FiDollarSign className="inline mr-1" size={14} />
                          Pricing
                        </label>
                        <Input
                          placeholder="e.g., $29/month, Free trial, Contact for pricing"
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              price: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Media step ───────────────────────────────────────── */}
                {currentStep === "media" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          <FiPlay className="inline mr-2" size={18} />
                          Product videos & screenshots
                        </h3>
                        <p className="text-slate-600 mb-6">
                          Add images, screenshots, or videos to showcase your
                          product
                        </p>

                        <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                          <label className="cursor-pointer">
                            <div className="flex flex-col items-center">
                              {productImageUploading ? (
                                <>
                                  <FiLoader
                                    size={32}
                                    className="text-slate-400 animate-spin mb-4"
                                  />
                                  <p className="text-slate-600">Uploading...</p>
                                </>
                              ) : (
                                <>
                                  <FiImage
                                    size={32}
                                    className="text-slate-400 mb-4"
                                  />
                                  <p className="text-slate-600 mb-2">
                                    Drag and drop images here, or click to
                                    browse
                                  </p>
                                  <p className="text-sm text-slate-400">
                                    Supports JPG, PNG, GIF up to 10MB
                                  </p>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              disabled={productImageUploading}
                              onChange={(e) =>
                                void uploadAttachmentImage(
                                  Array.from(e.target.files ?? []),
                                )
                              }
                            />
                          </label>
                        </div>

                        {productImages.length > 0 && (
                          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                            {productImages.map((url, i) => (
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
                                    setProductImages((c) =>
                                      c.filter((_, idx) => idx !== i),
                                    )
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

                      {/* Additional Links */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                          Additional links
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={productLinkInput}
                            onChange={(e) =>
                              setProductLinkInput(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addAttachmentLink();
                              }
                            }}
                            placeholder="https://demo.yourproduct.com"
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

                        {productLinks.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {productLinks.map((link) => (
                              <div
                                key={link}
                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FiLink
                                    size={14}
                                    className="text-slate-400 shrink-0"
                                  />
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
                                    setProductLinks((c) =>
                                      c.filter((l) => l !== link),
                                    )
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
                    </div>
                  </div>
                )}

                {/* ── Customers step ───────────────────────────────────── */}
                {currentStep === "customers" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          <FiUsers className="inline mr-2" size={18} />
                          Customers
                        </h3>
                        <p className="text-slate-600 mb-6">
                          Select communities where your customers are active
                        </p>

                        {communitiesLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <FiLoader
                              size={24}
                              className="animate-spin text-slate-400"
                            />
                            <span className="ml-2 text-slate-600">
                              Loading communities...
                            </span>
                          </div>
                        ) : availableCommunities.length === 0 ? (
                          <div className="text-center py-12">
                            <FiUsers
                              size={48}
                              className="mx-auto text-slate-300 mb-4"
                            />
                            <p className="text-slate-500 mb-2">
                              No other communities found
                            </p>
                            <p className="text-sm text-slate-400">
                              Communities will appear here when they're
                              available for selection
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3 max-h-96 overflow-y-auto">
                            {availableCommunities.map((community) => (
                              <label
                                key={community._id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCommunities.includes(
                                    community._id,
                                  )}
                                  onChange={() =>
                                    toggleCommunity(community._id)
                                  }
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                                    {community.logo ? (
                                      <img
                                        src={community.logo}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-sm font-semibold text-slate-600">
                                        {community.name
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {community.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      {community.category ?? "Community"}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}

                        {selectedCommunities.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              Selected {selectedCommunities.length} communities
                              as potential customers
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Users step ───────────────────────────────────────── */}
                {currentStep === "users" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          Add product users
                        </h3>
                        <p className="text-slate-600 mb-6">
                          Highlight the job functions your product is intended
                          for
                        </p>

                        <div className="space-y-4">
                          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="productUsers"
                              checked={productForEveryone}
                              onChange={() => {
                                setProductForEveryone(true);
                                setSelectedJobFunctions([]);
                              }}
                              className="mt-1 text-blue-600 focus:ring-blue-500"
                            />
                            <p className="font-medium text-slate-900">
                              My product is for everyone, regardless of job
                              function
                            </p>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="productUsers"
                              checked={!productForEveryone}
                              onChange={() => setProductForEveryone(false)}
                              className="mt-1 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">
                                  My product is for specific job functions
                                </p>
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-600">
                                  ?
                                </div>
                              </div>
                              <p className="text-sm text-slate-500 mt-1">
                                Minimum of 1 function required (Max of 10)
                              </p>
                            </div>
                          </label>
                        </div>

                        {!productForEveryone && (
                          <div className="mt-6">
                            <div className="mb-4">
                              <Input
                                placeholder="Search job functions..."
                                className="w-full"
                              />
                            </div>

                            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                              {jobFunctions.map((jobFunction) => (
                                <label
                                  key={jobFunction}
                                  className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedJobFunctions.includes(
                                      jobFunction,
                                    )}
                                    onChange={() =>
                                      toggleJobFunction(jobFunction)
                                    }
                                    className="text-blue-600 focus:ring-blue-500"
                                    disabled={
                                      selectedJobFunctions.length >= 10 &&
                                      !selectedJobFunctions.includes(jobFunction)
                                    }
                                  />
                                  <span className="text-sm text-slate-900">
                                    {jobFunction}
                                  </span>
                                </label>
                              ))}
                            </div>

                            {selectedJobFunctions.length > 0 && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800 mb-2">
                                  Selected job functions (
                                  {selectedJobFunctions.length}/10):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedJobFunctions.map((jf) => (
                                    <span
                                      key={jf}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                    >
                                      {jf}
                                      <button
                                        type="button"
                                        onClick={() => toggleJobFunction(jf)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        <FiTrash2 size={10} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Navigation buttons ───────────────────────────────── */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="px-6"
                  >
                    Back
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/communities/${communityId}`)}
                      disabled={submitting}
                      className="px-6"
                    >
                      Cancel
                    </Button>

                    {currentStep === "users" ? (
                      <Button
                        type="button"
                        onClick={() => void createProduct()}
                        disabled={
                          submitting ||
                          !productForm.title.trim() ||
                          (!productForEveryone &&
                            selectedJobFunctions.length === 0)
                        }
                        className="px-8"
                      >
                        {submitting
                          ? "Publishing..."
                          : productId
                            ? "Update Product"
                            : "Publish Product"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={goNext}
                        disabled={!isStepComplete(currentStep)}
                        className="px-6"
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}