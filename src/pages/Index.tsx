import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Search, Star, Zap, Shield, ArrowRight } from "lucide-react";

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
            Smart Review Analysis
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Find Reviews That
            <span className="text-primary"> Actually Matter</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Paste Google Maps links, tell us what you care about, and our AI will find the most relevant reviews for you. No more scrolling through hundreds of reviews.
          </p>

          <Button variant="hero" size="lg" asChild>
            <Link to="/auth">
              Get Started
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
              <h3 className="font-semibold text-lg mb-2">Paste Links</h3>
              <p className="text-muted-foreground">
                Add up to 10 Google Maps links for restaurants, hotels, or any business you want to research.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Tell Us What Matters</h3>
              <p className="text-muted-foreground">
                Describe what you care about - "authentic food", "clean rooms", "friendly staff" - and any red flags to avoid.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Get AI Summary</h3>
              <p className="text-muted-foreground">
                Our AI reads all reviews and gives you a summary with the most relevant reviews highlighted.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 md:px-6 max-w-4xl py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border bg-card">
              <Star className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Relevant Reviews Only</h3>
              <p className="text-sm text-muted-foreground">
                Skip the noise. See only reviews that mention what you actually care about.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <Zap className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">AI-Powered Summary</h3>
              <p className="text-sm text-muted-foreground">
                Get an instant summary that answers your specific questions.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <Shield className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Spot Red Flags</h3>
              <p className="text-sm text-muted-foreground">
                Tell us what to avoid and we'll highlight warning signs from real customers.
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
