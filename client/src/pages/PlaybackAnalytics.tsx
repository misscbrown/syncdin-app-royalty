import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/MetricCard";
import ChartCard from "@/components/ChartCard";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface SocialMetricsStatus {
  configured: boolean;
  remaining: number;
  limitReached: boolean;
  monthlyLimit: number;
}

interface SocialMetricsSummary {
  totalSocialPlays: number;
  topPlatform: string;
  activeTracksCount: number;
  platformBreakdown: {
    tiktok: number;
    soundcloud: number;
    instagram: number;
    snapchat: number;
  };
  remainingQuota: number;
  limitReached: boolean;
}

interface DashboardData {
  summary: {
    totalTracks: number;
    totalStreams: number;
    totalYouTubeViews: number;
    youtubeMatched: number;
    platformBreakdown: Record<string, number>;
  };
  charts: {
    playbackFrequency: Array<{ month: string; streams: number }>;
  };
}

interface SocialMetric {
  id: string;
  trackId: string;
  isrc: string;
  title: string;
  artist: string;
  tiktokPlays: number;
  tiktokVideos: number;
  soundcloudPlays: number;
  instagramReels: number;
  snapchatPlays: number;
  totalSocialPlays: number;
  topPlatform: string | null;
  lastUpdated: string;
}

interface SocialMetricsResponse {
  metrics: SocialMetric[];
  remainingQuota: number;
  limitReached: boolean;
}

interface Track {
  id: string;
  isrc: string;
  title: string;
  artist: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "hsl(0, 70%, 50%)",
  tiktok: "hsl(330, 80%, 55%)",
  soundcloud: "hsl(20, 90%, 55%)",
  instagram: "hsl(280, 70%, 55%)",
  snapchat: "hsl(50, 90%, 55%)",
};

const PIE_COLORS = [
  "hsl(0, 70%, 50%)",
  "hsl(330, 80%, 55%)",
  "hsl(20, 90%, 55%)",
  "hsl(280, 70%, 55%)",
  "hsl(50, 90%, 55%)",
];

