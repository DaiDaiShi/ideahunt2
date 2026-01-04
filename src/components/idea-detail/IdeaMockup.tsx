import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, DollarSign, Bell, Share2, Bookmark } from "lucide-react";

interface IdeaMockupProps {
  title: string;
  description: string;
  author: string;
  authorInitial: string;
  category: string;
  createdAt: string;
  mockupGradient: string;
}

const IdeaMockup = ({
  title,
  description,
  author,
  authorInitial,
  category,
  createdAt,
  mockupGradient,
}: IdeaMockupProps) => {
  return (
    <div className="space-y-6">
      {/* Full Mockup Preview */}
      <div className={`aspect-video ${mockupGradient} rounded-2xl relative overflow-hidden shadow-medium`}>
        <div className="absolute inset-6 bg-card/95 backdrop-blur rounded-xl shadow-soft flex items-center justify-center">
          <div className="w-4/5 space-y-4">
            <div className="h-4 bg-muted rounded-full w-1/3" />
            <div className="h-4 bg-muted rounded-full w-2/3" />
            <div className="h-4 bg-muted rounded-full w-full" />
            <div className="h-4 bg-muted rounded-full w-3/4" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="h-20 bg-muted/60 rounded-lg" />
              <div className="h-20 bg-muted/60 rounded-lg" />
              <div className="h-20 bg-muted/60 rounded-lg" />
            </div>
            <div className="flex gap-3 mt-6">
              <div className="h-10 bg-primary/30 rounded-lg w-32" />
              <div className="h-10 bg-muted rounded-lg w-24" />
            </div>
          </div>
        </div>
        <Badge className="absolute top-4 right-4 bg-card/90 backdrop-blur text-foreground">
          {category}
        </Badge>
      </div>

      {/* Idea Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-sm font-bold text-primary-foreground">
            {authorInitial}
          </div>
          <div>
            <p className="font-medium">{author}</p>
            <p className="text-sm text-muted-foreground">Posted {createdAt}</p>
          </div>
        </div>
      </div>

      {/* Quick Signal Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
        <Button variant="outline" className="gap-2 hover:bg-signal-want/10 hover:border-signal-want/50">
          <Heart className="w-4 h-4 text-signal-want" />
          I want this
        </Button>
        <Button variant="outline" className="gap-2 hover:bg-signal-pay/10 hover:border-signal-pay/50">
          <DollarSign className="w-4 h-4 text-signal-pay" />
          I'd pay for this
        </Button>
        <Button variant="outline" className="gap-2 hover:bg-signal-waitlist/10 hover:border-signal-waitlist/50">
          <Bell className="w-4 h-4 text-signal-waitlist" />
          Notify me when ready
        </Button>
      </div>
    </div>
  );
};

export default IdeaMockup;
