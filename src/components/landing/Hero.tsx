import { Button } from "../ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { Variants } from "framer-motion";

const heroSlides = [
  {
    title: "The Smart CRM That Grows Your Business",
    description:
      "Streamline your sales process, manage leads efficiently, and close Leads faster with our intelligent CRM platform.",
  },
  {
    title: "Boost Your Team’s Productivity Effortlessly",
    description:
      "Collaborate seamlessly, automate repetitive workflows, and focus on closing the most important Leads effectively.",
  },
  {
    title: "Turn Every Lead Into a Loyal Customer",
    description:
      "Track each opportunity carefully, nurture relationships strategically, and grow your revenue with actionable insights.",
  },
];



export const Hero = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const textVariants: Variants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const orbVariants: Variants = {
    float: {
      y: [0, -20, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
    glow: {
      scale: [0.9, 1.1, 0.9],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const imgVariants: Variants = {
    float: {
      y: [0, -15, 0],
      scale: [1, 1.02, 1],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex items-center pt-20 pb-20 lg:pt-0 lg:pb-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10 opacity-50">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-chart-4/20 animate-gradient-x" />
      </div>

      {/* Glow Orbs - Enhanced */}
      <motion.div
        className="absolute top-10 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl -z-10"
        variants={orbVariants}
        animate="float"
      />
      <motion.div
        className="absolute bottom-10 left-10 w-96 h-96 bg-chart-4/30 rounded-full blur-3xl -z-10"
        variants={orbVariants}
        animate="float"
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-chart-2/20 rounded-full blur-3xl -z-10"
        variants={orbVariants}
        animate="glow"
      />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 1 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
                  <span className="text-primary">{heroSlides[activeSlide].title}</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8">
                  {heroSlides[activeSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  size="lg"
                  className="text-lg px-8 shadow-md bg-primary text-primary-foreground"
                  onClick={() => navigate("/login")}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8"
                  onClick={() => navigate("/demo")}
                >
                  <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Book a Demo
                </Button>
              </motion.div>
            </div>

            {/* Trust Points */}
            <motion.div
              className="mt-12 flex items-center gap-8 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[hsl(var(--chart-2))] rounded-full animate-pulse" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[hsl(var(--chart-2))] rounded-full animate-pulse" />
                14-day free trial
              </div>
            </motion.div>
          </div>

          {/* RIGHT - Dashboard Image */}
          <motion.div
            className="relative"
            variants={imgVariants}
            animate="float"
          >
            <div className="relative w-full aspect-video rounded-2xl shadow-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card to-primary/10">
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-chart-4/10" />

              {/* Dashboard mockup content */}
              <div className="relative h-full flex flex-col p-6">
                {/* Top bar */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 h-8 bg-muted/50 rounded-md" />
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <div className="h-2 w-16 bg-primary/40 rounded mb-2" />
                    <div className="h-6 w-12 bg-primary/60 rounded" />
                  </div>
                  <div className="bg-chart-2/10 rounded-lg p-3 border border-chart-2/20">
                    <div className="h-2 w-16 bg-chart-2/40 rounded mb-2" />
                    <div className="h-6 w-12 bg-chart-2/60 rounded" />
                  </div>
                  <div className="bg-chart-4/10 rounded-lg p-3 border border-chart-4/20">
                    <div className="h-2 w-16 bg-chart-4/40 rounded mb-2" />
                    <div className="h-6 w-12 bg-chart-4/60 rounded" />
                  </div>
                </div>

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center backdrop-blur-sm bg-background/30 p-6 rounded-xl border border-border/50">
                    <div className="text-5xl mb-3">📊</div>
                    <p className="text-sm font-medium text-foreground/80">CRM Dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effects around image */}
            <motion.div
              className="absolute -bottom-8 -left-8 w-72 h-72 bg-primary/40 rounded-full blur-3xl -z-10"
              variants={orbVariants}
              animate="glow"
            />
            <motion.div
              className="absolute -top-8 -right-8 w-72 h-72 bg-chart-4/40 rounded-full blur-3xl -z-10"
              variants={orbVariants}
              animate="glow"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
