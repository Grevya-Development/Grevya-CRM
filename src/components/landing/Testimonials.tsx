import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Sales Director",
    company: "TechCorp Inc",
    avatar: "SJ",
    rating: 5,
    text: "Grevya CRM has transformed how we manage our sales pipeline. Our team closed 40% more Leads in the first quarter after implementation.",
  },
  {
    name: "Michael Chen",
    role: "CEO",
    company: "StartupXYZ",
    avatar: "MC",
    rating: 5,
    text: "The automation features saved us countless hours. What used to take our team days now happens automatically. Highly recommend!",
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Manager",
    company: "GrowthLabs",
    avatar: "ER",
    rating: 5,
    text: "Finally, a CRM that's actually easy to use! Our adoption rate was 100% within the first week. The interface is incredibly intuitive.",
  },
  {
    name: "David Thompson",
    role: "VP of Sales",
    company: "Enterprise Solutions",
    avatar: "DT",
    rating: 5,
    text: "The analytics and reporting features give us insights we never had before. Data-driven decisions have never been easier.",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Loved by Teams Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about their experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="animate-fade-in-up border-border hover:shadow-lg transition-all"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
