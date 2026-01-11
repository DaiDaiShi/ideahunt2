import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getIdeas } from "@/integrations/firebase/ideaService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IdeaCard from "@/components/IdeaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lightbulb, TrendingUp, Clock, Eye, MessageCircle, Search, X } from "lucide-react";

type SortOption = "popular" | "recent" | "views" | "comments";

const Explore = () => {
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["all-ideas"],
    queryFn: async () => {
      return await getIdeas();
    },
  });

  // Sort ideas based on selected option
  const sortedIdeas = useMemo(() => {
    if (!ideas) return [];

    const sorted = [...ideas];
    switch (sortBy) {
      case "popular":
        sorted.sort(
          (a, b) =>
            b.want_to_use_count +
            b.willing_to_pay_count +
            b.waitlist_count -
            (a.want_to_use_count + a.willing_to_pay_count + a.waitlist_count)
        );
        break;
      case "recent":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "views":
        sorted.sort((a, b) => b.views_count - a.views_count);
        break;
      case "comments":
        sorted.sort((a, b) => b.comments_count - a.comments_count);
        break;
    }
    return sorted;
  }, [ideas, sortBy]);

  const sortOptions = [
    { value: "popular", label: "Most Popular", icon: TrendingUp },
    { value: "recent", label: "Most Recent", icon: Clock },
    { value: "views", label: "Most Viewed", icon: Eye },
    { value: "comments", label: "Most Discussed", icon: MessageCircle },
  ];

  // Filter ideas based on search query
  const filteredIdeas = useMemo(() => {
    if (!sortedIdeas) return [];
    if (!searchQuery.trim()) return sortedIdeas;

    const query = searchQuery.toLowerCase();
    return sortedIdeas.filter(
      (idea) =>
        idea.title.toLowerCase().includes(query) ||
        idea.tagline.toLowerCase().includes(query) ||
        idea.problem.toLowerCase().includes(query)
    );
  }, [sortedIdeas, searchQuery]);

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

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sorting */}
            <div className="flex flex-col sm:flex-row gap-4">
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
          </div>

          {/* Ideas Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="text-center py-20">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? "No matching ideas" : "No ideas yet"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Be the first to submit an idea for validation!"}
              </p>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Button variant="hero" asChild>
                  <a href="/submit">Submit Your Idea</a>
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? "s" : ""} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((idea) => (
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
                    images={idea.images}
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
