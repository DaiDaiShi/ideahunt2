import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, DollarSign, Bell, TrendingUp } from "lucide-react";
import { useValidationSignals } from "@/hooks/useValidationSignals";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ValidationFunnelProps {
  ideaId: string;
  wantToUse: number;
  willingToPay: number;
  waitlist: number;
  views: number;
}

const ValidationFunnel = ({
  ideaId,
  wantToUse,
  willingToPay,
  waitlist,
  views,
}: ValidationFunnelProps) => {
  const navigate = useNavigate();
  const { hasVoted, toggleValidation, isPending, isAuthenticated } =
    useValidationSignals(ideaId);

  const handleSignalClick = (
    signalType: "want_to_use" | "willing_to_pay" | "waitlist"
  ) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    toggleValidation(signalType);
  };

  const safeViews = views || 1; // Prevent division by zero
  const safeWantToUse = wantToUse || 1;

  const funnelSteps = [
    {
      label: "Views",
      value: views,
      percentage: 100,
      icon: TrendingUp,
      color: "bg-muted",
      signalType: null,
    },
    {
      label: "Want to Use",
      value: wantToUse,
      percentage: Math.round((wantToUse / safeViews) * 100),
      icon: Heart,
      color: "bg-signal-want",
      signalType: "want_to_use" as const,
      activeColor: "text-signal-want",
    },
    {
      label: "Willing to Pay",
      value: willingToPay,
      percentage: Math.round((willingToPay / safeViews) * 100),
      icon: DollarSign,
      color: "bg-signal-pay",
      signalType: "willing_to_pay" as const,
      activeColor: "text-signal-pay",
    },
    {
      label: "Joined Waitlist",
      value: waitlist,
      percentage: Math.round((waitlist / safeViews) * 100),
      icon: Bell,
      color: "bg-signal-waitlist",
      signalType: "waitlist" as const,
      activeColor: "text-signal-waitlist",
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-display text-xl">Validation Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnelSteps.map((step, index) => {
          const isClickable = step.signalType !== null;
          const isActive = step.signalType && hasVoted(step.signalType);

          return (
            <div key={step.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <step.icon
                    className={cn(
                      "w-4 h-4",
                      index === 0
                        ? "text-muted-foreground"
                        : step.activeColor,
                      isActive && "fill-current"
                    )}
                  />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isClickable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-auto py-1 px-2 gap-1",
                        isActive && `${step.activeColor} bg-${step.color}/10`
                      )}
                      onClick={() => handleSignalClick(step.signalType!)}
                      disabled={isPending}
                    >
                      <span className="text-sm font-bold">
                        {step.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({step.percentage}%)
                      </span>
                      {isActive && (
                        <span className="text-xs ml-1">✓</span>
                      )}
                    </Button>
                  ) : (
                    <>
                      <span className="text-sm font-bold">
                        {step.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({step.percentage}%)
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded-full transition-all duration-500`}
                  style={{ width: `${step.percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Conversion Insights */}
        <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
          <h4 className="text-sm font-semibold">Key Insights</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Interest Rate</p>
              <p className="text-lg font-bold text-signal-want">
                {Math.round((wantToUse / safeViews) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Paying Intent</p>
              <p className="text-lg font-bold text-signal-pay">
                {Math.round((willingToPay / safeWantToUse) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Waitlist Rate</p>
              <p className="text-lg font-bold text-signal-waitlist">
                {Math.round((waitlist / safeWantToUse) * 100)}%
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
