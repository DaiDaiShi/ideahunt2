import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IdeaForm from "@/components/submit/IdeaForm";
import MockupPreview from "@/components/submit/MockupPreview";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createIdea } from "@/integrations/firebase/ideaService";

import type { IdeaFormData } from "@/components/submit/IdeaForm";

const SubmitIdea = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState<IdeaFormData | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit your idea.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, loading, navigate, toast]);

  const handleGenerateMockup = async (data: IdeaFormData) => {
    setIsGenerating(true);
    setFormData(data);

    // Simulate AI mockup generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsGenerating(false);
    setShowPreview(true);

    toast({
      title: "Mockup Generated!",
      description: "Your AI-generated mockup is ready for review.",
    });
  };

  const handleRegenerate = async () => {
    if (!formData) return;
    setIsGenerating(true);

    // Simulate regeneration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsGenerating(false);
    toast({
      title: "Mockup Regenerated!",
      description: "A fresh mockup has been created.",
    });
  };

  const handlePublish = async () => {
    if (!formData || !user) return;

    setIsPublishing(true);

    try {
      const features = formData.keyFeatures
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const idea = await createIdea({
        user_id: user.id,
        title: formData.title,
        tagline: formData.tagline,
        problem: formData.problem,
        solution: formData.solution,
        target_audience: formData.targetAudience,
        key_features: features,
        images: formData.images,
      });

      toast({
        title: "Idea Published!",
        description: "Your idea is now live and ready for validation.",
      });

      // Navigate to the idea detail page
      navigate(`/idea/${idea.id}`);
    } catch (error: any) {
      console.error("Publish error:", error);
      toast({
        title: "Failed to publish",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const parseFeatures = (featuresText: string): string[] => {
    return featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (showPreview ? setShowPreview(false) : navigate(-1))}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {showPreview ? "Back to Form" : "Back"}
          </Button>

          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {showPreview ? "Review Your Idea" : "Submit Your Idea"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {showPreview
                ? "Preview how your idea will look to the community"
                : "Turn your product idea into a validated concept"}
            </p>
          </div>

          {/* Form or Preview */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
            {showPreview && formData ? (
              <MockupPreview
                title={formData.title}
                tagline={formData.tagline}
                features={parseFeatures(formData.keyFeatures)}
                images={formData.images}
                onRegenerate={handleRegenerate}
                onPublish={handlePublish}
                isRegenerating={isGenerating}
                isPublishing={isPublishing}
              />
            ) : (
              <IdeaForm
                onSubmit={() => {}}
                onGenerateMockup={handleGenerateMockup}
                isGenerating={isGenerating}
                userId={user.id}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubmitIdea;
