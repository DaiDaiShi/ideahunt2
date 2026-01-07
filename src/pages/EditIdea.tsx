import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EditIdea = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");

  // Fetch existing idea
  const { data: idea, isLoading: ideaLoading } = useQuery({
    queryKey: ["idea", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Populate form when idea loads
  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setTagline(idea.tagline);
      setProblem(idea.problem);
      setSolution(idea.solution);
      setTargetAudience(idea.target_audience);
      setKeyFeatures(idea.key_features.join("\n"));
    }
  }, [idea]);

  // Redirect if not authenticated or not the owner
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if (idea && user && idea.user_id !== user.id) {
      toast.error("You can only edit your own ideas");
      navigate("/profile");
    }
  }, [user, authLoading, idea, navigate]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user) throw new Error("Not authenticated");

      const features = keyFeatures
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const { error } = await supabase
        .from("ideas")
        .update({
          title,
          tagline,
          problem,
          solution,
          target_audience: targetAudience,
          key_features: features,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea", id] });
      queryClient.invalidateQueries({ queryKey: ["user-ideas"] });
      toast.success("Idea updated successfully!");
      navigate(`/idea/${id}`);
    },
    onError: (error) => {
      toast.error(`Failed to update idea: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tagline.trim() || !problem.trim() || !solution.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateMutation.mutate();
  };

  if (authLoading || ideaLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center">
            <h1 className="text-2xl font-bold mb-4">Idea not found</h1>
            <Button onClick={() => navigate("/profile")}>Back to Profile</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Edit Your Idea
            </h1>
            <p className="text-lg text-muted-foreground">
              Update your idea details
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Your idea title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline *</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A short, catchy description"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Problem *</Label>
                <Textarea
                  id="problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="What problem does this solve?"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution">Solution *</Label>
                <Textarea
                  id="solution"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="How does your idea solve this problem?"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Who is this for?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyFeatures">Key Features (one per line)</Label>
                <Textarea
                  id="keyFeatures"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditIdea;
