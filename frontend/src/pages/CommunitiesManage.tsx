import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { FiChevronRight, FiLoader, FiPlus, FiUsers, FiUploadCloud, FiGlobe, FiInfo, FiHash, FiArrowLeft } from "react-icons/fi";

interface Community {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  logo?: string;
  tagline?: string;
  website?: string;
  industry?: string;
  ownerId?: string | { _id: string };
  members?: any[];
}

const labelCls = "block text-[13px] font-semibold text-slate-700 mb-1";

const getUserId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value._id === "string") return value._id;
    if (typeof value.id === "string") return value.id;
  }
  return null;
};

const CommunitiesManage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = ((user as any)?._id || (user as any)?.id) as string | undefined;

  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    category: "",
    tagline: "",
    website: "",
    industry: "",
    logo: ""
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);

  const ownedCommunities = useMemo(() => {
    if (!currentUserId) return [];
    return myCommunities.filter((community) => {
      const ownerId = getUserId((community as any).ownerId);
      return !!ownerId && ownerId.toString() === currentUserId.toString();
    });
  }, [myCommunities, currentUserId]);

  const refreshCommunities = async () => {
    try {
      setLoading(true);
      const res = await api.getMyCommunities();
      const list = ((res as any).data?.communities || []) as Community[];
      setMyCommunities(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load my communities", err);
      setMyCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCommunities();
  }, []);

  // If navigated with ?showCreate=1, focus the name input to encourage creation
  const location = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('showCreate')) {
        // slight delay to ensure input is mounted
        setTimeout(() => nameInputRef.current?.focus(), 50);
      }
    } catch (err) {
      // ignore
    }
  }, [location.search]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'communities-updated') {
        void refreshCommunities();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadToCloudinary(file);
      setForm(prev => ({ ...prev, logo: res.url }));
      toast({ title: "Logo uploaded successfully" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createCommunity(form);
      const created = (res as any).data?.community || (res as any).data || res;
      const id = (created && (created._id || created.id)) ? (created._id || created.id) : null;

      setForm({
        name: "",
        description: "",
        category: "",
        tagline: "",
        website: "",
        industry: "",
        logo: ""
      });

      toast({
        title: "Community created",
        description: "Your community is live. You can manage it below.",
      });

      await refreshCommunities();

      if (id) {
        // navigate to the newly created community admin view
        window.location.href = `/communities/${id}?view=admin`;
        return;
      }
    } catch (err: any) {
      toast({
        title: "Could not create community",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          
          <div className="mb-6 flex items-center gap-2">
            <Link to="/communities" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
              <FiArrowLeft size={14} />
              Back
            </Link>
          </div>

          <div className="mb-8 flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-200 text-slate-500">
                <FiUsers size={24} />
             </div>
             <div>
                <h1 className="text-xl font-semibold text-slate-900">Let's get started with a few details about your community.</h1>
                <p className="text-sm text-slate-500">* indicates required</p>
             </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* Form Section */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form className="space-y-6" onSubmit={handleCreateCommunity}>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className={labelCls}>Name*</label>
                      <Input
                        ref={nameInputRef}
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Add your community's name"
                        className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Website</label>
                      <Input
                        value={form.website}
                        onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))}
                        placeholder="paste full link of website"
                        className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Industry*</label>
                      <Input
                        value={form.industry}
                        onChange={(e) => setForm(p => ({ ...p, industry: e.target.value }))}
                        placeholder="ex: Information Services"
                        className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>



                    <div>
                      <label className={labelCls}>Logo</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-10 transition-colors hover:border-blue-400 hover:bg-slate-100"
                      >
                        {form.logo ? (
                          <div className="flex flex-col items-center">
                            <img src={form.logo} alt="Logo" className="h-24 w-24 rounded object-cover shadow-sm" />
                            <p className="mt-2 text-xs text-blue-600 font-medium">Click to change logo</p>
                          </div>
                        ) : (
                          <>
                            <FiUploadCloud size={32} className="text-slate-400 group-hover:text-blue-500" />
                            <p className="mt-2 text-sm font-medium text-slate-700">Choose file</p>
                            <p className="text-xs text-slate-500">Upload to see preview</p>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleLogoUpload} 
                          className="hidden" 
                          accept="image/*" 
                        />
                        {isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <FiLoader className="animate-spin text-blue-600" size={24} />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">300 x 300px recommended. JPGs, JPEGs, and PNGs supported.</p>
                    </div>

                    <div>
                      <label className={labelCls}>Tagline</label>
                      <Textarea
                        value={form.tagline}
                        onChange={(e) => setForm(p => ({ ...p, tagline: e.target.value }))}
                        placeholder="ex: An information services firm helping small businesses succeed."
                        rows={3}
                        className="resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        maxLength={120}
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>Use your tagline to briefly describe what your organization does. This can be changed later.</span>
                        <span>{form.tagline.length}/120</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <p className="text-xs leading-relaxed text-slate-600">
                        I verify that I am an authorized representative of this organization and have the right to act on its behalf in the creation and management of this page. The organization and I agree to the additional terms for Pages.
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={submitting || isUploading}
                        className="rounded-full bg-blue-700 px-8 py-6 text-base font-semibold text-white transition-all hover:bg-blue-800"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <FiLoader className="animate-spin" />
                            Creating...
                          </span>
                        ) : "Create page"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-5">
              <div className="sticky top-8 space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                   <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                      <span className="text-xs font-semibold text-slate-900">Page preview</span>
                      <FiInfo size={14} className="text-slate-400" />
                   </div>
                   
                   <div className="bg-slate-50 p-6">
                      <div className="mx-auto max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="h-16 bg-slate-100" />
                        <div className="px-6 pb-6 text-center">
                          <div className="-mt-10 mb-4 inline-block h-20 w-20 overflow-hidden rounded-lg border-4 border-white bg-slate-200">
                            {form.logo ? (
                              <img src={form.logo} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <FiUsers size={32} />
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">{form.name || "Community Name"}</h3>
                          <p className="mt-1 text-sm text-slate-500">{form.tagline || "Tagline"}</p>
                          <p className="mt-1 text-xs text-slate-400">{form.industry || "Industry"}</p>
                          
                          
                        </div>
                      </div>
                   </div>
                </div>

                {/* List of Owned Communities */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Your Communities</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {ownedCommunities.length}
                    </span>
                  </div>

                  {loading ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
                      <FiLoader size={14} className="animate-spin" />
                      Loading...
                    </div>
                  ) : ownedCommunities.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No communities created yet.</p>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                      {ownedCommunities.map((community) => (
                        <div key={community._id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                          {community.logo ? (
                            <img src={community.logo} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                              <FiUsers size={16} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900">{community.name}</p>
                            <p className="truncate text-[10px] text-slate-500">{community.industry || community.category || "No category"}</p>
                          </div>
                          <Link to={`/communities/${community._id}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-blue-600">
                              <FiChevronRight size={18} />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};


export default CommunitiesManage;
