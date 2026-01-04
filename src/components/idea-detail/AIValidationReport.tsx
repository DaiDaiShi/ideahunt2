import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, Users, CheckCircle, XCircle, Download } from "lucide-react";

interface AIValidationReportProps {
  ideaTitle: string;
}

const AIValidationReport = ({ ideaTitle }: AIValidationReportProps) => {
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Validation Report
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Generated based on community signals and market analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Validation Score */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
          <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">78</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overall Validation Score</p>
            <p className="text-lg font-bold">Strong Market Interest</p>
            <Badge variant="secondary" className="mt-1">Top 15% of ideas</Badge>
          </div>
        </div>

        {/* Market Analysis */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Market Analysis
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Based on 2,847 views and 1,234 validation signals, this idea shows <strong className="text-foreground">strong product-market fit potential</strong> in the creator economy and startup validation space.
            </p>
            <p>
              The 43% interest-to-view conversion rate is <strong className="text-foreground">2.3x above average</strong>, indicating compelling problem-solution alignment.
            </p>
          </div>
        </div>

        {/* Strengths */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2 text-signal-want">
            <CheckCircle className="w-4 h-4" />
            Key Strengths
          </h4>
          <ul className="space-y-2">
            {[
              "High paying intent (28% of interested users willing to pay)",
              "Strong waitlist conversion indicates genuine demand",
              "Active community engagement with quality feedback",
              "Clear differentiation from existing solutions",
            ].map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-signal-want shrink-0 mt-0.5" />
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Areas of Concern */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Areas to Address
          </h4>
          <ul className="space-y-2">
            {[
              "Some concerns about data quality and spam prevention",
              "Pricing clarity needed - users unsure about value proposition",
              "Integration requirements with existing tools mentioned frequently",
            ].map((concern, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                {concern}
              </li>
            ))}
          </ul>
        </div>

        {/* Target Audience */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Identified Target Segments
          </h4>
          <div className="flex flex-wrap gap-2">
            {["Indie Hackers", "Solo Founders", "Product Managers", "Startup Studios", "Angel Investors"].map((segment) => (
              <Badge key={segment} variant="outline" className="text-xs">
                {segment}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3 p-4 bg-primary/5 rounded-xl">
          <h4 className="font-semibold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            AI Recommendations
          </h4>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Prioritize building the validation funnel and AI report features first</li>
            <li>Address spam concerns by implementing verification system early</li>
            <li>Consider a freemium model with premium AI insights</li>
            <li>Build integrations with Notion, Linear, and Slack as phase 2</li>
          </ol>
        </div>

        {/* Verdict */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-4 bg-signal-want/10 rounded-xl">
            <CheckCircle className="w-8 h-8 text-signal-want" />
            <div>
              <p className="font-bold text-signal-want">Recommended to Build</p>
              <p className="text-sm text-muted-foreground">
                Strong validation signals suggest this idea is worth pursuing with a focused MVP.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIValidationReport;
