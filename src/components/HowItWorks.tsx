import { Wand2, Share2, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Wand2,
    title: "Describe Your Idea",
    description: "Tell our AI about your product concept. In seconds, we'll generate visual UI mockups and identify key assumptions that need validation.",
    accent: "from-primary to-primary/70",
  },
  {
    icon: Share2,
    title: "Publish & Collect Signals",
    description: "Share your idea with our community. Users provide high-signal feedback: 'want to use,' 'willing to pay,' or 'join waitlist'—not just likes.",
    accent: "from-secondary to-secondary/70",
  },
  {
    icon: BarChart3,
    title: "Get AI-Powered Insights",
    description: "Our platform generates validation reports, identifies patterns, and tells you exactly whether—and how—to move forward with your idea.",
    accent: "from-signal-pay to-signal-pay/70",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-gradient-subtle">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From abstract idea to validated concept in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-px">
                  <div className="h-full w-1/2 border-t-2 border-dashed border-border" />
                  <ArrowRight className="absolute right-1/2 -top-2.5 w-5 h-5 text-muted-foreground" />
                </div>
              )}

              {/* Card */}
              <div className="bg-gradient-card rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 group-hover:-translate-y-1 border border-border/50 h-full">
                {/* Step Number */}
                <div className="text-sm font-semibold text-muted-foreground mb-4">
                  Step {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center mb-6 shadow-soft`}>
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
