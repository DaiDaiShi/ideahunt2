import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IdeaMockup from "@/components/idea-detail/IdeaMockup";
import ValidationFunnel from "@/components/idea-detail/ValidationFunnel";
import CommentsSection from "@/components/idea-detail/CommentsSection";
import AIValidationReport from "@/components/idea-detail/AIValidationReport";

// Mock data for the idea
const mockIdea = {
  id: "1",
  title: "AI-Powered Recipe Generator Based on Fridge Contents",
  description: "Upload a photo of your fridge contents and get personalized recipe suggestions with nutritional info, cooking time estimates, and step-by-step instructions. Reduce food waste while discovering new meals you can make with what you already have. Perfect for busy professionals who want to eat healthier without the hassle of meal planning.",
  author: "Sarah Chen",
  authorInitial: "S",
  category: "AI / Food Tech",
  createdAt: "3 days ago",
  mockupGradient: "bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30",
  wantToUse: 1234,
  willingToPay: 456,
  waitlist: 289,
  comments: 47,
  views: 2847,
};

const IdeaDetail = () => {
  const { id } = useParams();

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
                title={mockIdea.title}
                description={mockIdea.description}
                author={mockIdea.author}
                authorInitial={mockIdea.authorInitial}
                category={mockIdea.category}
                createdAt={mockIdea.createdAt}
                mockupGradient={mockIdea.mockupGradient}
              />
              
              <CommentsSection />
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              <ValidationFunnel
                wantToUse={mockIdea.wantToUse}
                willingToPay={mockIdea.willingToPay}
                waitlist={mockIdea.waitlist}
                views={mockIdea.views}
              />
              
              <AIValidationReport ideaTitle={mockIdea.title} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default IdeaDetail;
