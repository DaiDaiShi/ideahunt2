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
import { Plus, X, Search, Loader2, MapPin, AlertTriangle } from "lucide-react";
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
  }>;
}

const Analyze = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [links, setLinks] = useState<string[]>([""]);
  const [criteria, setCriteria] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const addLink = () => {
    if (links.length < 10) {
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
                Add up to 10 places you want to compare ({links.length}/10)
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

              {links.length < 10 && (
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
                <Search className="w-5 h-5" />
                What Do You Care About?
              </CardTitle>
              <CardDescription>
                Describe what matters most to you in the reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="criteria">Things you want to know about *</Label>
                <Textarea
                  id="criteria"
                  placeholder="e.g., authentic Chinese food, good portion sizes, friendly service, clean environment, reasonable prices..."
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  disabled={isAnalyzing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redFlags" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Red flags to avoid (optional)
                </Label>
                <Textarea
                  id="redFlags"
                  placeholder="e.g., food poisoning, rude staff, long wait times, dirty bathrooms, hidden fees..."
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
