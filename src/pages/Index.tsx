import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import FeaturedIdeas from "@/components/FeaturedIdeas";
import ValidationMetrics from "@/components/ValidationMetrics";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedIdeas />
        <ValidationMetrics />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
