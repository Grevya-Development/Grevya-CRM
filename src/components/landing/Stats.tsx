import { Users, TrendingUp, Award } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { icon: Users, value: 37000, suffix: "+", label: "Active Users" },
  { icon: TrendingUp, value: 120, suffix: "M+", label: "Leads Managed" },
  { icon: Award, value: 98, suffix: "%", label: "Customer Satisfaction" },
];

const AnimatedCounter = ({ end, suffix }: { end: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    ref.current && observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [end, isVisible]);

  return (
    <div ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

export const Stats = () => {
  return (
    <section className="py-16 bg-background border-y border-border relative overflow-hidden">
      
      {/* Soft background shine */}
      <div className="absolute inset-0 
        bg-gradient-to-r 
        from-[hsl(var(--primary))/0.05] 
        via-transparent 
        to-[hsl(var(--accent))/0.05] 
        animate-gradient-x -z-10"
      />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center animate-bounce-in group"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Icon Container */}
              <div
                className="
                w-16 h-16 
                rounded-2xl 
                bg-[hsl(var(--primary))/0.15]
                flex items-center justify-center mb-4 
                group-hover:scale-110 group-hover:rotate-6 
                transition-all duration-300 
                shadow-lg 
                group-hover:shadow-[0_0_20px_hsl(var(--primary))]
                "
              >
                <stat.icon className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
              </div>

              {/* Number */}
              <div className="text-4xl font-bold 
                bg-[hsl(var(--primary))] 
                bg-clip-text text-transparent 
                mb-2"
              >
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>

              {/* Label */}
              <div className="text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                {stat.label}
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};
