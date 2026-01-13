import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  Star,
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trophy,
} from "lucide-react";

interface Review {
  text: string;
  rating: number;
  reviewer: string;
  date: string;
  relevanceReason?: string;
}

interface Chip {
  label: string;
  type: "positive" | "negative";
  reviewIndices: number[];
}

interface LocationAnalysis {
  url: string;
  placeName: string;
  matchScore: number;
  summary: string;
  chips: Chip[];
  reviews: Review[];
}

interface AnalysisResult {
  locations: LocationAnalysis[];
}

const Results = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState<{ locationIndex: number; chipIndex: number } | null>(null);

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

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-green-500/10 border-green-500/20";
    if (score >= 40) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    return <span className="text-muted-foreground font-medium">#{index + 1}</span>;
  };

  const toggleLocation = (index: number) => {
    setExpandedLocation(expandedLocation === index ? null : index);
    setSelectedChip(null);
  };

  const handleChipClick = (locationIndex: number, chipIndex: number) => {
    if (selectedChip?.locationIndex === locationIndex && selectedChip?.chipIndex === chipIndex) {
      setSelectedChip(null);
    } else {
      setSelectedChip({ locationIndex, chipIndex });
      setExpandedLocation(locationIndex);
    }
  };

  const getFilteredReviews = (locationIndex: number, loc: LocationAnalysis) => {
    if (selectedChip?.locationIndex === locationIndex) {
      const chip = loc.chips[selectedChip.chipIndex];
      if (chip) {
        return chip.reviewIndices.map((i) => loc.reviews[i]).filter(Boolean);
      }
    }
    // Show reviews with relevance reasons, or all if none have reasons
    const relevant = loc.reviews.filter((r) => r.relevanceReason);
    return relevant.length > 0 ? relevant : loc.reviews.slice(0, 5);
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

          {/* Results Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold mb-2">
              {analysis.locations.length} Location{analysis.locations.length !== 1 ? "s" : ""} Analyzed
            </h1>
            <p className="text-muted-foreground">
              Ranked by how well they match your preferences
            </p>
          </div>

          {/* Location Cards */}
          <div className="space-y-4">
            {analysis.locations.map((loc, locIndex) => {
              const isExpanded = expandedLocation === locIndex;
              const filteredReviews = getFilteredReviews(locIndex, loc);

              return (
                <Card key={locIndex} className="overflow-hidden">
                  {/* Location Header - Always Visible */}
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleLocation(locIndex)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankBadge(locIndex)}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {loc.placeName}
                            <a
                              href={loc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {loc.reviews.length} reviews analyzed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full border text-sm font-semibold ${getScoreBg(loc.matchScore)} ${getScoreColor(loc.matchScore)}`}
                        >
                          {loc.matchScore}% match
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Chips - Always visible */}
                    {loc.chips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        {loc.chips.map((chip, chipIndex) => (
                          <Badge
                            key={chipIndex}
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              chip.type === "positive"
                                ? "bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20"
                                : "bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20"
                            } ${
                              selectedChip?.locationIndex === locIndex && selectedChip?.chipIndex === chipIndex
                                ? "ring-2 ring-offset-1 ring-primary"
                                : ""
                            }`}
                            onClick={() => handleChipClick(locIndex, chipIndex)}
                          >
                            {chip.label}
                            <span className="ml-1 opacity-60">({chip.reviewIndices.length})</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <CardContent className="pt-0">
                      {/* AI Summary */}
                      <div className="mb-6 p-4 rounded-lg bg-muted/30">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-primary mt-1 shrink-0" />
                          <p className="text-sm leading-relaxed">{loc.summary}</p>
                        </div>
                      </div>

                      {/* Reviews */}
                      {filteredReviews.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {selectedChip !== null
                              ? `Reviews mentioning "${loc.chips[selectedChip.chipIndex]?.label}"`
                              : "Relevant Reviews"}
                          </h4>

                          {filteredReviews.map((review, reviewIndex) => (
                            <div
                              key={reviewIndex}
                              className="p-3 rounded-lg border bg-card"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm font-medium">{review.reviewer}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderStars(review.rating)}
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {review.date}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {review.text}
                              </p>
                              {review.relevanceReason && (
                                <p className="mt-2 text-xs text-primary flex items-start gap-1">
                                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                                  {review.relevanceReason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {filteredReviews.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No reviews with text content for this location.
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {analysis.locations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No locations could be analyzed. Please check your Google Maps links and try again.
                </p>
              </CardContent>
            </Card>
          )}

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
