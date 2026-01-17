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
import { Plus, X, Search, Loader2, MapPin, AlertTriangle, Sparkles, ThumbsUp, ThumbsDown, Building2, FileText, HelpCircle, ExternalLink, Navigation, Check, ChevronLeft, ChevronRight } from "lucide-react";
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

const STEPS = [
  { number: 1, title: "Add Locations", description: "Choose places to compare" },
  { number: 2, title: "Your Preferences", description: "Tell us what matters" },
  { number: 3, title: "Review & Analyze", description: "Name and submit" },
];

const Analyze = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
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

  // Validation helpers
  const getValidLinks = () => links.filter((link) => link.trim() !== "");

  const isValidGoogleMapsLink = (url: string): boolean => {
    if (!url.trim()) return false;
    return url.includes("google.com/maps") || url.includes("goo.gl/maps") || url.includes("maps.app.goo.gl");
  };

  const canProceedStep1 = () => {
    const validLinks = getValidLinks();
    return validLinks.length > 0 && validLinks.every(isValidGoogleMapsLink);
  };

  const canProceedStep2 = () => {
    const allCriteria = [...selectedPositive, criteria.trim()].filter(Boolean).join(", ");
    return allCriteria.length > 0;
  };

  // Navigation
  const goToNextStep = () => {
    if (currentStep === 1 && !canProceedStep1()) {
      toast.error("Please add at least one valid Google Maps link");
      return;
    }
    if (currentStep === 2 && !canProceedStep2()) {
      toast.error("Please tell us what you care about");
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Link management
  const addLink = () => {
    if (links.length < 5) {
      setLinks([...links, ""]);
    }
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    } else {
      setLinks([""]);
    }
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  // Aspect generation
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
    if (selectedPositive.includes(aspect)) return;
    setSelectedPositive([...selectedPositive, aspect]);
    setSuggestedPositive(suggestedPositive.filter((a) => a !== aspect));
  };

  const removeFromCriteria = (aspect: string) => {
    setSelectedPositive(selectedPositive.filter((a) => a !== aspect));
    setSuggestedPositive([...suggestedPositive, aspect]);
  };

  const addToRedFlags = (aspect: string) => {
    if (selectedNegative.includes(aspect)) return;
    setSelectedNegative([...selectedNegative, aspect]);
    setSuggestedNegative(suggestedNegative.filter((a) => a !== aspect));
  };

  const removeFromRedFlags = (aspect: string) => {
    setSelectedNegative(selectedNegative.filter((a) => a !== aspect));
    setSuggestedNegative([...suggestedNegative, aspect]);
  };

  // Location search
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
        toast.info("No locations found. Try a more specific query like 'ramen restaurants in Sunnyvale'.");
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
    if (isLocationAdded(location)) return;
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

  // Submit
  const handleAnalyze = async () => {
    const validLinks = getValidLinks();

    if (validLinks.length === 0) {
      toast.error("Please add at least one Google Maps link");
      setCurrentStep(1);
      return;
    }

    const allCriteria = [...selectedPositive, criteria.trim()].filter(Boolean).join(", ");
    const allRedFlags = [...selectedNegative, redFlags.trim()].filter(Boolean).join(", ");

    if (!allCriteria) {
      toast.error("Please describe what you care about in reviews");
      setCurrentStep(2);
      return;
    }

    setIsAnalyzing(true);
    setLoadingMessage("Fetching reviews from Google Maps...");

    try {
      const functions = getFunctions();

      const fetchReviews = httpsCallable(functions, "fetchReviews");
      const reviewsResult = await fetchReviews({ urls: validLinks });
      const reviewsData = reviewsResult.data as any;

      if (!reviewsData.reviews || reviewsData.reviews.length === 0) {
        toast.error("Could not fetch reviews. Please check your links and try again.");
        setIsAnalyzing(false);
        return;
      }

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
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        currentStep === step.number
                          ? "bg-primary text-primary-foreground"
                          : currentStep > step.number
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${currentStep === step.number ? "text-primary" : "text-muted-foreground"}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-full h-0.5 mx-2 ${currentStep > step.number ? "bg-green-500" : "bg-muted"}`} style={{ minWidth: "40px" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Add Locations */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Which places do you want to compare?
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Add up to 5 locations ({getValidLinks().length}/5 added)</span>
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
                              <p className="text-sm text-muted-foreground">Open Google Maps and search for the business</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
                            <div>
                              <p className="font-medium">Select the place</p>
                              <p className="text-sm text-muted-foreground">Click on it to open the details panel</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
                            <div>
                              <p className="font-medium">Copy the link</p>
                              <p className="text-sm text-muted-foreground">Click <strong>Share</strong> → <strong>Copy link</strong></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Paste Links */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Paste Google Maps links</Label>
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
                    <Button variant="outline" size="sm" onClick={addLink} disabled={isAnalyzing} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Link
                    </Button>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground">or search to find places</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                {/* Search */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Find places by description
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., ramen restaurants in Sunnyvale, apartments near Stanford..."
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
                      {isResolvingLocations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  {resolvedLocations.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-muted-foreground">Click + to add</p>
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
                                  added ? "bg-green-500/20 text-green-600" : "bg-primary/10 hover:bg-primary/20 text-primary"
                                }`}
                                onClick={() => !added && addResolvedLocationToLinks(location)}
                                disabled={added || (links.length >= 5 && !links.some((l) => !l.trim()))}
                              >
                                {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </Button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{location.name}</span>
                                  {added && (
                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
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
          )}

          {/* Step 2: Preferences */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    What type of places are these?
                  </CardTitle>
                  <CardDescription>
                    Tell us and we'll suggest common things to look for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., restaurants, apartments, dental clinics, gyms..."
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
                      {isGeneratingAspects ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </Button>
                  </div>

                  {(suggestedPositive.length > 0 || suggestedNegative.length > 0) && (
                    <div className="space-y-3 pt-2">
                      {suggestedPositive.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-green-600" />
                            Click to add as something you care about
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
                            Click to add as a deal-breaker
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    What do you care about most?
                  </CardTitle>
                  <CardDescription>
                    We'll highlight reviews that mention these aspects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPositive.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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
                    placeholder="e.g., authentic food, friendly staff, clean environment, good value..."
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                    disabled={isAnalyzing}
                    rows={2}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Any deal-breakers? (optional)
                  </CardTitle>
                  <CardDescription>
                    We'll warn you if reviews mention these issues
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedNegative.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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
                    placeholder="e.g., rude staff, long wait times, hidden fees, cleanliness issues..."
                    value={redFlags}
                    onChange={(e) => setRedFlags(e.target.value)}
                    disabled={isAnalyzing}
                    rows={2}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Name your analysis
                  </CardTitle>
                  <CardDescription>
                    Give it a name so you can find it later in your history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g., Best Italian restaurants in SF, Apartments near work..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Review your analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Locations to compare</Label>
                    <p className="font-medium">{getValidLinks().length} place{getValidLinks().length !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Looking for</Label>
                    <p className="font-medium">
                      {[...selectedPositive, criteria.trim()].filter(Boolean).join(", ") || "Not specified"}
                    </p>
                  </div>
                  {([...selectedNegative, redFlags.trim()].filter(Boolean).length > 0) && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Deal-breakers</Label>
                      <p className="font-medium text-red-600">
                        {[...selectedNegative, redFlags.trim()].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
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
                <p className="text-center text-sm text-muted-foreground">
                  This may take a minute. We're fetching and analyzing reviews from all your locations.
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 1 || isAnalyzing}
              className={currentStep === 1 ? "invisible" : ""}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {currentStep < 3 && (
              <Button onClick={goToNextStep} disabled={isAnalyzing}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analyze;
