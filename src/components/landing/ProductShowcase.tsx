import { Check } from "lucide-react";

const benefits = [
  "Real-time collaboration across teams",
  "Customizable dashboards and reports",
  "Mobile-responsive interface",
  "Advanced filtering and search",
  "Automated data entry and updates",
  "Integration with popular tools",
];

export const ProductShowcase = () => {
  return (
    <section className="py-8 lg:py-10 bg-gradient-to-r from-white via-blue-50 to-white min-h-[calc(100vh-5rem)] flex items-center">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-chart-4/20 rounded-full blur-3xl animate-float" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1 animate-fade-in-left perspective-1000">
            <div className="relative transform-3d hover:scale-105 transition-all duration-700">
              <div className="relative w-full aspect-video rounded-2xl shadow-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card to-chart-2/10">
                {/* Glass effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-chart-2/10 via-transparent to-primary/10" />

                {/* Mockup content */}
                <div className="relative h-full flex flex-col p-6">
                  {/* Sidebar simulation */}
                  <div className="flex gap-4 h-full">
                    <div className="w-16 bg-muted/50 rounded-lg" />
                    <div className="flex-1 space-y-4">
                      <div className="h-10 bg-muted/50 rounded-lg" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-chart-2/20 rounded-lg border border-chart-2/30" />
                        <div className="h-24 bg-primary/20 rounded-lg border border-primary/30" />
                      </div>
                      <div className="h-32 bg-muted/40 rounded-lg" />
                    </div>
                  </div>

                  {/* Center overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center backdrop-blur-sm bg-background/30 p-6 rounded-xl border border-border/50">
                      <div className="text-3xl mb-2">💼</div>
                      <p className="text-sm font-medium text-foreground/80">Product Dashboard</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-gradient-to-r from-chart-2/40 to-primary/40 rounded-full blur-3xl animate-pulse-glow -z-10" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 animate-fade-in-right">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-4 animate-scale-up">
              A Dashboard That Works{" "}
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                For You
              </span>
            </h2>
            <p
              className="text-base text-muted-foreground mb-6 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Experience a clean, intuitive interface designed to maximize productivity and minimize learning curve.
            </p>

            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 animate-fade-in-left group hover:translate-x-2 transition-transform duration-300"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <Check className="w-3 h-3 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-sm lg:text-base text-foreground font-medium group-hover:text-primary transition-colors">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
