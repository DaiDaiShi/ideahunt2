import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, TrendingUp, Users, DollarSign, Clock, Crown, Medal } from "lucide-react";
import { Link } from "react-router-dom";

const Leaderboard = () => {
  // Fetch top ideas by total validations
  const { data: topIdeas, isLoading: ideasLoading } = useQuery({
    queryKey: ["leaderboard-ideas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("status", "published")
        .order("want_to_use_count", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Sort by total validations
      return (data || [])
        .map((idea) => ({
          ...idea,
          totalValidations: idea.want_to_use_count + idea.willing_to_pay_count + idea.waitlist_count,
        }))
        .sort((a, b) => b.totalValidations - a.totalValidations)
        .slice(0, 10);
    },
  });

  // Fetch top creators
  const { data: topCreators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["leaderboard-creators"],
    queryFn: async () => {
      // First get all published ideas with their user_ids
      const { data: ideas, error: ideasError } = await supabase
        .from("ideas")
        .select("user_id, want_to_use_count, willing_to_pay_count, waitlist_count, views_count")
        .eq("status", "published");

      if (ideasError) throw ideasError;

      // Aggregate by user
      const userStats: Record<string, { 
        userId: string; 
        totalValidations: number; 
        totalViews: number;
        ideaCount: number;
      }> = {};

      (ideas || []).forEach((idea) => {
        if (!userStats[idea.user_id]) {
          userStats[idea.user_id] = {
            userId: idea.user_id,
            totalValidations: 0,
            totalViews: 0,
            ideaCount: 0,
          };
        }
        userStats[idea.user_id].totalValidations += 
          idea.want_to_use_count + idea.willing_to_pay_count + idea.waitlist_count;
        userStats[idea.user_id].totalViews += idea.views_count;
        userStats[idea.user_id].ideaCount += 1;
      });

      // Get top 10 by validations
      const topUserIds = Object.values(userStats)
        .sort((a, b) => b.totalValidations - a.totalValidations)
        .slice(0, 10);

      if (topUserIds.length === 0) return [];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", topUserIds.map((u) => u.userId));

      if (profilesError) throw profilesError;

      // Combine data
      return topUserIds.map((stats) => {
        const profile = profiles?.find((p) => p.user_id === stats.userId);
        return {
          ...stats,
          displayName: profile?.display_name || "Anonymous",
          avatarUrl: profile?.avatar_url,
        };
      });
    },
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  const isLoading = ideasLoading || creatorsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">Top Ideas & Creators</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Discover the most validated ideas and the creators behind them
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="ideas" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="ideas" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top Ideas
                </TabsTrigger>
                <TabsTrigger value="creators" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Top Creators
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ideas">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Validated Ideas</CardTitle>
                    <CardDescription>Ideas with the highest validation signals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!topIdeas || topIdeas.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No ideas yet. Be the first to submit one!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {topIdeas.map((idea, index) => (
                          <Link
                            key={idea.id}
                            to={`/idea/${idea.id}`}
                            className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                          >
                            <div className="flex-shrink-0 w-8 flex items-center justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                {idea.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {idea.tagline}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1" title="Want to Use">
                                <Users className="w-4 h-4" />
                                <span>{idea.want_to_use_count}</span>
                              </div>
                              <div className="flex items-center gap-1" title="Willing to Pay">
                                <DollarSign className="w-4 h-4" />
                                <span>{idea.willing_to_pay_count}</span>
                              </div>
                              <div className="flex items-center gap-1" title="Waitlist">
                                <Clock className="w-4 h-4" />
                                <span>{idea.waitlist_count}</span>
                              </div>
                              <Badge variant="secondary" className="font-bold">
                                {idea.totalValidations} total
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="creators">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Creators</CardTitle>
                    <CardDescription>Creators with the most validated ideas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!topCreators || topCreators.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No creators yet. Submit an idea to get started!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {topCreators.map((creator, index) => (
                          <div
                            key={creator.userId}
                            className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                          >
                            <div className="flex-shrink-0 w-8 flex items-center justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={creator.avatarUrl || undefined} />
                              <AvatarFallback className="bg-gradient-hero text-primary-foreground">
                                {creator.displayName?.charAt(0)?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">
                                {creator.displayName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {creator.ideaCount} {creator.ideaCount === 1 ? "idea" : "ideas"} published
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-bold text-lg">{creator.totalValidations}</p>
                                <p className="text-xs text-muted-foreground">Validations</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-lg">{creator.totalViews}</p>
                                <p className="text-xs text-muted-foreground">Views</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
