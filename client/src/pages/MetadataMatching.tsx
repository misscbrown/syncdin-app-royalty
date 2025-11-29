import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, Check, X, AlertTriangle } from "lucide-react";

const mockMatches = [
  { id: 1, track: "Summer Nights", artist: "The Band", status: "matched", confidence: 98 },
  { id: 2, track: "Ocean Waves", artist: "Solo Artist", status: "pending", confidence: 75 },
  { id: 3, track: "City Lights", artist: "Duo Act", status: "unmatched", confidence: 0 },
  { id: 4, track: "Mountain High", artist: "The Band", status: "matched", confidence: 95 },
];

export default function MetadataMatching() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "matched":
        return <Check className="w-4 h-4 text-green-500" />;
      case "pending":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <X className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      matched: "bg-green-500/10 text-green-500",
      pending: "bg-yellow-500/10 text-yellow-500",
      unmatched: "bg-red-500/10 text-red-500",
    };
    return styles[status as keyof typeof styles] || styles.unmatched;
  };

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-metadata-matching">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-metadata-title">Metadata Matching</h1>
            <p className="text-muted-foreground mt-1">Match and reconcile track metadata across platforms</p>
          </div>
          <Button data-testid="button-run-matching">
            <GitCompare className="w-4 h-4 mr-2" />
            Run Matching
          </Button>
        </div>

        <div className="grid gap-4">
          {mockMatches.map((match) => (
            <Card key={match.id} className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      {getStatusIcon(match.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{match.track}</h3>
                      <p className="text-sm text-muted-foreground">{match.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {match.confidence > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="font-semibold text-foreground">{match.confidence}%</p>
                      </div>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusBadge(match.status)}`}>
                      {match.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
