import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Content */}
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Stop Building Blindly
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of creators who validate their ideas before investing months of development time. Start for free and get your first validation report today.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Start Validating Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="hero-outline" size="xl">
              See How It Works
            </Button>
          </div>

          {/* Trust */}
          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Free tier includes 3 idea validations
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
