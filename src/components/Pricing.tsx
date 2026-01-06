import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Explorer",
    price: "Free",
    description: "Perfect for testing your first ideas",
    features: [
      "Submit up to 3 ideas",
      "Basic AI mockup generation",
      "Community feedback",
      "Public idea page",
    ],
    cta: "Get Started",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Creator",
    price: "$19",
    period: "/month",
    description: "For serious entrepreneurs validating multiple ideas",
    features: [
      "Unlimited idea submissions",
      "Advanced AI mockups with flows",
      "Priority community placement",
      "Detailed validation analytics",
      "Export waitlist emails",
      "Remove IdeaHunt branding",
    ],
    cta: "Start Creating",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Studio",
    price: "$49",
    period: "/month",
    description: "For teams and agencies validating at scale",
    features: [
      "Everything in Creator",
      "Team collaboration (5 seats)",
      "Custom branding",
      "API access",
      "Priority support",
      "Advanced export options",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-gradient-subtle">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you're ready to scale your validation
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-gradient-card rounded-2xl border p-8 shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1 ${
                plan.popular
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-hero rounded-full text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.variant}
                className="w-full"
                asChild
              >
                <Link to="/auth">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Teaser */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Questions?{" "}
            <a href="#" className="text-primary hover:underline">
              Check our FAQ
            </a>{" "}
            or{" "}
            <a href="#" className="text-primary hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
