import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertCircle,
  Search,
  Zap,
  CheckCircle2,
  XCircle,
  Music,
  Loader2,
  RefreshCw,
  ExternalLink,
  Eye,
  Info,
  User,
  Building2,
  Radio,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SiSpotify, SiYoutube } from "react-icons/si";

interface Track {
  id: string;
  isrc: string;
  title: string;
  artist: string;
  upc: string | null;
  createdAt: string;
  spotifyMatched: boolean;
  spotifyId?: string;
  spotifyAlbumArt?: string;
  spotifyDurationMs?: number;
  youtubeMatched: boolean;
  youtubeId?: string;
  youtubeViewCount?: number;
  youtubeSourceType?: 'OFFICIAL_ARTIST_CHANNEL' | 'LABEL_CHANNEL' | 'TOPIC_VIDEO' | 'OTHER';
  youtubeIdentityConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  youtubePerformanceWeight?: 'HIGH' | 'MEDIUM' | 'LOW';
  matchSource?: string;
}

type SourceType = 'OFFICIAL_ARTIST_CHANNEL' | 'LABEL_CHANNEL' | 'TOPIC_VIDEO' | 'OTHER';

const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; icon: typeof User; color: string; description: string }> = {
  'OFFICIAL_ARTIST_CHANNEL': {
    label: 'Official Video',
    icon: User,
    color: 'text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/30',
    description: 'Official artist channel or VEVO - highest performance relevance'
  },
  'LABEL_CHANNEL': {
    label: 'Label Upload',
    icon: Building2,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    description: 'Official record label channel - high identity confidence'
  },
  'TOPIC_VIDEO': {
    label: 'Topic Video',
    icon: Radio,
    color: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
    description: 'YouTube auto-generated - high identity confidence, lower performance relevance'
  },
  'OTHER': {
    label: 'Other',
    icon: HelpCircle,
    color: 'text-muted-foreground bg-muted border-border',
    description: 'Unverified source - may require manual review'
  },
};

const CONFIDENCE_COLORS = {
  'HIGH': 'text-green-400',
  'MEDIUM': 'text-yellow-400',
  'LOW': 'text-red-400',
};

interface ServiceStatus {
  connected: boolean;
  error?: string;
}

interface MatchResult {
  matched: number;
  failed: number;
  skipped: number;
  details: Array<{ trackId: string; status: string; spotifyId?: string; youtubeId?: string; confidence?: number }>;
}

