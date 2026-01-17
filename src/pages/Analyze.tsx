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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X, Search, Loader2, MapPin, AlertTriangle, Sparkles, ThumbsUp, ThumbsDown, Building2, FileText, HelpCircle, ExternalLink, Navigation, Check } from "lucide-react";
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

interface ResolvedLocation {
  name: string;
  address: string;
  confidence_score: number;
  mapsUrl: string;
}

const Analyze = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [links, setLinks] = useState<string[]>([""]);
  const [title, setTitle] = useState("");
  const [locationType, setLocationType] = useState("");
  const [criteria, setCriteria] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isGeneratingAspects, setIsGeneratingAspects] = useState(false);
  const [suggestedPositive, setSuggestedPositive] = useState<string[]>([]);
  const [suggestedNegative, setSuggestedNegative] = useState<string[]>([]);
  const [selectedPositive, setSelectedPositive] = useState<string[]>([]);
  const [selectedNegative, setSelectedNegative] = useState<string[]>([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [isResolvingLocations, setIsResolvingLocations] = useState(false);
  const [resolvedLocations, setResolvedLocations] = useState<ResolvedLocation[]>([]);

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
    } else {
      // If it's the only link, just clear it
      setLinks([""]);
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
    if (selectedPositive.includes(aspect)) {
      return; // Already included
    }
    setSelectedPositive([...selectedPositive, aspect]);
    // Remove from suggested list
    setSuggestedPositive(suggestedPositive.filter((a) => a !== aspect));
  };

  const removeFromCriteria = (aspect: string) => {
    setSelectedPositive(selectedPositive.filter((a) => a !== aspect));
    // Add back to suggested list
    setSuggestedPositive([...suggestedPositive, aspect]);
  };

  const addToRedFlags = (aspect: string) => {
    if (selectedNegative.includes(aspect)) {
      return; // Already included
    }
    setSelectedNegative([...selectedNegative, aspect]);
    // Remove from suggested list
    setSuggestedNegative(suggestedNegative.filter((a) => a !== aspect));
  };

  const removeFromRedFlags = (aspect: string) => {
    setSelectedNegative(selectedNegative.filter((a) => a !== aspect));
    // Add back to suggested list
    setSuggestedNegative([...suggestedNegative, aspect]);
  };

  const handleResolveLocations = async () => {
    if (!locationQuery.trim()) {
      toast.error("Please describe the locations you're looking for");
      return;
    }

    setIsResolvingLocations(true);
    setResolvedLocations([]);
    try {
      const functions = getFunctions();
      const resolveLocations = httpsCallable(functions, "resolveLocations");
      const result = await resolveLocations({ query: locationQuery.trim() });
      const data = result.data as { query: string; locations: ResolvedLocation[] };
      setResolvedLocations(data.locations || []);
      if (data.locations.length === 0) {
        toast.info("No locations found. Try a more specific query.");
      }
    } catch (error: any) {
      console.error("Error resolving locations:", error);
      toast.error("Failed to find locations. Please try again.");
    } finally {
      setIsResolvingLocations(false);
    }
  };

  const isLocationAdded = (location: ResolvedLocation) => {
    return links.some((link) => link === location.mapsUrl);
  };

  const addResolvedLocationToLinks = (location: ResolvedLocation) => {
    // Check if already added
    if (isLocationAdded(location)) {
      return;
    }
    // Find the first empty slot or add a new one
    const emptyIndex = links.findIndex((link) => !link.trim());
    if (emptyIndex !== -1) {
      const newLinks = [...links];
      newLinks[emptyIndex] = location.mapsUrl;
      setLinks(newLinks);
    } else if (links.length < 5) {
      setLinks([...links, location.mapsUrl]);
    } else {
      toast.error("Maximum 5 links allowed. Remove one to add more.");
      return;
    }
    toast.success(`Added ${location.name}`);
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

    // Combine selected chips with textarea input
    const allCriteria = [...selectedPositive, criteria.trim()].filter(Boolean).join(", ");
    const allRedFlags = [...selectedNegative, redFlags.trim()].filter(Boolean).join(", ");

    if (!allCriteria) {
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
        criteria: allCriteria,
        redFlags: allRedFlags,
      });

      const analysis = analysisResult.data as AnalysisResult;

      if (!analysis.locations || analysis.locations.length === 0) {
        toast.error("Could not analyze reviews. Please try again.");
        setIsAnalyzing(false);
        return;
      }

      // Navigate to results with data
      navigate("/results", { state: { analysis, title: title.trim() || "Untitled Analysis", criteria: allCriteria, redFlags: allRedFlags } });
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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Analysis Title
              </CardTitle>
              <CardDescription>
                Give this analysis a name so you can find it later
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., Best Italian restaurants in SF, Dentists near downtown..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isAnalyzing}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Locations to Compare
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>Add up to 5 places using search or direct links ({links.filter(l => l.trim()).length}/5 added)</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-primary hover:underline text-xs flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      How to find links?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>How to Get Google Maps Links</DialogTitle>
                      <DialogDescription>
                        Follow these simple steps to copy a location link
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
                          <div>
                            <p className="font-medium">Search for a place</p>
                            <p className="text-sm text-muted-foreground">Open Google Maps and search for the business or location you want to analyze</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
                          <div>
                            <p className="font-medium">Select the place</p>
                            <p className="text-sm text-muted-foreground">Click on the specific location from the search results to open its details panel</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
                          <div>
                            <p className="font-medium">Copy the link</p>
                            <p className="text-sm text-muted-foreground">Click the <strong>Share</strong> button, then click <strong>Copy link</strong>. You can also copy the URL directly from your browser's address bar.</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <p className="font-medium mb-1">Example links:</p>
                        <p className="text-muted-foreground text-xs break-all">https://maps.app.goo.gl/ABC123...</p>
                        <p className="text-muted-foreground text-xs break-all">https://www.google.com/maps/place/...</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Added Locations List */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Your locations
                </Label>
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://maps.app.goo.gl/..."
                      value={link}
                      onChange={(e) => updateLink(index, e.target.value)}
                      disabled={isAnalyzing}
                      className={link && !isValidGoogleMapsLink(link) ? "border-destructive" : ""}
                    />
                    {(links.length > 1 || link.trim()) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(index)}
                        disabled={isAnalyzing}
                        className="text-muted-foreground hover:text-destructive"
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
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground">or search to find locations</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {/* Search Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Find locations by description
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., best ramen in Sunnyvale, affordable apartments near Stanford..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    disabled={isAnalyzing || isResolvingLocations}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleResolveLocations();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleResolveLocations}
                    disabled={isAnalyzing || isResolvingLocations || !locationQuery.trim()}
                  >
                    {isResolvingLocations ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                {resolvedLocations.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Click + to add to your list above
                    </p>
                    <div className="space-y-2">
                      {resolvedLocations.map((location, i) => {
                        const added = isLocationAdded(location);
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              added ? "bg-green-500/10 border-green-500/30" : "bg-muted/30 hover:bg-muted/50"
                            }`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`flex-shrink-0 h-8 w-8 rounded-full ${
                                added
                                  ? "bg-green-500/20 text-green-600 cursor-default"
                                  : "bg-primary/10 hover:bg-primary/20 text-primary"
                              }`}
                              onClick={() => !added && addResolvedLocationToLinks(location)}
                              disabled={added || (links.length >= 5 && !links.some((l) => !l.trim()))}
                            >
                              {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{location.name}</span>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {Math.round(location.confidence_score * 100)}% match
                                </Badge>
                                {added && (
                                  <Badge variant="outline" className="text-xs flex-shrink-0 bg-green-500/10 text-green-600 border-green-500/30">
                                    Added
                                  </Badge>
                                )}
                              </div>
                              <a
                                href={location.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                              >
                                {location.address}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
                {selectedPositive.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedPositive.map((aspect, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20 pr-1"
                        onClick={() => removeFromCriteria(aspect)}
                      >
                        {aspect}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                <Textarea
                  id="criteria"
                  placeholder={selectedPositive.length > 0 ? "Add more criteria..." : "e.g., authentic food, good service, clean environment, reasonable prices..."}
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  disabled={isAnalyzing}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redFlags" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Deal-breakers to watch for (optional)
                </Label>
                {selectedNegative.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedNegative.map((aspect, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20 pr-1"
                        onClick={() => removeFromRedFlags(aspect)}
                      >
                        {aspect}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                <Textarea
                  id="redFlags"
                  placeholder={selectedNegative.length > 0 ? "Add more deal-breakers..." : "e.g., food poisoning, rude staff, long wait times, hidden fees..."}
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
