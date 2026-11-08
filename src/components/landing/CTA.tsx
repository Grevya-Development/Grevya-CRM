import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section
      id="contact"
      className="py-12 lg:py-16 relative overflow-hidden scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center"
      style={{
        background: "linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary)), hsl(var(--accent)))",
        backgroundSize: "200% 200%",
        animation: "gradient-x 8s ease infinite",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center animate-scale-up">
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 animate-fade-in-up"
            style={{ color: "hsl(var(--primary-foreground))" }}
          >
            Ready to Grow Your Business?
          </h2>
          <p
            className="text-base md:text-lg mb-8 max-w-2xl mx-auto animate-fade-in-up"
            style={{ color: "hsl(var(--primary-foreground) / 0.9)", animationDelay: "0.2s" }}
          >
            Join thousands of teams already using Grevya CRM to streamline their sales process
            and close more Leads. Start your free trial today.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 shadow-2xl hover:scale-110 hover:shadow-2xl transition-all duration-300 group"
              style={{
                backgroundColor: "hsl(var(--secondary))",
                color: "hsl(var(--secondary-foreground))",
              }}
              onClick={() => navigate("/login")}
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 hover:scale-110 transition-all duration-300 group backdrop-blur-sm"
              style={{
                backgroundColor: "hsl(var(--background) / 0.1)",
                borderColor: "hsl(var(--border) / 0.2)",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <Mail className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Contact Sales
            </Button>
          </div>

          <p
            className="mt-8 text-sm animate-fade-in"
            style={{ color: "hsl(var(--primary-foreground) / 0.8)", animationDelay: "0.6s" }}
          >
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};
