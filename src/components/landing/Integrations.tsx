import { Mail, MessageSquare, Slack, Webhook, Zap, Database } from "lucide-react";

const integrations = [
  { icon: Mail, name: "Gmail" },
  { icon: MessageSquare, name: "WhatsApp" },
  { icon: Slack, name: "Slack" },
  { icon: Webhook, name: "API" },
  { icon: Zap, name: "Zapier" },
  { icon: Database, name: "Database" },
];

export const Integrations = () => {
  return (
    <section className="py-8 bg-gradient-to-r from-white via-blue-50 to-white min-h-[calc(100vh-5rem)] flex items-center">

      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black mb-2">
            Seamless Integrations
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground">
            Connect with the tools you already use
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center group-hover:border-primary group-hover:shadow-lg transition-all">
                <integration.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {integration.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
