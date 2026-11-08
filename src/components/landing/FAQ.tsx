import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"

const faqs = [
  {
    question: "Do I need a credit card for the free trial?",
    answer: "No! You can start your 14-day free trial without entering any credit card information. No strings attached.",
  },
  {
    question: "Can I change my plan later?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
  },
  {
    question: "How does data migration work?",
    answer: "We provide free data migration support for all new customers. Our team will help you import your existing contacts, Leads, and history from your current system.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes! We use bank-level encryption (256-bit SSL) and are GDPR compliant. Your data is stored in secure, redundant data centers with regular backups.",
  },
  {
    question: "Do you offer mobile apps?",
    answer: "Yes! We have native iOS and Android apps that sync seamlessly with the web version, so you can manage your CRM on the go.",
  },
  {
    question: "What kind of support do you provide?",
    answer: "We offer email support for all plans, priority support for Pro plans, and dedicated account managers for Enterprise customers. Our average response time is under 2 hours.",
  },
  {
    question: "Can I integrate with my existing tools?",
    answer: "Yes! We integrate with over 100+ popular business tools including Gmail, Slack, WhatsApp, Zapier, and many more. Custom integrations are available for Enterprise plans.",
  },
  {
    question: "What happens if I cancel?",
    answer: "You can cancel anytime. You'll continue to have access until the end of your billing period, and you can export all your data before canceling.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-8 lg:py-10 bg-background min-h-[calc(100vh-5rem)] flex items-center">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
