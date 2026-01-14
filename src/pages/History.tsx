import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ArrowLeft, MapPin, Calendar } from "lucide-react";
import { getUserResults, UserResultRef } from "@/integrations/firebase/resultService";

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<UserResultRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadAnalyses = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const results = await getUserResults(user.id);
          setAnalyses(results);
        } catch (error) {
          console.error("Error loading analyses:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadAnalyses();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/analyze">
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Analysis
            </Link>
          </Button>

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold mb-1">My Analyses</h1>
            <p className="text-muted-foreground">
              {analyses.length} saved analysis{analyses.length !== 1 ? "es" : ""}
            </p>
          </div>

          {analyses.length > 0 ? (
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <Card
                  key={analysis.resultId}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/results/${analysis.resultId}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{analysis.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {analysis.locationCount} location{analysis.locationCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(analysis.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't created any analyses yet.
                </p>
                <Button variant="hero" asChild>
                  <Link to="/analyze">
                    <Search className="w-4 h-4 mr-2" />
                    Start Analyzing
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default History;
