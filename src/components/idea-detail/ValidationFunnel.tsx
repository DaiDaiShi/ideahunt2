import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, DollarSign, Bell, TrendingUp } from "lucide-react";

interface ValidationFunnelProps {
  wantToUse: number;
  willingToPay: number;
  waitlist: number;
  views: number;
}

const ValidationFunnel = ({
  wantToUse,
  willingToPay,
  waitlist,
  views,
}: ValidationFunnelProps) => {
  const funnelSteps = [
    {
      label: "Views",
      value: views,
      percentage: 100,
      icon: TrendingUp,
      color: "bg-muted",
    },
    {
      label: "Want to Use",
      value: wantToUse,
      percentage: Math.round((wantToUse / views) * 100),
      icon: Heart,
      color: "bg-signal-want",
    },
    {
      label: "Willing to Pay",
      value: willingToPay,
      percentage: Math.round((willingToPay / views) * 100),
      icon: DollarSign,
      color: "bg-signal-pay",
    },
    {
      label: "Joined Waitlist",
      value: waitlist,
      percentage: Math.round((waitlist / views) * 100),
      icon: Bell,
      color: "bg-signal-waitlist",
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-display text-xl">Validation Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnelSteps.map((step, index) => (
          <div key={step.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <step.icon className={`w-4 h-4 ${index === 0 ? 'text-muted-foreground' : index === 1 ? 'text-signal-want' : index === 2 ? 'text-signal-pay' : 'text-signal-waitlist'}`} />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{step.value.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">({step.percentage}%)</span>
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${step.color} rounded-full transition-all duration-500`}
                style={{ width: `${step.percentage}%` }}
              />
            </div>
          </div>
        ))}

        {/* Conversion Insights */}
        <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
          <h4 className="text-sm font-semibold">Key Insights</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Interest Rate</p>
              <p className="text-lg font-bold text-signal-want">
                {Math.round((wantToUse / views) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Paying Intent</p>
              <p className="text-lg font-bold text-signal-pay">
                {Math.round((willingToPay / wantToUse) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Waitlist Rate</p>
              <p className="text-lg font-bold text-signal-waitlist">
                {Math.round((waitlist / wantToUse) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Signals</p>
              <p className="text-lg font-bold text-primary">
                {(wantToUse + willingToPay + waitlist).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationFunnel;
