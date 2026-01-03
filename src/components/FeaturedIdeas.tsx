import IdeaCard from "./IdeaCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ideas = [
  {
    title: "AI Recipe Generator for Dietary Restrictions",
    description: "An app that creates personalized meal plans and recipes based on allergies, preferences, and what's already in your fridge.",
    author: "Sarah Chen",
    authorInitial: "S",
    category: "Health & Food",
    wantToUse: 847,
    willingToPay: 234,
    waitlist: 156,
    comments: 42,
    views: 3200,
    mockupGradient: "bg-gradient-to-br from-green-400/30 to-emerald-500/30",
  },
  {
    title: "Remote Team Mood Tracker",
    description: "A lightweight daily check-in tool that helps remote managers understand team morale and spot burnout before it happens.",
    author: "Marcus Johnson",
    authorInitial: "M",
    category: "Productivity",
    wantToUse: 623,
    willingToPay: 189,
    waitlist: 312,
    comments: 67,
    views: 2800,
    mockupGradient: "bg-gradient-to-br from-blue-400/30 to-indigo-500/30",
  },
  {
    title: "Subscription Spending Analyzer",
    description: "Connect your bank account and get instant insights on recurring charges, with one-click cancellation for unused subscriptions.",
    author: "Emma Williams",
    authorInitial: "E",
    category: "FinTech",
    wantToUse: 1245,
    willingToPay: 456,
    waitlist: 523,
    comments: 89,
    views: 5600,
    mockupGradient: "bg-gradient-to-br from-amber-400/30 to-orange-500/30",
  },
  {
    title: "AI-Powered Plant Care Assistant",
    description: "Snap a photo of your plant to identify it, diagnose issues, and get personalized watering reminders based on your home's conditions.",
    author: "Alex Rivera",
    authorInitial: "A",
    category: "Lifestyle",
    wantToUse: 534,
    willingToPay: 98,
    waitlist: 267,
    comments: 31,
    views: 1900,
    mockupGradient: "bg-gradient-to-br from-teal-400/30 to-cyan-500/30",
  },
  {
    title: "Freelancer Invoice Automation",
    description: "Auto-generate professional invoices from your calendar events and time tracking, with built-in payment reminders.",
    author: "David Kim",
    authorInitial: "D",
    category: "Business",
    wantToUse: 892,
    willingToPay: 367,
    waitlist: 445,
    comments: 54,
    views: 4100,
    mockupGradient: "bg-gradient-to-br from-purple-400/30 to-violet-500/30",
  },
  {
    title: "Neighborhood Safety Alerts",
    description: "Community-driven safety notifications with verified reports, real-time crime mapping, and direct communication with local authorities.",
    author: "Lisa Park",
    authorInitial: "L",
    category: "Community",
    wantToUse: 756,
    willingToPay: 123,
    waitlist: 389,
    comments: 78,
    views: 3400,
    mockupGradient: "bg-gradient-to-br from-rose-400/30 to-pink-500/30",
  },
];

const FeaturedIdeas = () => {
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea, index) => (
            <IdeaCard key={index} {...idea} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedIdeas;
