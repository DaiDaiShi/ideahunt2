import { Button } from "@/components/ui/button";
import { RefreshCw, Check, Sparkles, Loader2 } from "lucide-react";

interface MockupPreviewProps {
  title: string;
  tagline: string;
  features: string[];
  images: string[];
  onRegenerate: () => void;
  onPublish: () => void;
  isRegenerating: boolean;
  isPublishing: boolean;
}

const MockupPreview = ({
  title,
  tagline,
  features,
  images,
  onRegenerate,
  onPublish,
  isRegenerating,
  isPublishing,
}: MockupPreviewProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI-Generated Mockup</span>
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Preview Your Idea</h2>
        <p className="text-muted-foreground">Review and publish when ready</p>
      </div>

      {/* Mockup Card Preview */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        {/* Uploaded Images or Simulated App Mockup */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-1">
            {images.map((url, index) => (
              <div 
                key={index} 
                className={`aspect-video ${images.length === 1 ? 'col-span-2' : ''}`}
              >
                <img
                  src={url}
                  alt={`${title} preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10 relative overflow-hidden">
            <div className="absolute inset-4 bg-background/90 backdrop-blur-sm rounded-xl border border-border/50 p-6 flex flex-col">
              {/* App Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {title.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground">{tagline}</p>
                </div>
              </div>

              {/* Simulated Feature Cards */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {features.slice(0, 4).map((feature, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 rounded-lg p-3 flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium truncate">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Simulated CTA */}
              <div className="mt-4 flex gap-2">
                <div className="flex-1 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">Get Started</span>
                </div>
                <div className="h-10 px-4 border border-border rounded-lg flex items-center justify-center">
                  <span className="text-sm">Learn More</span>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-accent/30 rounded-full blur-xl" />
          </div>
        )}

        {/* Idea Details */}
        <div className="p-6">
          <h3 className="text-xl font-display font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{tagline}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {features.slice(0, 4).map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-muted rounded-full text-xs font-medium"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Validation Signals Preview */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Want to Use</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-xs text-muted-foreground">Willing to Pay</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">0</div>
              <div className="text-xs text-muted-foreground">Waitlist</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onRegenerate}
          disabled={isRegenerating || isPublishing}
          className="flex-1"
        >
          {isRegenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Regenerate Mockup
        </Button>
        <Button
          variant="hero"
          size="lg"
          onClick={onPublish}
          disabled={isRegenerating || isPublishing}
          className="flex-1"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Publish Idea
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MockupPreview;
