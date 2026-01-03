import { Button } from "@/components/ui/button";
import { Heart, DollarSign, Bell, MessageCircle, Eye } from "lucide-react";

interface IdeaCardProps {
  title: string;
  description: string;
  author: string;
  authorInitial: string;
  category: string;
  wantToUse: number;
  willingToPay: number;
  waitlist: number;
  comments: number;
  views: number;
  mockupGradient: string;
}

const IdeaCard = ({
  title,
  description,
  author,
  authorInitial,
  category,
  wantToUse,
  willingToPay,
  waitlist,
  comments,
  views,
  mockupGradient,
}: IdeaCardProps) => {
  return (
    <div className="group bg-gradient-card rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
      {/* Mockup Preview */}
      <div className={`h-48 ${mockupGradient} relative overflow-hidden`}>
        <div className="absolute inset-4 bg-card/90 backdrop-blur rounded-lg shadow-soft flex items-center justify-center">
          <div className="w-3/4 space-y-3">
            <div className="h-3 bg-muted rounded-full w-2/3" />
            <div className="h-3 bg-muted rounded-full w-full" />
            <div className="h-3 bg-muted rounded-full w-1/2" />
            <div className="h-8 bg-primary/20 rounded-lg w-1/3 mt-4" />
          </div>
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-card/90 backdrop-blur rounded-full text-xs font-medium">
          {category}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground">
            {authorInitial}
          </div>
          <span className="text-sm text-muted-foreground">{author}</span>
        </div>

        {/* Title & Description */}
        <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>

        {/* Validation Signals */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="signal" size="sm" className="gap-1.5">
            <Heart className="w-3.5 h-3.5 text-signal-want" />
            <span>{wantToUse}</span>
          </Button>
          <Button variant="signal" size="sm" className="gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-signal-pay" />
            <span>{willingToPay}</span>
          </Button>
          <Button variant="signal" size="sm" className="gap-1.5">
            <Bell className="w-3.5 h-3.5 text-signal-waitlist" />
            <span>{waitlist}</span>
          </Button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/50">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{comments} comments</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{views} views</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaCard;
