import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IdeaForm from "@/components/submit/IdeaForm";
import MockupPreview from "@/components/submit/MockupPreview";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface IdeaFormData {
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  targetAudience: string;
  keyFeatures: string;
}

const SubmitIdea = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState<IdeaFormData | null>(null);

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
    setIsPublishing(true);

    // Simulate publishing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsPublishing(false);
    toast({
      title: "Idea Published! 🎉",
      description: "Your idea is now live and ready for validation.",
    });

    // Navigate to the idea detail page (using mock ID)
    navigate("/idea/new-idea");
  };

  const parseFeatures = (featuresText: string): string[] => {
    return featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  };

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
