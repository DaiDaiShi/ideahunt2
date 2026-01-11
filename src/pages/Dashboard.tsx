import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIdeasByUser } from "@/integrations/firebase/ideaService";
import { getValidationsForUserIdeas } from "@/integrations/firebase/validationService";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Users, DollarSign, Clock, TrendingUp, Lightbulb } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format, subDays, parseISO } from "date-fns";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch user's ideas with all metrics
  const { data: ideas, isLoading: ideasLoading } = useQuery({
    queryKey: ["dashboard-ideas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await getIdeasByUser(user.id);
    },
    enabled: !!user,
  });

  // Fetch validations for trend data
  const { data: validations } = useQuery({
    queryKey: ["dashboard-validations", user?.id],
    queryFn: async () => {
      if (!user || !ideas?.length) return [];
      return await getValidationsForUserIdeas(user.id);
    },
    enabled: !!user && !!ideas?.length,
  });

  if (authLoading || ideasLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate totals
  const totalViews = ideas?.reduce((sum, idea) => sum + idea.views_count, 0) || 0;
  const totalWantToUse = ideas?.reduce((sum, idea) => sum + idea.want_to_use_count, 0) || 0;
  const totalWillingToPay = ideas?.reduce((sum, idea) => sum + idea.willing_to_pay_count, 0) || 0;
  const totalWaitlist = ideas?.reduce((sum, idea) => sum + idea.waitlist_count, 0) || 0;
  const totalValidations = totalWantToUse + totalWillingToPay + totalWaitlist;

  // Prepare validation trend data (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return format(date, "yyyy-MM-dd");
  });

  const validationTrendData = last30Days.map((date) => {
    const dayValidations =
      validations?.filter((v) => format(parseISO(v.created_at), "yyyy-MM-dd") === date) || [];
    return {
      date: format(parseISO(date), "MMM d"),
      wantToUse: dayValidations.filter((v) => v.signal_type === "want_to_use").length,
      willingToPay: dayValidations.filter((v) => v.signal_type === "willing_to_pay").length,
      waitlist: dayValidations.filter((v) => v.signal_type === "waitlist").length,
    };
  });

  // Prepare ideas performance data
  const ideasPerformanceData =
    ideas?.slice(0, 5).map((idea) => ({
      name: idea.title.length > 20 ? idea.title.substring(0, 20) + "..." : idea.title,
      validations: idea.want_to_use_count + idea.willing_to_pay_count + idea.waitlist_count,
      views: idea.views_count,
      comments: idea.comments_count,
    })) || [];

  // Validation breakdown for pie chart
  const validationBreakdown = [
    { name: "Want to Use", value: totalWantToUse, color: "hsl(var(--chart-1))" },
    { name: "Willing to Pay", value: totalWillingToPay, color: "hsl(var(--chart-2))" },
    { name: "Waitlist", value: totalWaitlist, color: "hsl(var(--chart-3))" },
  ].filter((item) => item.value > 0);

  const chartConfig = {
    wantToUse: { label: "Want to Use", color: "hsl(var(--chart-1))" },
    willingToPay: { label: "Willing to Pay", color: "hsl(var(--chart-2))" },
    waitlist: { label: "Waitlist", color: "hsl(var(--chart-3))" },
    validations: { label: "Validations", color: "hsl(var(--chart-1))" },
    views: { label: "Views", color: "hsl(var(--chart-4))" },
    comments: { label: "Comments", color: "hsl(var(--chart-5))" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track the performance of your ideas</p>
          </div>

          {!ideas || ideas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Lightbulb className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Ideas Yet</h2>
                <p className="text-muted-foreground text-center mb-4">
                  Submit your first idea to start tracking analytics
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-xs">Ideas</span>
                    </div>
                    <p className="text-2xl font-bold">{ideas.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">Total Views</span>
                    </div>
                    <p className="text-2xl font-bold">{totalViews}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">Validations</span>
                    </div>
                    <p className="text-2xl font-bold">{totalValidations}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Want to Use</span>
                    </div>
                    <p className="text-2xl font-bold">{totalWantToUse}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs">Willing to Pay</span>
                    </div>
                    <p className="text-2xl font-bold">{totalWillingToPay}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Waitlist</span>
                    </div>
                    <p className="text-2xl font-bold">{totalWaitlist}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Validation Trends */}
                <Card className="col-span-full lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Validation Trends</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <AreaChart data={validationTrendData}>
                        <defs>
                          <linearGradient id="wantToUseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="wantToUse"
                          name="Want to Use"
                          stroke="hsl(var(--chart-1))"
                          fill="url(#wantToUseGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Validation Breakdown Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Validation Breakdown</CardTitle>
                    <CardDescription>By signal type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {validationBreakdown.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No validations yet
                      </div>
                    ) : (
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <PieChart>
                          <Pie
                            data={validationBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {validationBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ideas Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Ideas Performance</CardTitle>
                  <CardDescription>Comparing your top 5 ideas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={ideasPerformanceData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="validations" name="Validations" fill="hsl(var(--chart-1))" radius={4} />
                      <Bar dataKey="views" name="Views" fill="hsl(var(--chart-4))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Ideas Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Ideas Overview</CardTitle>
                  <CardDescription>Detailed metrics for each idea</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Idea</th>
                          <th className="text-center py-3 px-2 font-medium">Views</th>
                          <th className="text-center py-3 px-2 font-medium">Want to Use</th>
                          <th className="text-center py-3 px-2 font-medium">Willing to Pay</th>
                          <th className="text-center py-3 px-2 font-medium">Waitlist</th>
                          <th className="text-center py-3 px-2 font-medium">Comments</th>
                          <th className="text-center py-3 px-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ideas.map((idea) => (
                          <tr
                            key={idea.id}
                            className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                            onClick={() => navigate(`/idea/${idea.id}`)}
                          >
                            <td className="py-3 px-2">
                              <div className="font-medium truncate max-w-[200px]">{idea.title}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {idea.tagline}
                              </div>
                            </td>
                            <td className="text-center py-3 px-2">{idea.views_count}</td>
                            <td className="text-center py-3 px-2">{idea.want_to_use_count}</td>
                            <td className="text-center py-3 px-2">{idea.willing_to_pay_count}</td>
                            <td className="text-center py-3 px-2">{idea.waitlist_count}</td>
                            <td className="text-center py-3 px-2">{idea.comments_count}</td>
                            <td className="text-center py-3 px-2">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  idea.status === "published"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {idea.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
