import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IdeaCard from "@/components/IdeaCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lightbulb, TrendingUp, Clock, Eye, MessageCircle } from "lucide-react";

type SortOption = "popular" | "recent" | "views" | "comments";

const Explore = () => {
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["all-ideas", sortBy],
    queryFn: async () => {
      let query = supabase
        .from("ideas")
        .select("*")
        .eq("status", "published");

      switch (sortBy) {
        case "popular":
          // Sort by total validation signals
          query = query.order("want_to_use_count", { ascending: false })
            .order("willing_to_pay_count", { ascending: false })
            .order("waitlist_count", { ascending: false });
          break;
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "views":
          query = query.order("views_count", { ascending: false });
          break;
        case "comments":
          query = query.order("comments_count", { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const sortOptions = [
    { value: "popular", label: "Most Popular", icon: TrendingUp },
    { value: "recent", label: "Most Recent", icon: Clock },
    { value: "views", label: "Most Viewed", icon: Eye },
    { value: "comments", label: "Most Discussed", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Explore Ideas
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover and validate the next big thing
            </p>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick filter chips */}
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option.value as SortOption)}
                  className="hidden sm:flex"
                >
                  <option.icon className="w-4 h-4 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Ideas Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !ideas || ideas.length === 0 ? (
            <div className="text-center py-20">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-2">No ideas yet</h2>
              <p className="text-muted-foreground mb-4">
                Be the first to submit an idea for validation!
              </p>
              <Button variant="hero" asChild>
                <a href="/submit">Submit Your Idea</a>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {ideas.length} idea{ideas.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    id={idea.id}
                    title={idea.title}
                    description={idea.tagline}
                    author="Creator"
                    authorInitial={idea.title.charAt(0).toUpperCase()}
                    category={idea.target_audience.split(" ")[0]}
                    wantToUse={idea.want_to_use_count}
                    willingToPay={idea.willing_to_pay_count}
                    waitlist={idea.waitlist_count}
                    comments={idea.comments_count}
                    views={idea.views_count}
                    mockupGradient="bg-gradient-to-br from-primary/20 to-accent/20"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Explore;
