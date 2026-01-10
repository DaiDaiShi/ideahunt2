import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import IdeaCard from "./IdeaCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

const gradients = [
  "bg-gradient-to-br from-green-400/30 to-emerald-500/30",
  "bg-gradient-to-br from-blue-400/30 to-indigo-500/30",
  "bg-gradient-to-br from-amber-400/30 to-orange-500/30",
  "bg-gradient-to-br from-teal-400/30 to-cyan-500/30",
  "bg-gradient-to-br from-purple-400/30 to-violet-500/30",
  "bg-gradient-to-br from-rose-400/30 to-pink-500/30",
];

const FeaturedIdeas = () => {
  const { data: ideas, isLoading } = useQuery({
    queryKey: ["featured-ideas"],
    queryFn: async () => {
      const { data: ideasData, error: ideasError } = await supabase
        .from("ideas")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      if (ideasError) throw ideasError;
      if (!ideasData || ideasData.length === 0) return [];

      // Fetch profiles for all idea authors
      const userIds = [...new Set(ideasData.map((idea) => idea.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p.display_name]) || []
      );

      return ideasData.map((idea, index) => {
        const authorName = profileMap.get(idea.user_id) || "Anonymous";
        return {
          id: idea.id,
          title: idea.title,
          description: idea.tagline,
          author: authorName,
          authorInitial: authorName.charAt(0).toUpperCase(),
          category: idea.target_audience,
          wantToUse: idea.want_to_use_count,
          willingToPay: idea.willing_to_pay_count,
          waitlist: idea.waitlist_count,
          comments: idea.comments_count,
          views: idea.views_count,
          mockupGradient: gradients[index % gradients.length],
          images: idea.images,
        };
      });
    },
  });

  return (
    <section id="ideas" className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Trending Ideas
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Discover what the community is excited about and add your validation signals
            </p>
          </div>
          <Button variant="outline" className="self-start md:self-auto">
            View All Ideas
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : ideas && ideas.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} {...idea} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No ideas yet. Be the first to submit one!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedIdeas;
