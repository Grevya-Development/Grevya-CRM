import { Check, Zap, Users, Lock, Globe } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Zero Setup Time",
    description: "Start using immediately with pre-configured templates and workflows",
  },
  {
    icon: Users,
    title: "Fast, Clean UI",
    description: "Intuitive interface that your team will love from day one",
  },
  {
    icon: Globe,
    title: "Multi-Channel Integration",
    description: "Connect email, WhatsApp, SMS, and more in one platform",
  },
  {
    icon: Lock,
    title: "Role-Based Permissions",
    description: "Control access and maintain data security with granular permissions",
  },
];

const checkPoints = [
  "Unlimited contacts and Leads",
  "Advanced reporting and analytics",
  "24/7 customer support",
  "Regular feature updates",
  "99.9% uptime guarantee",
  "GDPR compliant",
];

export const Benefits = () => {
  return (
    <section
      id="benefits"
      className="py-8 lg:py-10 bg-background min-h-[calc(100vh-5rem)] flex items-center">
      <div className="container mx-auto px-4 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary round mb-2">
            Why Choose Grevya CRM?
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage customer relationships and grow your business
          </p>
        </div>

        {/* Benefit Cards */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6 mb-10">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 lg:p-5 rounded-2xl bg-card border border-border hover:shadow-lg transition-all"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Check Points */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checkPoints.map((point, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-green-400" />
              </div>
              <span className="text-sm text-foreground font-medium">{point}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
