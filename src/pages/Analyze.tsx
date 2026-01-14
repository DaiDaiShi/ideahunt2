import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search, Loader2, MapPin, AlertTriangle, Sparkles, ThumbsUp, ThumbsDown, Building2 } from "lucide-react";
import { toast } from "sonner";
import { getFunctions, httpsCallable } from "firebase/functions";

interface AnalysisResult {
  locations: Array<{
    url: string;
    placeName: string;
    matchScore: number;
    summary: string;
    chips: Array<{
      label: string;
      type: "positive" | "negative";
      reviewIndices: number[];
    }>;
    reviews: Array<{
      text: string;
      rating: number;
      reviewer: string;
      date: string;
      relevanceReason?: string;
    }>;
    monthlyReviews: Array<{
      month: string;
      positiveCount: number;
      negativeCount: number;
    }>;
  }>;
}

const Analyze = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [links, setLinks] = useState<string[]>([""]);
  const [locationType, setLocationType] = useState("");
  const [criteria, setCriteria] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isGeneratingAspects, setIsGeneratingAspects] = useState(false);
  const [suggestedPositive, setSuggestedPositive] = useState<string[]>([]);
  const [suggestedNegative, setSuggestedNegative] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const addLink = () => {
    if (links.length < 5) {
      setLinks([...links, ""]);
    }
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const isValidGoogleMapsLink = (url: string): boolean => {
    if (!url.trim()) return false;
    return url.includes("google.com/maps") || url.includes("goo.gl/maps") || url.includes("maps.app.goo.gl");
  };

  const handleGenerateAspects = async () => {
    if (!locationType.trim()) {
      toast.error("Please enter what type of locations these are");
      return;
    }

    setIsGeneratingAspects(true);
    try {
      const functions = getFunctions();
      const generateAspects = httpsCallable(functions, "generateAspects");
      const result = await generateAspects({ locationType: locationType.trim() });
      const data = result.data as { positiveAspects: string[]; negativeAspects: string[] };
      setSuggestedPositive(data.positiveAspects || []);
      setSuggestedNegative(data.negativeAspects || []);
    } catch (error: any) {
      console.error("Error generating aspects:", error);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setIsGeneratingAspects(false);
    }
  };

  const addToCriteria = (aspect: string) => {
    const current = criteria.trim();
    if (current.toLowerCase().includes(aspect.toLowerCase())) {
      return; // Already included
    }
    setCriteria(current ? `${current}, ${aspect}` : aspect);
    // Remove from suggested list
    setSuggestedPositive(suggestedPositive.filter((a) => a !== aspect));
  };

  const addToRedFlags = (aspect: string) => {
    const current = redFlags.trim();
    if (current.toLowerCase().includes(aspect.toLowerCase())) {
      return; // Already included
    }
    setRedFlags(current ? `${current}, ${aspect}` : aspect);
    // Remove from suggested list
    setSuggestedNegative(suggestedNegative.filter((a) => a !== aspect));
  };

  const handleAnalyze = async () => {
    // Validate inputs
    const validLinks = links.filter((link) => link.trim() !== "");

    if (validLinks.length === 0) {
      toast.error("Please add at least one Google Maps link");
      return;
    }

    const invalidLinks = validLinks.filter((link) => !isValidGoogleMapsLink(link));
    if (invalidLinks.length > 0) {
      toast.error("Some links don't appear to be valid Google Maps links");
      return;
    }

    if (!criteria.trim()) {
      toast.error("Please describe what you care about in reviews");
      return;
    }

    setIsAnalyzing(true);
    setLoadingMessage("Fetching reviews from Google Maps...");

    try {
      const functions = getFunctions();

      // Step 1: Fetch reviews
      const fetchReviews = httpsCallable(functions, "fetchReviews");
      setLoadingMessage("Fetching reviews from Google Maps...");

      const reviewsResult = await fetchReviews({ urls: validLinks });
      const reviewsData = reviewsResult.data as any;

      if (!reviewsData.reviews || reviewsData.reviews.length === 0) {
        toast.error("Could not fetch reviews. Please check your links and try again.");
        setIsAnalyzing(false);
        return;
      }

      // Step 2: Analyze reviews
      const totalReviews = reviewsData.reviews.reduce((sum: number, p: any) => sum + p.reviews.length, 0);
      setLoadingMessage(`AI is analyzing ${totalReviews} reviews across ${reviewsData.reviews.length} locations...`);
      const analyzeReviews = httpsCallable(functions, "analyzeReviews");

      const analysisResult = await analyzeReviews({
        reviews: reviewsData.reviews,
        criteria: criteria.trim(),
        redFlags: redFlags.trim(),
      });

      const analysis = analysisResult.data as AnalysisResult;

      if (!analysis.locations || analysis.locations.length === 0) {
        toast.error("Could not analyze reviews. Please try again.");
        setIsAnalyzing(false);
        return;
      }

      // Navigate to results with data
      navigate("/results", { state: { analysis, criteria, redFlags } });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setLoadingMessage("");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Analyze Reviews</h1>
            <p className="text-muted-foreground">
              Add Google Maps links and tell us what you're looking for
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Google Maps Links
              </CardTitle>
              <CardDescription>
                Add up to 5 places you want to compare ({links.length}/5)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://maps.google.com/..."
                    value={link}
                    onChange={(e) => updateLink(index, e.target.value)}
                    disabled={isAnalyzing}
                    className={link && !isValidGoogleMapsLink(link) ? "border-destructive" : ""}
                  />
                  {links.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                      disabled={isAnalyzing}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              {links.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Link
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                What Are These Places?
              </CardTitle>
              <CardDescription>
                Tell us the type of locations and we'll suggest common aspects to look for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., restaurants, hotels, dental clinics, gyms..."
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  disabled={isAnalyzing || isGeneratingAspects}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleGenerateAspects();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleGenerateAspects}
                  disabled={isAnalyzing || isGeneratingAspects || !locationType.trim()}
                >
                  {isGeneratingAspects ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Suggest
                    </>
                  )}
                </Button>
              </div>

              {(suggestedPositive.length > 0 || suggestedNegative.length > 0) && (
                <div className="space-y-3 pt-2">
                  {suggestedPositive.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-green-600" />
                        Click to add to "Aspects you care about"
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedPositive.map((aspect, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="cursor-pointer bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20"
                            onClick={() => addToCriteria(aspect)}
                          >
                            + {aspect}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestedNegative.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3 text-red-600" />
                        Click to add to "Deal-breakers"
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedNegative.map((aspect, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="cursor-pointer bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20"
                            onClick={() => addToRedFlags(aspect)}
                          >
                            + {aspect}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                What Do You Care About?
              </CardTitle>
              <CardDescription>
                Describe what matters most to you in the reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="criteria">Aspects you care about most *</Label>
                <Textarea
                  id="criteria"
                  placeholder="e.g., authentic food, good service, clean environment, reasonable prices..."
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  disabled={isAnalyzing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redFlags" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Deal-breakers to watch for (optional)
                </Label>
                <Textarea
                  id="redFlags"
                  placeholder="e.g., food poisoning, rude staff, long wait times, hidden fees..."
                  value={redFlags}
                  onChange={(e) => setRedFlags(e.target.value)}
                  disabled={isAnalyzing}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Analyze Reviews
              </>
            )}
          </Button>

          {isAnalyzing && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              This may take a minute. We're fetching and analyzing reviews from all your links.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analyze;
