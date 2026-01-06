import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IdeaMockup from "@/components/idea-detail/IdeaMockup";
import ValidationFunnel from "@/components/idea-detail/ValidationFunnel";
import CommentsSection from "@/components/idea-detail/CommentsSection";
import AIValidationReport from "@/components/idea-detail/AIValidationReport";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface IdeaWithProfile {
  id: string;
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  target_audience: string;
  key_features: string[];
  want_to_use_count: number;
  willing_to_pay_count: number;
  waitlist_count: number;
  comments_count: number;
  views_count: number;
  user_id: string;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

const IdeaDetail = () => {
  const { id } = useParams();
  const [idea, setIdea] = useState<IdeaWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchIdea = async () => {
      if (!id) return;

      // Fetch the idea
      const { data: ideaData, error: ideaError } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();

      if (ideaError || !ideaData) {
        setError(true);
        setLoading(false);
        return;
      }

      // Fetch the profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", ideaData.user_id)
        .single();

      setIdea({
        ...ideaData,
        profiles: profileData || null,
      } as IdeaWithProfile);
      setLoading(false);
    };

    fetchIdea();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-2xl font-display font-bold mb-4">Idea not found</h1>
            <p className="text-muted-foreground mb-6">
              This idea may have been removed or doesn't exist.
            </p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const authorName = idea.profiles?.display_name || "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const createdAt = new Date(idea.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Back Navigation */}
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Ideas
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <IdeaMockup
                title={idea.title}
                description={idea.tagline}
                author={authorName}
                authorInitial={authorInitial}
                category="Product Idea"
                createdAt={createdAt}
                mockupGradient="bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30"
              />

              <CommentsSection ideaId={idea.id} ideaOwnerId={idea.user_id} />
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              <ValidationFunnel
                ideaId={idea.id}
                wantToUse={idea.want_to_use_count}
                willingToPay={idea.willing_to_pay_count}
                waitlist={idea.waitlist_count}
                views={idea.views_count}
              />

              <AIValidationReport ideaTitle={idea.title} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default IdeaDetail;
