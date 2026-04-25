import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationSelector from "@/components/LocationSelector";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Company {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

const CompaniesTab = () => {
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
    city: "",
    state: "",
    country: "India",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const myRes: any = await api.getMyCompanies();
        const payload = (myRes?.data as any) || myRes;
        const companies = (payload?.companies || payload?.data?.companies || []) as Company[];
        const primary = companies[0] || null;

        if (primary) {
          setCompanyId(primary._id || "");
          setForm({
            name: primary.name || "",
            description: primary.description || "",
            industry: primary.industry || "",
            website: primary.website || "",
            city: primary.location?.city || "",
            state: primary.location?.state || "",
            country: primary.location?.country || "India",
          });
        }
      } catch (err) {
        console.error("Failed to load companies", err);
        setError("Unable to load your company details.");
        toast({
          title: "Unable to load company",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setError("");
      setSaved(false);
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        industry: form.industry.trim() || undefined,
        website: form.website.trim() || undefined,
        location:
          form.city.trim() || form.state.trim() || form.country.trim()
            ? {
                city: form.city.trim() || undefined,
                state: form.state.trim() || undefined,
                country: form.country.trim() || undefined,
              }
            : undefined,
      };

      if (companyId) {
        await api.updateCompany(companyId, payload);
        toast({
          title: "Company updated",
          description: "Your company profile has been saved.",
        });
      } else {
        const res: any = await api.createCompany(payload);
        const createdCompany = (res?.data as any)?.company || (res?.data as any)?.data?.company;
        if (createdCompany?._id) {
          setCompanyId(createdCompany._id);
        }
        toast({
          title: "Company created",
          description: "Your company profile has been created.",
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to create company", err);
      setError("Unable to save company details.");
      toast({
        title: "Unable to save company",
        description: "Please check details and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!companyId) return;

    const confirmed = window.confirm("Delete your company profile? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setError("");
      setDeleting(true);
      await api.deleteCompany(companyId);
      setCompanyId("");
      setForm({
        name: "",
        description: "",
        industry: "",
        website: "",
        city: "",
        state: "",
        country: "India",
      });
      toast({
        title: "Company deleted",
        description: "Your company profile has been removed.",
      });
    } catch (err) {
      console.error("Failed to delete company", err);
      setError("Unable to delete company.");
      toast({
        title: "Unable to delete company",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-5xl mx-auto">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6">Company Management</h1>

      <section className="mb-8 sm:mb-10 bg-white rounded-lg md:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-6">
        <h2 className="text-base sm:text-lg md:text-lg font-semibold mb-1 sm:mb-2">
          {companyId ? "Your company" : "Create your company"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          This form is synced with your company details from your profile settings.
        </p>

        {loading ? (
          <p className="text-gray-500 text-xs sm:text-sm">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm md:text-sm font-medium mb-0.5 sm:mb-1">Name</label>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Acme Studios" className="text-xs sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm md:text-sm font-medium mb-0.5 sm:mb-1">Industry</label>
              <Input name="industry" value={form.industry} onChange={handleChange} placeholder="Design, Development" className="text-xs sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm md:text-sm font-medium mb-0.5 sm:mb-1">Website</label>
              <Input name="website" value={form.website} onChange={handleChange} placeholder="https://" className="text-xs sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm md:text-sm font-medium mb-0.5 sm:mb-1">Description</label>
              <Textarea name="description" value={form.description} onChange={handleChange} rows={3} className="text-xs sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm md:text-sm font-medium mb-0.5 sm:mb-1">Company location</label>
              <LocationSelector
                value={{
                  city: form.city,
                  state: form.state,
                  country: form.country,
                }}
                onChange={(next) =>
                  setForm((prev) => ({
                    ...prev,
                    city: next.city,
                    state: next.state,
                    country: next.country,
                  }))
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : saved ? "Saved!" : companyId ? "Update company" : "Create company"}
              </Button>
              {companyId && (
                <Button type="button" variant="outline" disabled={deleting} onClick={handleDelete}>
                  {deleting ? "Deleting..." : "Delete company"}
                </Button>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>
        )}
      </section>
    </div>
  );
};

export default CompaniesTab;
