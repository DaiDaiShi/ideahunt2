import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Sparkles,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  User,
} from "lucide-react";

interface RelevantReview {
  text: string;
  rating: number;
  reviewer: string;
  date: string;
  relevanceReason: string;
  sentiment: "positive" | "negative" | "neutral";
  placeName: string;
}

interface AnalysisResult {
  summary: string;
  relevantReviews: RelevantReview[];
}

const Results = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    analysis: AnalysisResult;
    criteria: string;
    redFlags: string;
  } | null;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!state?.analysis) {
      navigate("/analyze");
    }
  }, [state, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!state?.analysis) {
    return null;
  }

  const { analysis, criteria, redFlags } = state;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case "negative":
        return <ThumbsDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "negative":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/analyze">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Analyze Another
            </Link>
          </Button>

          {/* Search Criteria Summary */}
          <Card className="mb-6 bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Search className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Looking for:</span> {criteria}
                  </p>
                  {redFlags && (
                    <p className="text-sm text-destructive">
                      <span className="font-medium">Avoiding:</span> {redFlags}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Summary
              </CardTitle>
              <CardDescription>
                Based on {analysis.relevantReviews.length} relevant reviews found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* Relevant Reviews */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Star className="w-5 h-5" />
              Relevant Reviews ({analysis.relevantReviews.length})
            </h2>

            {analysis.relevantReviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No reviews found matching your criteria. Try adjusting your search terms.
                </CardContent>
              </Card>
            ) : (
              analysis.relevantReviews.map((review, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.reviewer}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {review.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <Badge
                          variant="outline"
                          className={getSentimentColor(review.sentiment)}
                        >
                          {getSentimentIcon(review.sentiment)}
                          <span className="ml-1 capitalize">{review.sentiment}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Place Name */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      {review.placeName}
                    </div>

                    {/* Review Text */}
                    <p className="text-sm text-foreground leading-relaxed mb-3">
                      {review.text}
                    </p>

                    {/* Relevance Reason */}
                    <Separator className="my-3" />
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-primary">Why this is relevant:</span>{" "}
                        {review.relevanceReason}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 text-center">
            <Button variant="hero" asChild>
              <Link to="/analyze">
                <Search className="w-4 h-4 mr-2" />
                Analyze More Places
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Results;
