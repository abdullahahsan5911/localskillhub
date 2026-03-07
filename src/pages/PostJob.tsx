import { useState } from "react";
import { MapPin, DollarSign, FileText, Tag, Upload, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const categories = [
  "Web Development", "Graphic Design", "Video Production", "Digital Marketing",
  "Photography", "Content Writing", "Mobile Development", "Data Science",
  "SEO", "Social Media", "Virtual Assistant", "Translation",
];

const PostJob = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    skills: [] as string[],
    city: "",
    remoteAllowed: false,
    budgetType: "fixed",
    budgetMin: "",
    budgetMax: "",
  });

  const steps = [
    { num: 1, label: "Category" },
    { num: 2, label: "Details" },
    { num: 3, label: "Location & Budget" },
    { num: 4, label: "Review" },
  ];

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Post a Job</h1>
        <p className="text-muted-foreground mb-8">Find the perfect local freelancer for your project</p>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                step >= s.num ? "gradient-brand text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${step > s.num ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Select a Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`p-4 rounded-xl text-sm font-medium text-left transition-all ${
                      formData.category === cat
                        ? "gradient-brand text-primary-foreground glow-sm"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Job Details</h2>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g., Need a website redesign for my restaurant"
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                <textarea
                  rows={5}
                  placeholder="Describe your project in detail..."
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Required Skills</label>
                <div className="flex flex-wrap gap-2">
                  {["React", "Node.js", "Figma", "WordPress", "SEO", "Python", "Photoshop", "Video Editing"].map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        const skills = formData.skills.includes(skill)
                          ? formData.skills.filter((s) => s !== skill)
                          : [...formData.skills, skill];
                        setFormData({ ...formData, skills });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        formData.skills.includes(skill)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location & Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Location & Budget</h2>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">City / Location</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g., Mumbai, Maharashtra"
                    className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.remoteAllowed}
                    onChange={(e) => setFormData({ ...formData, remoteAllowed: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Remote work allowed</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Budget Type</label>
                <div className="flex gap-3">
                  {["fixed", "hourly"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, budgetType: type })}
                      className={`px-6 py-3 rounded-xl text-sm font-medium capitalize transition-colors ${
                        formData.budgetType === type
                          ? "gradient-brand text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {type} Price
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Min Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="5,000"
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors text-sm"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Max Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="25,000"
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors text-sm"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Review Your Job</h2>
              <div className="space-y-4">
                {[
                  { label: "Category", value: formData.category || "Not selected" },
                  { label: "Title", value: formData.title || "Not provided" },
                  { label: "Location", value: `${formData.city || "Not specified"}${formData.remoteAllowed ? " (Remote OK)" : ""}` },
                  { label: "Budget", value: formData.budgetMin || formData.budgetMax ? `₹${formData.budgetMin} - ₹${formData.budgetMax} (${formData.budgetType})` : "Not set" },
                  { label: "Skills", value: formData.skills.length > 0 ? formData.skills.join(", ") : "None selected" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-3 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
              {formData.description && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Description</span>
                  <p className="text-sm text-foreground bg-secondary rounded-xl p-4">{formData.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border/40">
            <Button
              variant="outline"
              className="border-border text-foreground gap-2"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button
                className="gradient-brand text-primary-foreground font-semibold gap-2"
                onClick={() => setStep(Math.min(4, step + 1))}
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="gradient-brand text-primary-foreground font-semibold glow-sm gap-2">
                <Check className="h-4 w-4" /> Post Job
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostJob;
