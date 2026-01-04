import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";

interface IdeaFormData {
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  targetAudience: string;
  keyFeatures: string;
}

interface IdeaFormProps {
  onSubmit: (data: IdeaFormData) => void;
  onGenerateMockup: (data: IdeaFormData) => void;
  isGenerating: boolean;
}

const IdeaForm = ({ onSubmit, onGenerateMockup, isGenerating }: IdeaFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<IdeaFormData>({
    title: "",
    tagline: "",
    problem: "",
    solution: "",
    targetAudience: "",
    keyFeatures: "",
  });

  const updateField = (field: keyof IdeaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 = formData.title.trim() && formData.tagline.trim();
  const canProceedStep2 = formData.problem.trim() && formData.solution.trim();
  const canGenerateMockup = formData.targetAudience.trim() && formData.keyFeatures.trim();

  const handleGenerateMockup = () => {
    onGenerateMockup(formData);
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-1 mx-2 rounded-full transition-all ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-2">Name Your Idea</h2>
            <p className="text-muted-foreground">Start with a catchy title and tagline</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Idea Title *</Label>
              <Input
                id="title"
                placeholder="e.g., MealMentor - AI Meal Planning"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline *</Label>
              <Input
                id="tagline"
                placeholder="A short, compelling description (max 100 chars)"
                value={formData.tagline}
                onChange={(e) => updateField("tagline", e.target.value.slice(0, 100))}
                maxLength={100}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.tagline.length}/100
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="hero"
              size="lg"
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Problem & Solution */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-2">Problem & Solution</h2>
            <p className="text-muted-foreground">What problem are you solving and how?</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problem">The Problem *</Label>
              <Textarea
                id="problem"
                placeholder="Describe the problem your idea solves..."
                value={formData.problem}
                onChange={(e) => updateField("problem", e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Your Solution *</Label>
              <Textarea
                id="solution"
                placeholder="How does your idea solve this problem?"
                value={formData.solution}
                onChange={(e) => updateField("solution", e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="hero"
              size="lg"
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Target & Features */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-2">Target & Features</h2>
            <p className="text-muted-foreground">Who is this for and what can they do?</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Textarea
                id="targetAudience"
                placeholder="Describe your ideal users..."
                value={formData.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyFeatures">Key Features *</Label>
              <Textarea
                id="keyFeatures"
                placeholder="List the main features (one per line)..."
                value={formData.keyFeatures}
                onChange={(e) => updateField("keyFeatures", e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="lg" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="hero"
              size="lg"
              onClick={handleGenerateMockup}
              disabled={!canGenerateMockup || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Mockup
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaForm;