export default function PlaybackAnalytics() {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const { data: songstatsStatus, isLoading: statusLoading } = useQuery<SocialMetricsStatus>({
    queryKey: ["/api/social-metrics/status"],
  });

  const { data: socialSummary, isLoading: summaryLoading } = useQuery<SocialMetricsSummary>({
    queryKey: ["/api/social-metrics/summary"],
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const { data: socialMetricsData, isLoading: metricsLoading } = useQuery<SocialMetricsResponse>({
    queryKey: ["/api/social-metrics"],
  });

  const { data: tracksResponse, isLoading: tracksLoading } = useQuery<{ tracks: Track[] }>({
    queryKey: ["/api/tracks"],
    enabled: activeTab === "tracks",
  });
  const allTracks = tracksResponse?.tracks;

  const [refreshingTrackId, setRefreshingTrackId] = useState<string | null>(null);

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/social-metrics/refresh-all");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-metrics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-metrics/status"] });
      toast({
        title: "Social Metrics Refreshed",
        description: `Processed ${data.processed} tracks. ${data.remaining} API calls remaining this month.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshSingleTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      setRefreshingTrackId(trackId);
      const response = await apiRequest("POST", `/api/social-metrics/refresh/${trackId}`);
      return response.json();
    },
    onSuccess: (data) => {
      setRefreshingTrackId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/social-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-metrics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social-metrics/status"] });
      toast({
        title: "Track Metrics Refreshed",
        description: `${data.remaining} API calls remaining this month.`,
      });
    },
    onError: (error: Error) => {
      setRefreshingTrackId(null);
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = statusLoading || summaryLoading || dashboardLoading || metricsLoading;
  const isTracksLoading = tracksLoading && activeTab === "tracks";

  const youtubeViews = dashboardData?.summary?.totalYouTubeViews || 0;
  const socialPlays = socialSummary?.totalSocialPlays || 0;
  const totalPlays = youtubeViews + socialPlays;
  const activeTracksCount = socialSummary?.activeTracksCount || 0;
  const tracksWithYouTube = dashboardData?.summary?.youtubeMatched || 0;

  const platformData = [
    { platform: "YouTube", plays: youtubeViews, color: PLATFORM_COLORS.youtube },
    { platform: "TikTok", plays: socialSummary?.platformBreakdown?.tiktok || 0, color: PLATFORM_COLORS.tiktok },
    { platform: "SoundCloud", plays: socialSummary?.platformBreakdown?.soundcloud || 0, color: PLATFORM_COLORS.soundcloud },
    { platform: "Instagram", plays: socialSummary?.platformBreakdown?.instagram || 0, color: PLATFORM_COLORS.instagram },
    { platform: "Snapchat", plays: socialSummary?.platformBreakdown?.snapchat || 0, color: PLATFORM_COLORS.snapchat },
  ].filter(p => p.plays > 0);

  const totalForPercentage = platformData.reduce((sum, p) => sum + p.plays, 0);
  const pieData = platformData.map(p => ({
    ...p,
    percentage: totalForPercentage > 0 ? Math.round((p.plays / totalForPercentage) * 100) : 0,
  }));

  const topPlatformName = pieData.length > 0 
    ? pieData.sort((a, b) => b.plays - a.plays)[0].platform 
    : "None";

  const streamTrendsData = dashboardData?.charts?.playbackFrequency || [];

  const toggleTrack = (id: string) => {
    setExpandedTrack(expandedTrack === id ? null : id);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-playback-analytics">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-playback-analytics-title">
              Playback Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              YouTube views + social media metrics from Songstats
            </p>
          </div>
          <div className="flex items-center gap-3">
            {songstatsStatus && (
              <Badge variant={songstatsStatus.limitReached ? "destructive" : "secondary"}>
                {songstatsStatus.remaining}/{songstatsStatus.monthlyLimit} API calls left
              </Badge>
            )}
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending || songstatsStatus?.limitReached}
              data-testid="button-refresh-social-metrics"
            >
              {refreshMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Social Metrics
            </Button>
          </div>
        </div>

        {songstatsStatus?.limitReached && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Monthly API Limit Reached</p>
              <p className="text-sm text-muted-foreground mt-1">
                You've used all 50 Songstats API calls for this month. Social metrics will refresh next month.
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border" data-testid="tabs-analytics">
            <TabsTrigger value="overview" data-testid="tab-analytics-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tracks" data-testid="tab-analytics-tracks">
              Track Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Plays"
                    value={formatNumber(totalPlays)}
                  />
                  <MetricCard
                    title="YouTube Views"
                    value={formatNumber(youtubeViews)}
                  />
                  <MetricCard
                    title="Social Plays"
                    value={formatNumber(socialPlays)}
                  />
                  <MetricCard
                    title="Top Platform"
                    value={topPlatformName}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Tracks w/ YouTube"
                    value={tracksWithYouTube.toString()}
                  />
                  <MetricCard
                    title="Tracks w/ Social Data"
                    value={activeTracksCount.toString()}
                  />
                  <MetricCard
                    title="TikTok Plays"
                    value={formatNumber(socialSummary?.platformBreakdown?.tiktok || 0)}
                  />
                  <MetricCard
                    title="SoundCloud Plays"
                    value={formatNumber(socialSummary?.platformBreakdown?.soundcloud || 0)}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartCard title="Royalty Stream Trends">
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
                          formatter={(value: number) => `${value.toLocaleString()} streams`}
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
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="plays"
                            label={({ platform, percentage }) => `${platform}: ${percentage}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
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
                            formatter={(value: number) => `${value.toLocaleString()} plays`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                        No platform data yet. Click "Refresh Social Metrics" to fetch data.
                      </div>
                    )}
                  </ChartCard>
                </div>

                <ChartCard title="Platform Breakdown">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={platformData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                      <XAxis type="number" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                      <YAxis dataKey="platform" type="category" stroke="hsl(0, 0%, 70%)" fontSize={12} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 12%)",
                          border: "1px solid hsl(0, 0%, 18%)",
                          borderRadius: "6px",
                          color: "hsl(0, 0%, 95%)",
                        }}
                        formatter={(value: number) => `${value.toLocaleString()} plays`}
                      />
                      <Bar dataKey="plays" fill="hsl(141, 76%, 48%)" radius={[0, 4, 4, 0]}>
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </>
            )}
          </TabsContent>

          <TabsContent value="tracks" className="space-y-6 mt-6">
            <div className="bg-muted/30 border border-border rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Track Social Metrics</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on any track to view detailed platform breakdown from Songstats.
                </p>
              </div>
            </div>

            {metricsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : socialMetricsData?.metrics && socialMetricsData.metrics.length > 0 ? (
              <div className="space-y-3">
                {socialMetricsData.metrics.map((metric) => (
                  <div key={metric.id}>
                    <Card
                      className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer"
                      onClick={() => toggleTrack(metric.id)}
                      data-testid={`card-track-metrics-${metric.id}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{metric.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{metric.artist}</p>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Total Social</p>
                              <p className="font-semibold text-foreground">
                                {formatNumber(metric.totalSocialPlays || 0)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Top Platform</p>
                              <p className="font-semibold text-foreground text-sm capitalize">
                                {metric.topPlatform || "N/A"}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshSingleTrackMutation.mutate(metric.trackId);
                              }}
                              disabled={refreshingTrackId === metric.trackId || songstatsStatus?.limitReached}
                              data-testid={`button-refresh-track-${metric.id}`}
                            >
                              {refreshingTrackId === metric.trackId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </Button>
                            <button 
                              className="flex-shrink-0" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTrack(metric.id);
                              }}
                            >
                              {expandedTrack === metric.id ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>

                        {expandedTrack === metric.id && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">TikTok</p>
                                <p className="font-semibold text-foreground">
                                  {formatNumber(metric.tiktokPlays || 0)} plays
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {metric.tiktokVideos || 0} videos
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">SoundCloud</p>
                                <p className="font-semibold text-foreground">
                                  {formatNumber(metric.soundcloudPlays || 0)} plays
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Instagram</p>
                                <p className="font-semibold text-foreground">
                                  {formatNumber(metric.instagramReels || 0)} reach
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Snapchat</p>
                                <p className="font-semibold text-foreground">
                                  {formatNumber(metric.snapchatPlays || 0)} plays
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                                <p className="font-semibold text-foreground text-sm">
                                  {new Date(metric.lastUpdated).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : isTracksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : allTracks && allTracks.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    No social metrics fetched yet. Click the refresh icon next to any track to test with just 1 API call.
                  </p>
                </div>
                {allTracks.slice(0, 10).map((track) => (
                  <Card
                    key={track.id}
                    className="bg-card border-border"
                    data-testid={`card-track-test-${track.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                          <p className="text-xs text-muted-foreground mt-1">ISRC: {track.isrc}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => refreshSingleTrackMutation.mutate(track.id)}
                          disabled={refreshingTrackId === track.id || songstatsStatus?.limitReached}
                          data-testid={`button-refresh-test-track-${track.id}`}
                        >
                          {refreshingTrackId === track.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {allTracks.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Showing first 10 tracks. Refresh all to fetch metrics for all {allTracks.length} tracks.
                  </p>
                )}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No tracks in your library yet. Upload tracks first.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
