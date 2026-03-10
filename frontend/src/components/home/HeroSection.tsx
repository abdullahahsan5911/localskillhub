import { useState, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import imgWebDesign from "@/assets/categories/web-design.jpg";
import imgGraphicDesign from "@/assets/categories/graphic-design.jpg";
import imgPhotography from "@/assets/categories/photography.jpg";
import imgVideoProduction from "@/assets/categories/video-production.jpg";
import imgDigitalMarketing from "@/assets/categories/digital-marketing.jpg";

const slides = [
  imgWebDesign,
  imgGraphicDesign,
  imgPhotography,
  imgVideoProduction,
  imgDigitalMarketing,
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  const goNext = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
      setFade(true);
    }, 400);
  }, []);

  useEffect(() => {
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [goNext]);

  return (
    <section className="bg-foreground text-primary-foreground h-[80vh] min-h-[520px] flex items-center overflow-hidden">
      <div className="w-full max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — Copy */}
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.08] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Find The Best
            <br />
            Local <span className="text-brand">Freelancers</span>
            <br />
            Near You
          </motion.h1>

          <motion.p
            className="text-primary-foreground/55 text-base md:text-lg max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Trusted professionals in 200+ cities. Verified skills, community
            endorsements, real results.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link to="/browse">
              <Button className="bg-brand text-foreground font-semibold h-13 px-8 rounded-xl text-base hover:bg-brand-glow transition-all duration-200 gap-2 group">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — Image Carousel */}
        <motion.div
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden hidden lg:block"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {slides.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                i === current
                  ? fade
                    ? "opacity-100"
                    : "opacity-0"
                  : "opacity-0"
              }`}
            />
          ))}

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setFade(false);
                  setTimeout(() => {
                    setCurrent(i);
                    setFade(true);
                  }, 300);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-brand w-6"
                    : "bg-primary-foreground/40 hover:bg-primary-foreground/60"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
