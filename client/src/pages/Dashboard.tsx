import { useEffect, useState } from "react";
import { 
  getDashboardData, 
  type FormattedMetric, 
  type ChartData 
} from "../services/metricsService";
import AppLayout from "@/components/AppLayout";
import MetricCard from "@/components/MetricCard";
import ChartCard from "@/components/ChartCard";
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

const CHART_COLORS = ["hsl(141, 76%, 48%)", "hsl(270, 85%, 60%)", "hsl(200, 50%, 50%)", "hsl(43, 96%, 58%)", "hsl(0, 85%, 60%)"];

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

  const getFlaggedStatus = (title: string) => {
    const flaggedMetrics = ["Missing Royalties", "Flagged Royalties", "Unmatched Metadata"];
    return flaggedMetrics.includes(title);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your music royalty performance</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md" data-testid="error-message">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <MetricCard 
                key={i} 
                title="Loading..." 
                value="--" 
              />
            ))
          ) : (
            metrics.map((metric) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                isFlagged={getFlaggedStatus(metric.title)}
              />
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title="Playback Frequency" 
            isLoading={isLoading}
            isEmpty={!charts?.playbackFrequency?.length}
          >
            {charts?.playbackFrequency && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.playbackFrequency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                  <YAxis stroke="hsl(0, 0%, 70%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 12%)', 
                      border: '1px solid hsl(0, 0%, 18%)',
                      borderRadius: '6px',
                      color: 'hsl(0, 0%, 95%)'
                    }}
                  />
                  <Bar dataKey="streams" fill="hsl(141, 76%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard 
            title="Royalty Gap Estimation" 
            isLoading={isLoading}
            isEmpty={!charts?.royaltyGapEstimation?.length}
          >
            {charts?.royaltyGapEstimation && (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={charts.royaltyGapEstimation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                  <YAxis stroke="hsl(0, 0%, 70%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 12%)', 
                      border: '1px solid hsl(0, 0%, 18%)',
                      borderRadius: '6px',
                      color: 'hsl(0, 0%, 95%)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="expected" 
                    stroke="hsl(141, 76%, 48%)" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: "hsl(141, 76%, 48%)" }}
                    className="neon-glow"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(270, 85%, 60%)" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: "hsl(270, 85%, 60%)" }}
                    className="neon-glow"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard 
            title="Missing Metadata Statistics" 
            isLoading={isLoading}
            isEmpty={!charts?.missingMetadataStats?.length}
          >
            {charts?.missingMetadataStats && (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={charts.missingMetadataStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
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
                      backgroundColor: 'hsl(0, 0%, 12%)', 
                      border: '1px solid hsl(0, 0%, 18%)',
                      borderRadius: '6px',
                      color: 'hsl(0, 0%, 95%)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </AppLayout>
  );
}