function formatViewCount(count: number | undefined | null): string {
  if (!count) return "—";
  if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function MetadataMatching() {
  const [activeTab, setActiveTab] = useState("matching");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: spotifyStatus, isLoading: spotifyStatusLoading } = useQuery<ServiceStatus>({
    queryKey: ['/api/spotify/status'],
  });

  const { data: youtubeStatus, isLoading: youtubeStatusLoading } = useQuery<ServiceStatus>({
    queryKey: ['/api/youtube/status'],
  });

  const { data: tracks = [], isLoading: tracksLoading, refetch: refetchTracks } = useQuery<Track[]>({
    queryKey: ['/api/integrations/tracks'],
  });

  const matchSpotifySingleMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const response = await apiRequest('POST', `/api/spotify/match/${trackId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/tracks'] });
      if (data.success) {
        toast({
          title: "Spotify match",
          description: data.alreadyMatched ? "Track was already matched" : "Successfully matched with Spotify",
        });
      } else {
        toast({
          title: "No match found",
          description: "Could not find this track on Spotify",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Match failed",
        description: error.message || "Failed to match track",
        variant: "destructive",
      });
    },
  });

  const matchYouTubeSingleMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const response = await apiRequest('POST', `/api/youtube/match/${trackId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/tracks'] });
      if (data.success) {
        toast({
          title: "YouTube match",
          description: data.alreadyMatched 
            ? "Track was already matched" 
            : `Matched with ${data.confidence}% confidence`,
        });
      } else {
        toast({
          title: "No match found",
          description: "Could not find this track on YouTube",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Match failed",
        description: error.message || "Failed to match track",
        variant: "destructive",
      });
    },
  });

  const matchSpotifyBatchMutation = useMutation({
    mutationFn: async (trackIds: string[]) => {
      const response = await apiRequest('POST', '/api/spotify/match-batch', { trackIds });
      return response.json();
    },
    onSuccess: (data: MatchResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/tracks'] });
      setSelectedTracks(new Set());
      toast({
        title: "Spotify batch complete",
        description: `Matched: ${data.matched}, Failed: ${data.failed}, Skipped: ${data.skipped}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Batch match failed",
        description: error.message || "Failed to match tracks",
        variant: "destructive",
      });
    },
  });

  const matchYouTubeBatchMutation = useMutation({
    mutationFn: async (trackIds: string[]) => {
      const response = await apiRequest('POST', '/api/youtube/match-batch', { trackIds });
      return response.json();
    },
    onSuccess: (data: MatchResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/tracks'] });
      setSelectedTracks(new Set());
      toast({
        title: "YouTube batch complete",
        description: `Matched: ${data.matched}, Failed: ${data.failed}, Skipped: ${data.skipped}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Batch match failed",
        description: error.message || "Failed to match tracks",
        variant: "destructive",
      });
    },
  });

  const filteredTracks = tracks.filter(track => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.isrc.toLowerCase().includes(query)
    );
  });

  const spotifyMatchedCount = tracks.filter(t => t.spotifyMatched).length;
  const youtubeMatchedCount = tracks.filter(t => t.youtubeMatched).length;
  const bothMatchedCount = tracks.filter(t => t.spotifyMatched && t.youtubeMatched).length;
  const unmatchedCount = tracks.filter(t => !t.spotifyMatched && !t.youtubeMatched).length;
  const spotifyMatchRate = tracks.length > 0 ? Math.round((spotifyMatchedCount / tracks.length) * 100) : 0;
  const youtubeMatchRate = tracks.length > 0 ? Math.round((youtubeMatchedCount / tracks.length) * 100) : 0;

  const handleSelectAll = () => {
    const selectableTracks = filteredTracks.filter(t => !t.spotifyMatched || !t.youtubeMatched);
    if (selectedTracks.size === selectableTracks.length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(selectableTracks.map(t => t.id)));
    }
  };

  const handleSelectTrack = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleMatchSpotifySelected = () => {
    const unmatched = Array.from(selectedTracks).filter(id => {
      const track = tracks.find(t => t.id === id);
      return track && !track.spotifyMatched;
    });
    if (unmatched.length === 0) {
      toast({ title: "All selected tracks already matched", description: "Select unmatched tracks to continue" });
      return;
    }
    matchSpotifyBatchMutation.mutate(unmatched);
  };

  const handleMatchYouTubeSelected = () => {
    const unmatched = Array.from(selectedTracks).filter(id => {
      const track = tracks.find(t => t.id === id);
      return track && !track.youtubeMatched;
    });
    if (unmatched.length === 0) {
      toast({ title: "All selected tracks already matched", description: "Select unmatched tracks to continue" });
      return;
    }
    matchYouTubeBatchMutation.mutate(unmatched);
  };

  const handleMatchAllSpotify = () => {
    const unmatchedIds = tracks.filter(t => !t.spotifyMatched).map(t => t.id);
    if (unmatchedIds.length === 0) {
      toast({ title: "All tracks matched", description: "All tracks are already matched with Spotify" });
      return;
    }
    matchSpotifyBatchMutation.mutate(unmatchedIds);
  };

  const handleMatchAllYouTube = () => {
    const unmatchedIds = tracks.filter(t => !t.youtubeMatched).map(t => t.id);
    if (unmatchedIds.length === 0) {
      toast({ title: "All tracks matched", description: "All tracks are already matched with YouTube" });
      return;
    }
    matchYouTubeBatchMutation.mutate(unmatchedIds);
  };

  const isBatchPending = matchSpotifyBatchMutation.isPending || matchYouTubeBatchMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-metadata-matching">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-metadata-title">
              Metadata & Matching
            </h1>
            <p className="text-muted-foreground mt-1">
              Match your tracks with Spotify and YouTube for enhanced metadata
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border" data-testid="tabs-metadata">
            <TabsTrigger value="matching" className="flex items-center gap-2" data-testid="tab-matching">
              <Zap className="w-4 h-4" />
              Track Matching
            </TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-metadata-health">
              Metadata Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matching" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1DB954]/10 flex items-center justify-center">
                      <SiSpotify className="w-5 h-5 text-[#1DB954]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid="text-spotify-status">
                        {spotifyStatusLoading ? "..." : spotifyStatus?.connected ? "Connected" : "Offline"}
                      </p>
                      <p className="text-xs text-muted-foreground">Spotify</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF0000]/10 flex items-center justify-center">
                      <SiYoutube className="w-5 h-5 text-[#FF0000]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid="text-youtube-status">
                        {youtubeStatusLoading ? "..." : youtubeStatus?.connected ? "Connected" : "Offline"}
                      </p>
                      <p className="text-xs text-muted-foreground">YouTube</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1DB954]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground" data-testid="text-spotify-matched">
                        {spotifyMatchedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Spotify</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF0000]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#FF0000]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground" data-testid="text-youtube-matched">
                        {youtubeMatchedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">YouTube</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground" data-testid="text-both-matched">
                        {bothMatchedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Both</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground" data-testid="text-unmatched-count">
                        {unmatchedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Unmatched</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    Track Matching
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetchTracks()}
                      disabled={tracksLoading}
                      data-testid="button-refresh-tracks"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${tracksLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#1DB954]/50 text-[#1DB954] hover:bg-[#1DB954]/10"
                      onClick={handleMatchSpotifySelected}
                      disabled={selectedTracks.size === 0 || isBatchPending}
                      data-testid="button-match-spotify-selected"
                    >
                      {matchSpotifyBatchMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <SiSpotify className="w-4 h-4 mr-2" />
                      )}
                      Spotify ({selectedTracks.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#FF0000]/50 text-[#FF0000] hover:bg-[#FF0000]/10"
                      onClick={handleMatchYouTubeSelected}
                      disabled={selectedTracks.size === 0 || isBatchPending}
                      data-testid="button-match-youtube-selected"
                    >
                      {matchYouTubeBatchMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <SiYoutube className="w-4 h-4 mr-2" />
                      )}
                      YouTube ({selectedTracks.size})
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleMatchAllSpotify}
                      disabled={spotifyMatchedCount === tracks.length || isBatchPending}
                      className="bg-[#1DB954] hover:bg-[#1DB954]/90"
                      data-testid="button-match-all-spotify"
                    >
                      <SiSpotify className="w-4 h-4 mr-2" />
                      All Spotify
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleMatchAllYouTube}
                      disabled={youtubeMatchedCount === tracks.length || isBatchPending}
                      className="bg-[#FF0000] hover:bg-[#FF0000]/90"
                      data-testid="button-match-all-youtube"
                    >
                      <SiYoutube className="w-4 h-4 mr-2" />
                      All YouTube
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tracks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-tracks"
                    />
                  </div>
                </div>

                {tracksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTracks.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No tracks found</h3>
                    <p className="text-muted-foreground">
                      {tracks.length === 0 
                        ? "Upload some tracks first to start matching"
                        : "No tracks match your search query"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedTracks.size === filteredTracks.filter(t => !t.spotifyMatched || !t.youtubeMatched).length && filteredTracks.filter(t => !t.spotifyMatched || !t.youtubeMatched).length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-border"
                              data-testid="checkbox-select-all"
                            />
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Track</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ISRC</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Spotify</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">YouTube</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTracks.map((track) => (
                          <tr 
                            key={track.id} 
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            data-testid={`row-track-${track.id}`}
                          >
                            <td className="py-3 px-4">
                              {(!track.spotifyMatched || !track.youtubeMatched) && (
                                <input
                                  type="checkbox"
                                  checked={selectedTracks.has(track.id)}
                                  onChange={() => handleSelectTrack(track.id)}
                                  className="rounded border-border"
                                  data-testid={`checkbox-track-${track.id}`}
                                />
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {track.spotifyAlbumArt ? (
                                  <img 
                                    src={track.spotifyAlbumArt} 
                                    alt={track.title}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                    <Music className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-foreground" data-testid={`text-track-title-${track.id}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground" data-testid={`text-track-artist-${track.id}`}>
                                    {track.artist}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                {track.isrc}
                              </code>
                            </td>
                            <td className="py-3 px-4">
                              {track.spotifyMatched ? (
                                <Badge variant="outline" className="bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/30">
                                  <SiSpotify className="w-3 h-3 mr-1" />
                                  Matched
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  No
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {track.youtubeMatched ? (
                                <div className="flex items-center gap-1">
                                  {track.youtubeSourceType && SOURCE_TYPE_CONFIG[track.youtubeSourceType] ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge 
                                          variant="outline" 
                                          className={`${SOURCE_TYPE_CONFIG[track.youtubeSourceType].color} cursor-help`}
                                          data-testid={`badge-youtube-source-${track.id}`}
                                        >
                                          {(() => {
                                            const IconComponent = SOURCE_TYPE_CONFIG[track.youtubeSourceType!].icon;
                                            return <IconComponent className="w-3 h-3 mr-1" />;
                                          })()}
                                          {SOURCE_TYPE_CONFIG[track.youtubeSourceType].label}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <div className="space-y-1">
                                          <p className="font-medium">{SOURCE_TYPE_CONFIG[track.youtubeSourceType].label}</p>
                                          <p className="text-xs text-muted-foreground">{SOURCE_TYPE_CONFIG[track.youtubeSourceType].description}</p>
                                          {track.youtubeIdentityConfidence && (
                                            <p className="text-xs">
                                              Identity: <span className={CONFIDENCE_COLORS[track.youtubeIdentityConfidence]}>{track.youtubeIdentityConfidence}</span>
                                            </p>
                                          )}
                                          {track.youtubePerformanceWeight && (
                                            <p className="text-xs">
                                              Performance: <span className={CONFIDENCE_COLORS[track.youtubePerformanceWeight]}>{track.youtubePerformanceWeight}</span>
                                            </p>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Badge variant="outline" className="bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/30">
                                      <SiYoutube className="w-3 h-3 mr-1" />
                                      Matched
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  No
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {track.youtubeViewCount ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-muted-foreground cursor-help" data-testid={`views-${track.id}`}>
                                      <Eye className="w-3 h-3" />
                                      <span className="text-sm">{formatViewCount(track.youtubeViewCount)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1">
                                      <p className="font-medium">Usage Signal</p>
                                      <p className="text-xs text-muted-foreground">
                                        View count reflects exposure, not royalty payout. Use to identify tracks with high activity vs. reported income.
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {track.spotifyMatched && track.spotifyId && (
                                  <a
                                    href={`https://open.spotify.com/track/${track.spotifyId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1DB954] hover:underline text-xs flex items-center gap-1"
                                    data-testid={`link-spotify-${track.id}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Spotify
                                  </a>
                                )}
                                {track.youtubeMatched && track.youtubeId && (
                                  <a
                                    href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#FF0000] hover:underline text-xs flex items-center gap-1"
                                    data-testid={`link-youtube-${track.id}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    YouTube
                                  </a>
                                )}
                                {!track.spotifyMatched && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => matchSpotifySingleMutation.mutate(track.id)}
                                    disabled={matchSpotifySingleMutation.isPending}
                                    className="h-7 px-2 text-[#1DB954]"
                                    data-testid={`button-match-spotify-${track.id}`}
                                  >
                                    {matchSpotifySingleMutation.isPending ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <SiSpotify className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                                {!track.youtubeMatched && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => matchYouTubeSingleMutation.mutate(track.id)}
                                    disabled={matchYouTubeSingleMutation.isPending}
                                    className="h-7 px-2 text-[#FF0000]"
                                    data-testid={`button-match-youtube-${track.id}`}
                                  >
                                    {matchYouTubeSingleMutation.isPending ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <SiYoutube className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Tracks</p>
                      <p className="text-3xl font-bold text-foreground">{tracks.length}</p>
                    </div>
                    <div className="text-primary/60">
                      <Music className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Spotify Matched</p>
                      <p className="text-3xl font-bold text-foreground">{spotifyMatchedCount}</p>
                    </div>
                    <div className="text-[#1DB954]">
                      <SiSpotify className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">YouTube Matched</p>
                      <p className="text-3xl font-bold text-foreground">{youtubeMatchedCount}</p>
                    </div>
                    <div className="text-[#FF0000]">
                      <SiYoutube className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Both Matched</p>
                      <p className="text-3xl font-bold text-foreground">{bothMatchedCount}</p>
                    </div>
                    <div className="text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                    <div className="flex items-center gap-2">
                      <SiSpotify className="w-4 h-4 text-[#1DB954]" />
                      <span className="text-muted-foreground">Spotify Match Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#1DB954]" style={{ width: `${spotifyMatchRate}%` }}></div>
                      </div>
                      <span className="text-foreground font-medium w-12 text-right">{spotifyMatchRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <SiYoutube className="w-4 h-4 text-[#FF0000]" />
                      <span className="text-muted-foreground">YouTube Match Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF0000]" style={{ width: `${youtubeMatchRate}%` }}></div>
                      </div>
                      <span className="text-foreground font-medium w-12 text-right">{youtubeMatchRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">ISRC Coverage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "100%" }}></div>
                      </div>
                      <span className="text-foreground font-medium w-12 text-right">100%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Cross-Platform Coverage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${tracks.length > 0 ? Math.round((bothMatchedCount / tracks.length) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-foreground font-medium w-12 text-right">
                        {tracks.length > 0 ? Math.round((bothMatchedCount / tracks.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
