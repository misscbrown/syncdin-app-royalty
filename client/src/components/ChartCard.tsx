import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  cardColor?: string;
  headerColor?: string;
  accentColor?: string;
  neonEffect?: boolean;
}

export default function ChartCard({
  title,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available",
  cardColor = "bg-card",
  headerColor = "text-foreground",
  neonEffect = true,
}: ChartCardProps) {
  return (
    <Card 
      className={`${cardColor} border-border transition-all duration-200`}
      data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className={`text-base font-semibold ${headerColor}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full bg-muted/50" />
          </div>
        ) : isEmpty ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className={`min-h-[200px] ${neonEffect ? 'chart-neon' : ''}`}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
