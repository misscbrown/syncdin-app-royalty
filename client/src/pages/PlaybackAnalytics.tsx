import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AreaChart,
  Area,
} from "recharts";

const playbackData = [
  { month: "Jul", streams: 45000 },
  { month: "Aug", streams: 52000 },
  { month: "Sep", streams: 48000 },
  { month: "Oct", streams: 61000 },
  { month: "Nov", streams: 55000 },
  { month: "Dec", streams: 70000 },
];

const platformData = [
  { platform: "Spotify", streams: 125000 },
  { platform: "Apple", streams: 85000 },
  { platform: "YouTube", streams: 65000 },
  { platform: "Amazon", streams: 35000 },
];

export default function PlaybackAnalytics() {
  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-playback-analytics">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-playback-analytics-title">Playback Analytics</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-playback-analytics-description">Track your streaming performance across platforms</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Streams" value="1.2M" trend="up" trendValue="+12%" />
          <MetricCard title="Monthly Avg" value="200K" trend="up" trendValue="+8%" />
          <MetricCard title="Top Platform" value="Spotify" />
          <MetricCard title="Active Tracks" value="156" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Stream Trends">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={playbackData}>
                <defs>
                  <linearGradient id="streamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(141, 76%, 48%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(141, 76%, 48%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area 
                  type="monotone" 
                  dataKey="streams" 
                  stroke="hsl(141, 76%, 48%)" 
                  strokeWidth={2}
                  fill="url(#streamGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Platform Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                <XAxis type="number" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                <YAxis dataKey="platform" type="category" stroke="hsl(0, 0%, 70%)" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 12%)', 
                    border: '1px solid hsl(0, 0%, 18%)',
                    borderRadius: '6px',
                    color: 'hsl(0, 0%, 95%)'
                  }}
                />
                <Bar dataKey="streams" fill="hsl(141, 76%, 48%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </AppLayout>
  );
}
