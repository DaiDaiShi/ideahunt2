import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Search, Trophy, Zap, Share2, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/analyze");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-6 max-w-4xl text-center py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Search className="w-4 h-4" />
            AI-Powered Review Analysis
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Compare Places Based on
            <span className="text-primary"> What You Care About</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Paste Google Maps links, describe your preferences, and let AI analyze hundreds of reviews to rank locations by how well they match what matters to you.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-700 text-sm">
              <ThumbsUp className="w-3 h-3" /> great food
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-700 text-sm">
              <ThumbsUp className="w-3 h-3" /> friendly staff
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-700 text-sm">
              <ThumbsDown className="w-3 h-3" /> long wait
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-700 text-sm">
              <ThumbsUp className="w-3 h-3" /> clean
            </span>
          </div>

          <Button variant="hero" size="lg" asChild>
            <Link to="/auth">
              Start Analyzing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </section>

        {/* How it Works */}
        <section className="container mx-auto px-4 md:px-6 max-w-5xl py-16">
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Add Google Maps Links</h3>
              <p className="text-muted-foreground">
                Paste up to 10 Google Maps links for places you want to compare - restaurants, hotels, cafes, or any business.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Describe Your Priorities</h3>
              <p className="text-muted-foreground">
                Tell us what you care about and any red flags to avoid. Our AI will focus on reviews that mention these topics.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Ranked Results</h3>
              <p className="text-muted-foreground">
                See locations ranked by match score, with AI summaries, positive/negative tags, and the most relevant reviews.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 md:px-6 max-w-4xl py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border bg-card">
              <Trophy className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Smart Ranking</h3>
              <p className="text-sm text-muted-foreground">
                Locations ranked by match score based on your specific criteria, not just star ratings.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <Zap className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Instant Insights</h3>
              <p className="text-sm text-muted-foreground">
                AI-generated summaries and clickable tags that highlight what customers love or complain about.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <Share2 className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Share Results</h3>
              <p className="text-sm text-muted-foreground">
                Save your analyses and share them with friends to help them decide where to go.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
