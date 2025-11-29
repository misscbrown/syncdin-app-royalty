import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import { Link } from "wouter";
import { 
  getDashboardData, 
  type FormattedMetric, 
  type ChartData 
} from "../services/metricsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["hsl(217, 91%, 60%)", "hsl(173, 80%, 40%)", "hsl(43, 96%, 50%)", "hsl(27, 87%, 55%)"];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<FormattedMetric[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDashboardData();
        setMetrics(data.metrics);
        setCharts(data.charts);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border p-4" data-testid="sidebar">
        <h2 className="text-xl font-bold mb-6 text-foreground">Dashboard Menu</h2>
        <nav className="flex flex-col gap-3">
          <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="link-sidebar-dashboard">Dashboard</Link>
          <Link href="/upload-tracks" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sidebar-upload">Upload Tracks</Link>
          <Link href="/royalty-statements" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sidebar-royalty">Royalty Statements</Link>
          <Link href="/metadata-matching" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sidebar-metadata">Metadata Matching</Link>
          <Link href="/missing-royalties" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sidebar-missing">Missing Royalties</Link>
          <Link href="/playback-analytics" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sidebar-playback">Playback Analytics</Link>
          <Link href="/reports-exports" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sidebar-reports">Reports & Exports</Link>
          <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sidebar-settings">Settings</Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <Navigation />

        <main className="p-6 flex-1 overflow-y-auto">
          <h1 className="text-3xl font-semibold mb-6 text-foreground" data-testid="text-dashboard-title">Dashboard</h1>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6" data-testid="error-message">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} data-testid={`skeleton-metric-${i}`}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              metrics.map((metric) => (
                <Card key={metric.title} className="hover:shadow-md transition-shadow" data-testid={`card-metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-foreground" data-testid={`text-metric-value-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {metric.value}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="chart-playback-frequency">
              <CardHeader>
                <CardTitle>Playback Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : charts?.playbackFrequency && charts.playbackFrequency.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={charts.playbackFrequency}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar dataKey="streams" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No playback data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="chart-royalty-gap">
              <CardHeader>
                <CardTitle>Royalty Gap Estimation</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : charts?.royaltyGapEstimation && charts.royaltyGapEstimation.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={charts.royaltyGapEstimation}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="expected" stroke="hsl(173, 80%, 40%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="actual" stroke="hsl(27, 87%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No royalty gap data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2" data-testid="chart-metadata-stats">
              <CardHeader>
                <CardTitle>Missing Metadata Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : charts?.missingMetadataStats && charts.missingMetadataStats.length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={charts.missingMetadataStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="category"
                          label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {charts.missingMetadataStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No metadata statistics available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
