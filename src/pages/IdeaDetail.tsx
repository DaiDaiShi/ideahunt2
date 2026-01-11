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
import { getIdeaById, Idea } from "@/integrations/firebase/ideaService";
import { getUserProfile } from "@/integrations/firebase/userService";

interface IdeaWithProfile extends Idea {
  profiles: {
    display_name: string | null;
    user_name: string | null;
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

      try {
        const ideaData = await getIdeaById(id);

        if (!ideaData) {
          setError(true);
          setLoading(false);
          return;
        }

        // Fetch the profile separately
        const profileData = await getUserProfile(ideaData.user_id);

        setIdea({
          ...ideaData,
          profiles: profileData
            ? {
                display_name: profileData.display_name,
                user_name: profileData.user_name,
              }
            : null,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching idea:", err);
        setError(true);
        setLoading(false);
      }
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

  const authorName =
    idea.profiles?.display_name || idea.profiles?.user_name || "Anonymous";
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
                images={idea.images}
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
