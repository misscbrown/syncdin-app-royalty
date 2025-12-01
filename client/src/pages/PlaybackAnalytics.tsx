import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertCircle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  totalStreams: number;
  monthlyAvg: number;
  topPlatform: string;
  royaltyCorrelation: number;
  metadataScore: number;
  redFlags: number;
  expanded?: boolean;
}

const streamTrendsData = [
  { month: "Jul", streams: 45000 },
  { month: "Aug", streams: 52000 },
  { month: "Sep", streams: 48000 },
  { month: "Oct", streams: 61000 },
  { month: "Nov", streams: 55000 },
  { month: "Dec", streams: 70000 },
];

const platformDistribution = [
  { platform: "Spotify", streams: 125000, percentage: 45 },
  { platform: "Apple Music", streams: 85000, percentage: 30 },
  { platform: "YouTube", streams: 65000, percentage: 18 },
  { platform: "Amazon Music", streams: 25000, percentage: 7 },
];

const topTracks: Track[] = [
  {
    id: "1",
    title: "Summer Vibes",
    artist: "The Band",
    totalStreams: 245000,
    monthlyAvg: 40833,
    topPlatform: "Spotify",
    royaltyCorrelation: 94,
    metadataScore: 98,
    redFlags: 0,
  },
  {
    id: "2",
    title: "Ocean Dreams",
    artist: "Solo Artist",
    totalStreams: 128000,
    monthlyAvg: 21333,
    topPlatform: "Apple",
    royaltyCorrelation: 78,
    metadataScore: 85,
    redFlags: 1,
  },
  {
    id: "3",
    title: "City Lights",
    artist: "Duo Act",
    totalStreams: 98000,
    monthlyAvg: 16333,
    topPlatform: "Spotify",
    royaltyCorrelation: 65,
    metadataScore: 72,
    redFlags: 2,
  },
  {
    id: "4",
    title: "Mountain High",
    artist: "The Band",
    totalStreams: 76000,
    monthlyAvg: 12667,
    topPlatform: "YouTube",
    royaltyCorrelation: 82,
    metadataScore: 91,
    redFlags: 0,
  },
];

const PLATFORM_COLORS = ["hsl(141, 76%, 48%)", "hsl(270, 85%, 60%)", "hsl(200, 50%, 50%)", "hsl(43, 96%, 58%)"];

export default function PlaybackAnalytics() {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const totalStreams = 310000;
  const monthlyAverage = Math.round(totalStreams / 6);
  const activeTracks = 156;
  const topPlatform = "Spotify";

  const toggleTrack = (id: string) => {
    setExpandedTrack(expandedTrack === id ? null : id);
  };

  const getCorrelationColor = (score: number) => {
    if (score >= 85) return "text-primary";
    if (score >= 70) return "text-yellow-500";
    return "text-destructive";
  };

  const getMetadataColor = (score: number) => {
    if (score >= 90) return "text-primary";
    if (score >= 75) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-playback-analytics">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-playback-analytics-title">
            Playback Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Streams and usage 
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border" data-testid="tabs-analytics">
            <TabsTrigger value="overview" data-testid="tab-analytics-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="catalog" data-testid="tab-analytics-catalog">
              Active Catalogue
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Streams"
                value={`${(totalStreams / 1000).toFixed(0)}K`}
                trend="up"
                trendValue="+12%"
              />
              <MetricCard
                title="Monthly Average"
                value={`${(monthlyAverage / 1000).toFixed(0)}K`}
                trend="up"
                trendValue="+8%"
              />
              <MetricCard
                title="Top Platform"
                value={topPlatform}
              />
              <MetricCard
                title="Active Tracks"
                value={activeTracks.toString()}
                trend="up"
                trendValue="+3.2%"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Stream Trends */}
              <ChartCard title="Stream Trends">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={streamTrendsData}>
                    <defs>
                      <linearGradient id="streamGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(141, 76%, 48%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(141, 76%, 48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                    <XAxis dataKey="month" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                    <YAxis stroke="hsl(0, 0%, 70%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 12%)",
                        border: "1px solid hsl(0, 0%, 18%)",
                        borderRadius: "6px",
                        color: "hsl(0, 0%, 95%)",
                      }}
                      formatter={(value) => `${value.toLocaleString()} streams`}
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

              {/* Platform Distribution */}
              <ChartCard title="Platform Distribution">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={platformDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="streams"
                      label={({ platform, percentage }) => `${platform}: ${percentage}%`}
                    >
                      {platformDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 12%)",
                        border: "1px solid hsl(0, 0%, 18%)",
                        borderRadius: "6px",
                        color: "hsl(0, 0%, 95%)",
                      }}
                      formatter={(value) => `${value.toLocaleString()} streams`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          {/* Active Catalogue Tab */}
          <TabsContent value="catalog" className="space-y-6 mt-6">
            <div className="bg-muted/30 border border-border rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Drilldown Information</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on any track to view historical usage, royalty correlation, metadata accuracy, and red flags.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {topTracks.map((track) => (
                <div key={track.id}>
                  <Card
                    className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => toggleTrack(track.id)}
                    data-testid={`card-track-${track.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{track.title}</h3>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total Streams</p>
                            <p className="font-semibold text-foreground">
                              {(track.totalStreams / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Monthly Avg</p>
                            <p className="font-semibold text-foreground">
                              {(track.monthlyAvg / 1000).toFixed(1)}K
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Top Platform</p>
                            <p className="font-semibold text-foreground text-sm">{track.topPlatform}</p>
                          </div>
                          <button className="flex-shrink-0">
                            {expandedTrack === track.id ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedTrack === track.id && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Historical Usage */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Historical Usage</p>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">6-month total:</span>
                                  <span className="font-semibold text-foreground">
                                    {(track.totalStreams / 1000).toFixed(0)}K
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Peak month:</span>
                                  <span className="font-semibold text-foreground">Dec (70K)</span>
                                </div>
                              </div>
                            </div>

                            {/* Royalty Correlation */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Royalty Correlation</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className={`text-2xl font-bold ${getCorrelationColor(
                                    track.royaltyCorrelation
                                  )}`}>
                                    {track.royaltyCorrelation}%
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {track.royaltyCorrelation >= 85
                                    ? "Strong match"
                                    : track.royaltyCorrelation >= 70
                                      ? "Moderate match"
                                      : "Weak match"}
                                </p>
                              </div>
                            </div>

                            {/* Metadata Accuracy */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Metadata Accuracy</p>
                              <div className="space-y-2">
                                <div className={`text-2xl font-bold ${getMetadataColor(track.metadataScore)}`}>
                                  {track.metadataScore}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {track.metadataScore >= 90
                                    ? "Excellent"
                                    : track.metadataScore >= 75
                                      ? "Good"
                                      : "Needs review"}
                                </p>
                              </div>
                            </div>

                            {/* Red Flags */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Red Flags</p>
                              <div className="space-y-2">
                                <div className={`text-2xl font-bold ${
                                  track.redFlags === 0 ? "text-primary" : "text-destructive"
                                }`}>
                                  {track.redFlags}
                                </div>
                                {track.redFlags > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    data-testid={`button-review-flags-${track.id}`}
                                  >
                                    Review Issues
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
