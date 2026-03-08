import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

const HeroSection = () => {
  const [searchService, setSearchService] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  return (
    <section className="bg-foreground text-primary-foreground">
      <div className="container py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6">
            Find The Best Local
            <br />
            <span className="text-brand">Freelancers</span> Near You
          </h1>

          <p className="text-primary-foreground/60 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Trusted professionals in 200+ cities. Verified skills, community endorsements, real results.
          </p>

          {/* Avatars row */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="flex -space-x-3">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-10 h-10 rounded-full border-2 border-foreground object-cover"
                />
              ))}
            </div>
            <span className="text-sm text-primary-foreground/50">
              Join <span className="text-primary-foreground font-semibold">50,000+</span> freelancers
            </span>
          </div>

          {/* Search Bar */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-2 max-w-2xl mx-auto border border-primary-foreground/10">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-foreground/10">
                <Search className="h-5 w-5 text-primary-foreground/40 shrink-0" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  className="bg-transparent w-full text-primary-foreground placeholder:text-primary-foreground/40 outline-none text-sm"
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-foreground/10">
                <MapPin className="h-5 w-5 text-primary-foreground/40 shrink-0" />
                <input
                  type="text"
                  placeholder="City or Postcode"
                  className="bg-transparent w-full text-primary-foreground placeholder:text-primary-foreground/40 outline-none text-sm"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
              <Link to="/browse">
                <Button className="bg-brand text-foreground font-semibold h-12 px-8 w-full sm:w-auto rounded-xl hover:bg-brand-glow transition-all duration-200">
                  Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
