import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import { Link } from "wouter";
import { 
  getDashboardData, 
  type FormattedMetric, 
  type ChartData 
} from "../services/metricsService";
import MetricCard from "frontend/components/MetricCard";
import ChartCard from "frontend/components/ChartCard";

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
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)] p-4">
        <h2 className="text-xl font-bold mb-6">Dashboard Menu</h2>
        <nav className="flex flex-col gap-3">
          <Link href="/" className="hover:text-[var(--primary)]">Dashboard</Link>
          <Link href="/upload-tracks" className="hover:text-[var(--primary)]">Upload Tracks</Link>
          <Link href="/royalty-statements" className="hover:text-[var(--primary)]">Royalty Statements</Link>
          <Link href="/metadata-matching" className="hover:text-[var(--primary)]">Metadata Matching</Link>
          <Link href="/missing-royalties" className="hover:text-[var(--primary)]">Missing Royalties</Link>
          <Link href="/playback-analytics" className="hover:text-[var(--primary)]">Playback Analytics</Link>
          <Link href="/reports-exports" className="hover:text-[var(--primary)]">Reports & Exports</Link>
          <Link href="/settings" className="hover:text-[var(--primary)]">Settings</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <Navigation />

        {/* Dashboard Content */}
        <main className="p-6 flex-1 overflow-y-auto">
          <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <MetricCard 
                key={metric.title} 
                title={metric.title} 
                value={metric.value} 
                cardColor="var(--card)" 
                textColor="var(--card-foreground)" 
              />
            ))}
          </div>

          {/* Charts / Tables */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChartCard title="Playback Frequency" color="var(--chart-1)" />
            <ChartCard title="Missing Metadata Stats" color="var(--chart-2)" />
            <ChartCard title="Royalty Gap Estimation" color="var(--chart-3)" />
          </div>
        </main>
      </div>
    </div>

  );
}
