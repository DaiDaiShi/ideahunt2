import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
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
  ThumbsUp,
  ThumbsDown,
  Share2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { saveResult, getResult } from "@/integrations/firebase/resultService";

interface Review {
  text: string;
  rating: number;
  reviewer: string;
  date: string;
}

interface Chip {
  label: string;
  type: "positive" | "negative";
  reviewIndices: number[];
}

interface LocationAnalysis {
  url: string;
  placeName: string;
  totalScore: number;
  reviewsCount: number;
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
  const { resultId: urlResultId } = useParams<{ resultId: string }>();

  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState<{
    locationIndex: number;
    chipIndex: number;
  } | null>(null);
  const [resultId, setResultId] = useState<string | null>(urlResultId || null);
  const [isLoading, setIsLoading] = useState(!!urlResultId);
  const [isCopied, setIsCopied] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState("");
  const [redFlags, setRedFlags] = useState("");

  const state = location.state as {
    analysis: AnalysisResult;
    title: string;
    criteria: string;
    redFlags: string;
  } | null;

  // Load result from URL param or save new result from state
  useEffect(() => {
    const loadOrSaveResult = async () => {
      // If we have a URL param, load from Firestore
      if (urlResultId) {
        setIsLoading(true);
        try {
          const storedResult = await getResult(urlResultId);
          if (storedResult) {
            setAnalysis({ locations: storedResult.locations });
            setTitle(storedResult.title);
            setCriteria(storedResult.criteria);
            setRedFlags(storedResult.redFlags);
            setResultId(urlResultId);
          } else {
            toast.error("Result not found");
            navigate("/analyze");
          }
        } catch (error) {
          console.error("Error loading result:", error);
          toast.error("Failed to load result");
          navigate("/analyze");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // If we have state from analysis, save it and update URL
      if (state?.analysis && user) {
        setAnalysis(state.analysis);
        setTitle(state.title || "Untitled Analysis");
        setCriteria(state.criteria);
        setRedFlags(state.redFlags || "");

        try {
          const newResultId = await saveResult(
            user.id,
            state.title || "Untitled Analysis",
            state.criteria,
            state.redFlags || "",
            state.analysis.locations
          );
          setResultId(newResultId);
          // Update URL without navigation
          window.history.replaceState(null, "", `/results/${newResultId}`);
        } catch (error) {
          console.error("Error saving result:", error);
          // Still show results even if save fails
        }
        return;
      }

      // No URL param and no state - redirect to analyze
      if (!authLoading && !urlResultId && !state?.analysis) {
        navigate("/analyze");
      }
    };

    if (!authLoading) {
      loadOrSaveResult();
    }
  }, [urlResultId, state, user, authLoading, navigate]);

  const handleShare = async () => {
    if (!resultId) return;
    const shareUrl = `${window.location.origin}/results/${resultId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
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
    return (
      <span className="text-muted-foreground font-medium">#{index + 1}</span>
    );
  };

  const toggleLocation = (index: number) => {
    setExpandedLocation(expandedLocation === index ? null : index);
    setSelectedChip(null);
  };

  const getFilteredReviews = (locationIndex: number, loc: LocationAnalysis) => {
    if (selectedChip?.locationIndex === locationIndex) {
      const chip = loc.chips[selectedChip.chipIndex];
      if (chip) {
        return chip.reviewIndices.map((i) => loc.reviews[i]).filter(Boolean);
      }
    }
    // When no chip selected, show reviews that appear in at least one chip (most relevant)
    const chipReviewIndices = new Set<number>();
    loc.chips.forEach((chip) => {
      chip.reviewIndices.forEach((i) => chipReviewIndices.add(i));
    });
    if (chipReviewIndices.size > 0) {
      return Array.from(chipReviewIndices)
        .slice(0, 5)
        .map((i) => loc.reviews[i])
        .filter(Boolean);
    }
    // Fallback to first few reviews
    return loc.reviews.slice(0, 5);
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
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold mb-1">
                {title}
              </h1>
              <p className="text-muted-foreground">
                {analysis.locations.length} location
                {analysis.locations.length !== 1 ? "s" : ""} analyzed · Ranked by match score
              </p>
            </div>
            {resultId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Location Cards */}
          <div className="space-y-4">
            {analysis.locations.map((loc, locIndex) => {
              const isExpanded = expandedLocation === locIndex;
              const filteredReviews = getFilteredReviews(locIndex, loc);
              const positiveChips = loc.chips.filter(
                (c) => c.type === "positive"
              );
              const negativeChips = loc.chips.filter(
                (c) => c.type === "negative"
              );

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
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {loc.totalScore > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium text-foreground">{loc.totalScore.toFixed(1)}</span>
                                <span>({loc.reviewsCount.toLocaleString()} reviews)</span>
                              </span>
                            )}
                            <span>· {loc.reviews.length} analyzed</span>
                          </div>
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

                    {/* Positive chips */}
                    {positiveChips.length > 0 && (
                      <div
                        className="mt-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <div className="flex flex-wrap gap-2">
                            {positiveChips.map((chip, chipIndex) => {
                              const actualIndex = loc.chips.indexOf(chip);
                              return (
                                <Badge
                                  key={chipIndex}
                                  variant="outline"
                                  className={`cursor-pointer transition-all bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20 ${
                                    selectedChip?.locationIndex === locIndex &&
                                    selectedChip?.chipIndex === actualIndex
                                      ? "ring-2 ring-offset-1 ring-green-500"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    const idx = loc.chips.indexOf(chip);
                                    if (
                                      selectedChip?.locationIndex ===
                                        locIndex &&
                                      selectedChip?.chipIndex === idx
                                    ) {
                                      setSelectedChip(null);
                                    } else {
                                      setSelectedChip({
                                        locationIndex: locIndex,
                                        chipIndex: idx,
                                      });
                                      setExpandedLocation(locIndex);
                                    }
                                  }}
                                >
                                  {chip.label}
                                  <span className="ml-1 opacity-60">
                                    ({chip.reviewIndices.length})
                                  </span>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Negative chips */}
                    {negativeChips.length > 0 && (
                      <div
                        className="mt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <div className="flex flex-wrap gap-2">
                            {negativeChips.map((chip, chipIndex) => {
                              const actualIndex = loc.chips.indexOf(chip);
                              return (
                                <Badge
                                  key={chipIndex}
                                  variant="outline"
                                  className={`cursor-pointer transition-all bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20 ${
                                    selectedChip?.locationIndex === locIndex &&
                                    selectedChip?.chipIndex === actualIndex
                                      ? "ring-2 ring-offset-1 ring-red-500"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    const idx = loc.chips.indexOf(chip);
                                    if (
                                      selectedChip?.locationIndex ===
                                        locIndex &&
                                      selectedChip?.chipIndex === idx
                                    ) {
                                      setSelectedChip(null);
                                    } else {
                                      setSelectedChip({
                                        locationIndex: locIndex,
                                        chipIndex: idx,
                                      });
                                      setExpandedLocation(locIndex);
                                    }
                                  }}
                                >
                                  {chip.label}
                                  <span className="ml-1 opacity-60">
                                    ({chip.reviewIndices.length})
                                  </span>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
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
                            {selectedChip !== null &&
                            selectedChip.locationIndex === locIndex
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
                                  <span className="text-sm font-medium">
                                    {review.reviewer}
                                  </span>
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
                  No locations could be analyzed. Please check your Google Maps
                  links and try again.
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
