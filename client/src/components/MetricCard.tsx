import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isFlagged?: boolean;
  cardColor?: string;
  textColor?: string;
  accentColor?: string;
}

export default function MetricCard({
  title,
  value,
  trend,
  trendValue,
  isFlagged = false,
  cardColor = "bg-card",
  textColor = "text-foreground",
  accentColor = "text-primary",
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    const iconClass = "w-4 h-4";
    switch (trend) {
      case "up":
        return <TrendingUp className={`${iconClass} text-primary`} />;
      case "down":
        return <TrendingDown className={`${iconClass} text-destructive`} />;
      default:
        return <Minus className={`${iconClass} text-muted-foreground`} />;
    }
  };

  return (
    <Card 
      className={`${cardColor} border-border transition-all duration-300 hover:bg-muted/30 hover:border-blue-subtle/30 ${
        isFlagged ? "bg-purple-accent border-purple-bold/40" : ""
      }`}
      data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {isFlagged && (
          <span className={`text-xs px-2 py-0.5 rounded-full bg-primary/20 ${accentColor} font-medium`}>
            Alert
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <p className={`text-2xl font-bold ${isFlagged ? accentColor : textColor}`} data-testid={`text-metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon()}
              <span className={trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
