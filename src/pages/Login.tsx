import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const Login = () => {
  return (
    <Layout>
      <div className="container py-16 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Log in to your LocalSkillHub account</p>
        </div>

        <div className="glass-card p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:border-primary transition-colors">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="Email Address" className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border focus-within:border-primary transition-colors">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="Password" className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-xs text-primary hover:text-brand-glow transition-colors">Forgot password?</a>
            </div>

            <Button className="w-full gradient-brand text-primary-foreground font-semibold h-12 glow-sm gap-2">
              Log In <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-brand-glow transition-colors font-medium">Sign Up</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
