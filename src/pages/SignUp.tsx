import { useState } from "react";
import { Mail, Lock, User, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const SignUp = () => {
  const [role, setRole] = useState<"freelancer" | "client">("freelancer");

  return (
    <Layout>
      <div className="container py-16 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Join LocalSkillHub</h1>
          <p className="text-muted-foreground">Create your account and start connecting locally</p>
        </div>

        <div className="glass-card p-8">
          {/* Role Toggle */}
          <div className="flex gap-2 mb-6">
            {(["freelancer", "client"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                  role === r ? "gradient-brand text-primary-foreground glow-sm" : "bg-secondary text-muted-foreground"
                }`}
              >
                I'm a {r}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:border-primary transition-colors">
              <User className="h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Full Name" className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:border-primary transition-colors">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="Email Address" className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:border-primary transition-colors">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="City" className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:border-primary transition-colors">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="Password" className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>

            <Button className="w-full gradient-brand text-primary-foreground font-semibold h-12 glow-sm gap-2">
              Create Account <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-brand-glow transition-colors font-medium">Log In</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default SignUp;
