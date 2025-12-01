import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitCompare,
  AlertCircle,
  Search,
  Zap,
  Check,
  FileText,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";

interface HealthMetric {
  label: string;
  count: number;
  icon: React.ReactNode;
}

const healthMetrics: HealthMetric[] = [
  { label: "Missing ISWC", count: 24, icon: <AlertCircle className="w-5 h-5" /> },
  { label: "Missing ISRC", count: 18, icon: <AlertCircle className="w-5 h-5" /> },
  { label: "Title mismatches", count: 12, icon: <FileText className="w-5 h-5" /> },
  { label: "Duplicate works", count: 8, icon: <AlertCircle className="w-5 h-5" /> },
  { label: "Split conflicts", count: 5, icon: <AlertCircle className="w-5 h-5" /> },
  {
    label: "Low-confidence matches",
    count: 31,
    icon: <AlertCircle className="w-5 h-5" />,
  },
];

const matchingOperations = [
  {
    id: "1",
    name: "Automatic MLC metadata matching",
    description: "Match tracks against MLC database for licensing",
    icon: Zap,
  },
  {
    id: "2",
    name: "Duplicate detection",
    description: "Find and flag duplicate works in your catalog",
    icon: GitCompare,
  },
  {
    id: "3",
    name: "ISWC lookup",
    description: "Look up ISWC codes for your compositions",
    icon: Search,
  },
  {
    id: "4",
    name: "Title similarity matching",
    description: "Find similar titles that may be the same work",
    icon: FileText,
  },
];

export default function MetadataMatching() {
  const [activeTab, setActiveTab] = useState("health");

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-metadata-matching">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-metadata-title">
            Metadata & Matching
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and fix metadata issues across your catalog
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border" data-testid="tabs-metadata">
            <TabsTrigger value="health" data-testid="tab-metadata-health">
              Metadata Health
            </TabsTrigger>
            <TabsTrigger value="matching" data-testid="tab-metadata-matching">
              Metadata Matching
            </TabsTrigger>
          </TabsList>

          {/* Metadata Health Tab */}
          <TabsContent value="health" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthMetrics.map((metric, index) => (
                <Card
                  key={index}
                  className="bg-card border-border hover:border-destructive/30 transition-colors"
                  data-testid={`card-health-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {metric.label}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {metric.count}
                        </p>
                      </div>
                      <div className="text-destructive/60">
                        {metric.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Health Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Catalog Completeness</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "78%" }}></div>
                      </div>
                      <span className="text-foreground font-medium">78%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Match Confidence (Average)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "85%" }}></div>
                      </div>
                      <span className="text-foreground font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Duplicate Detection Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "92%" }}></div>
                      </div>
                      <span className="text-foreground font-medium">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata Matching Tab */}
          <TabsContent value="matching" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {matchingOperations.map((operation) => {
                const Icon = operation.icon;
                return (
                  <Card
                    key={operation.id}
                    className="bg-card border-border hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5"
                    data-testid={`card-operation-${operation.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold text-foreground">
                              {operation.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {operation.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        data-testid={`button-run-${operation.id}`}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Run Operation
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Fix mismatches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Review & Approve Matches</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        After running matching operations, review suggested matches and approve
                        corrections to your metadata.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <GitCompare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Resolve Conflicts</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Address duplicate works and split conflicts by merging or separating
                        metadata records as needed.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4" data-testid="button-review-matches">
                  Review & Fix Matches
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
