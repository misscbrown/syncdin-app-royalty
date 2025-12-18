import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isFlagged?: boolean;
  cardColor?: string;
  textColor?: string;
  accentColor?: string;
  subtitle?: string;
}

const USAGE_SIGNAL_METRICS = ["YouTube Views"];
const USAGE_SIGNAL_TOOLTIP = "Usage signal only - reflects exposure, not royalty payout";

export default function MetricCard({
  title,
  value,
  trend,
  trendValue,
  isFlagged = false,
  cardColor = "bg-card",
  textColor = "text-foreground",
  accentColor = "text-primary",
  subtitle,
}: MetricCardProps) {
  const isUsageSignal = USAGE_SIGNAL_METRICS.includes(title);
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
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {isUsageSignal && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{USAGE_SIGNAL_TOOLTIP}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
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
