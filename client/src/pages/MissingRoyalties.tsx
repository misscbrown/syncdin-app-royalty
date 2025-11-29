import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, DollarSign, Search } from "lucide-react";
import MetricCard from "@/components/MetricCard";

const mockMissingRoyalties = [
  { id: 1, track: "Summer Nights", platform: "Spotify", estimatedAmount: "$120.00", period: "Oct 2024" },
  { id: 2, track: "Ocean Waves", platform: "Apple Music", estimatedAmount: "$85.00", period: "Oct 2024" },
  { id: 3, track: "City Lights", platform: "YouTube Music", estimatedAmount: "$45.00", period: "Sep 2024" },
];

export default function MissingRoyalties() {
  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-missing-royalties">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-missing-title">Missing Royalties</h1>
            <p className="text-muted-foreground mt-1">Identify and recover unreported royalty payments</p>
          </div>
          <Button data-testid="button-scan-missing">
            <Search className="w-4 h-4 mr-2" />
            Scan for Missing
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Total Missing" value="$250.00" isFlagged />
          <MetricCard title="Tracks Affected" value="3" />
          <MetricCard title="Recovery Rate" value="85%" trend="up" trendValue="+5%" />
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Identified Missing Royalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMissingRoyalties.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <h4 className="font-medium text-foreground">{item.track}</h4>
                    <p className="text-sm text-muted-foreground">{item.platform} - {item.period}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-semibold">{item.estimatedAmount}</span>
                    <Button size="sm" variant="outline" data-testid={`button-claim-${item.id}`}>
                      Claim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
