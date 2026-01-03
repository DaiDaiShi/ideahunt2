import { Heart, DollarSign, Bell, TrendingUp, Users, Target } from "lucide-react";

const metrics = [
  {
    icon: Heart,
    label: "Want to Use",
    value: "48,234",
    description: "Users who expressed intent to use validated ideas",
    color: "text-signal-want",
    bgColor: "bg-signal-want/10",
  },
  {
    icon: DollarSign,
    label: "Willing to Pay",
    value: "12,891",
    description: "Strong purchase intent signals collected",
    color: "text-signal-pay",
    bgColor: "bg-signal-pay/10",
  },
  {
    icon: Bell,
    label: "Waitlist Signups",
    value: "23,456",
    description: "Users who joined waitlists for ideas",
    color: "text-signal-waitlist",
    bgColor: "bg-signal-waitlist/10",
  },
  {
    icon: Target,
    label: "Ideas Validated",
    value: "1,847",
    description: "Product concepts tested on the platform",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    label: "Success Rate",
    value: "34%",
    description: "Ideas that went on to launch successfully",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Users,
    label: "Active Validators",
    value: "8,923",
    description: "Community members providing feedback",
    color: "text-accent-foreground",
    bgColor: "bg-accent",
  },
];

const ValidationMetrics = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-subtle">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Real Signals, Real Validation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not vanity metrics—actionable intent data that tells you if people will actually use and pay for your product
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-gradient-card rounded-2xl p-6 border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${metric.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {metric.label}
                  </div>
                  <div className="font-display text-3xl font-bold mb-2">
                    {metric.value}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValidationMetrics;
