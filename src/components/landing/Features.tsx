import { Users, Target, Zap, Calendar, Mail, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const features = [
  {
    icon: Users,
    title: "Lead Management",
    description:
      "Capture, track, and nurture leads from multiple sources in one centralized platform.",
  },
  {
    icon: Target,
    title: "Leads Pipelines",
    description:
      "Visualize your sales pipeline and move Leads through stages with intuitive drag-and-drop.",
  },
  {
    icon: Zap,
    title: "Sales Automation",
    description:
      "Automate repetitive tasks and workflows to focus on what matters most - closing Leads.",
  },
  {
    icon: Calendar,
    title: "Tasks & Reminders",
    description:
      "Never miss a follow-up with smart task management and automated reminders.",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    description:
      "Create, send, and track email campaigns directly from your CRM dashboard.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Get real-time insights with customizable reports and advanced analytics.",
  },
];

export const Features = () => {
  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const blobVariants: Variants = {
    float: {
      y: [0, -20, 0],
      x: [0, 20, 0],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const iconVariants: Variants = {
    float: {
      rotate: [0, 12, -12, 0],
      scale: [1, 1.1, 1, 1.05],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <section
      id="features"
      className="py-8 lg:py-10 bg-[hsl(var(--muted))/0.3] relative overflow-hidden scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center"
    >
      {/* Soft glowing blobs */}
      <motion.div
        className="absolute top-20 right-0 w-96 h-96 bg-[hsl(var(--primary))/0.08] rounded-full blur-3xl"
        variants={blobVariants}
        animate="float"
      />
      <motion.div
        className="absolute bottom-20 left-0 w-96 h-96 bg-[hsl(var(--accent))/0.08] rounded-full blur-3xl"
        variants={blobVariants}
        animate="float"
        style={{ animationDelay: "3s" }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Heading */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Everything You Need to{" "}
            <span className="bg-[hsl(var(--primary))] bg-clip-text text-transparent">
              Scale
            </span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you manage relationships, close
            Leads, and grow your business.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={cardVariants}>
              <Card
                className="
                  group
                  bg-gradient-to-br from-primary/10 via-background/95 to-chart-4/10
                  backdrop-blur-2xl
                  hover:shadow-xl hover:shadow-[hsl(var(--primary))/0.2]
                  transition-all duration-500
                  hover:-translate-y-2
                  border border-primary/20
                "
              >
                <CardContent className="p-4 lg:p-5">
                  {/* Icon */}
                  <motion.div
                    className="
                      w-10 h-10
                      rounded-lg
                      bg-[hsl(var(--primary))/0.15]
                      flex items-center justify-center mb-3
                      shadow-lg
                    "
                    variants={iconVariants}
                    animate="float"
                  >
                    <feature.icon className="w-5 h-5 text-primary transition-transform" />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
