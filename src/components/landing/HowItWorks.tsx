import { UserPlus, Activity, TrendingUp, PieChart } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Add Your Leads",
    description: "Import leads from multiple sources or add them manually to your CRM database.",
  },
  {
    icon: Activity,
    title: "Track Activity",
    description: "Monitor all interactions, emails, calls, and meetings in one unified timeline.",
  },
  {
    icon: TrendingUp,
    title: "Convert Sales",
    description: "Move Leads through your pipeline and close more sales with automated workflows.",
  },
  {
    icon: PieChart,
    title: "Analyze Performance",
    description: "Get actionable insights with detailed reports and performance analytics.",
  },
];

export const HowItWorks = () => {
  return (
    <section
      id="solutions"
      className="py-8 lg:py-10 bg-background relative overflow-hidden scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-cyan-900/10 animate-gradient-y -z-10" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="text-center mb-10 animate-scale-up">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            How It{" "}
            <span className="text-primary">
              Works
            </span>
          </h2>
          <p
            className="text-base text-muted-foreground max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Get started in minutes with our simple 4-step process
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative text-center animate-bounce-in group"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Line connector (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-[length:200%_auto] animate-shimmer -z-10" />
              )}

              <div className="relative inline-flex w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 items-center justify-center mb-4 shadow-lg shadow-blue-500/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-pulse-glow">
                <step.icon className="w-8 h-8 lg:w-10 lg:h-10 text-white group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs lg:text-sm font-bold group-hover:scale-125 transition-transform shadow-lg">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2 group-hover:text-blue-500 transition-colors">
                {step.title}
              </h3>
              <p className="text-sm lg:text-base text-muted-foreground group-hover:text-foreground transition-colors">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
