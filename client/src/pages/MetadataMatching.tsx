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
  GitCompare,
  AlertCircle,
  Search,
  Zap,
  Check,
  CheckCircle2,
  XCircle,
  Music,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SiSpotify } from "react-icons/si";

interface Track {
  id: string;
  isrc: string;
  title: string;
  artist: string;
  upc: string | null;
  createdAt: string;
  spotifyMatched: boolean;
  spotifyId?: string;
  albumArt?: string;
}

interface SpotifyStatus {
  connected: boolean;
  error?: string;
}

interface MatchResult {
  matched: number;
  failed: number;
  skipped: number;
  details: Array<{ trackId: string; status: string; spotifyId?: string }>;
}

export default function MetadataMatching() {
  const [activeTab, setActiveTab] = useState("spotify");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: spotifyStatus, isLoading: statusLoading } = useQuery<SpotifyStatus>({
    queryKey: ['/api/spotify/status'],
  });

  const { data: tracks = [], isLoading: tracksLoading, refetch: refetchTracks } = useQuery<Track[]>({
    queryKey: ['/api/spotify/tracks'],
  });

  const matchSingleMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const response = await apiRequest('POST', `/api/spotify/match/${trackId}`);
      return response.json();
    },
    onSuccess: (data, trackId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/spotify/tracks'] });
      if (data.success) {
        toast({
          title: "Track matched",
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

  const matchBatchMutation = useMutation({
    mutationFn: async (trackIds: string[]) => {
      const response = await apiRequest('POST', '/api/spotify/match-batch', { trackIds });
      return response.json();
    },
    onSuccess: (data: MatchResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/spotify/tracks'] });
      setSelectedTracks(new Set());
      toast({
        title: "Batch matching complete",
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

  const matchedCount = tracks.filter(t => t.spotifyMatched).length;
  const unmatchedCount = tracks.filter(t => !t.spotifyMatched).length;
  const matchRate = tracks.length > 0 ? Math.round((matchedCount / tracks.length) * 100) : 0;

  const handleSelectAll = () => {
    if (selectedTracks.size === filteredTracks.filter(t => !t.spotifyMatched).length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(filteredTracks.filter(t => !t.spotifyMatched).map(t => t.id)));
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

  const handleMatchSelected = () => {
    if (selectedTracks.size === 0) return;
    matchBatchMutation.mutate(Array.from(selectedTracks));
  };

  const handleMatchAll = () => {
    const unmatchedIds = tracks.filter(t => !t.spotifyMatched).map(t => t.id);
    if (unmatchedIds.length === 0) {
      toast({
        title: "All tracks matched",
        description: "All tracks are already matched with Spotify",
      });
      return;
    }
    matchBatchMutation.mutate(unmatchedIds);
  };

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-metadata-matching">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-metadata-title">
              Metadata & Matching
            </h1>
            <p className="text-muted-foreground mt-1">
              Match your tracks with Spotify for enhanced metadata
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border" data-testid="tabs-metadata">
            <TabsTrigger value="spotify" className="flex items-center gap-2" data-testid="tab-spotify">
              <SiSpotify className="w-4 h-4" />
              Spotify Matching
            </TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-metadata-health">
              Metadata Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spotify" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1DB954]/10 flex items-center justify-center">
                      <SiSpotify className="w-5 h-5 text-[#1DB954]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-spotify-status">
                        {statusLoading ? "..." : spotifyStatus?.connected ? "Connected" : "Offline"}
                      </p>
                      <p className="text-xs text-muted-foreground">Spotify Status</p>
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
                      <p className="text-2xl font-bold text-foreground" data-testid="text-matched-count">
                        {matchedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Matched</p>
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
                      <p className="text-2xl font-bold text-foreground" data-testid="text-unmatched-count">
                        {unmatchedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Unmatched</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Music className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-match-rate">
                        {matchRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Match Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <SiSpotify className="w-5 h-5 text-[#1DB954]" />
                    Track Matching
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
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
                      onClick={handleMatchSelected}
                      disabled={selectedTracks.size === 0 || matchBatchMutation.isPending}
                      data-testid="button-match-selected"
                    >
                      {matchBatchMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Match Selected ({selectedTracks.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleMatchAll}
                      disabled={unmatchedCount === 0 || matchBatchMutation.isPending}
                      data-testid="button-match-all"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Match All Unmatched
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
                              checked={selectedTracks.size === filteredTracks.filter(t => !t.spotifyMatched).length && filteredTracks.filter(t => !t.spotifyMatched).length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-border"
                              data-testid="checkbox-select-all"
                            />
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Track</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ISRC</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
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
                              {!track.spotifyMatched && (
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
                                {track.albumArt ? (
                                  <img 
                                    src={track.albumArt} 
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
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Matched
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Unmatched
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {track.spotifyMatched && track.spotifyId ? (
                                  <a
                                    href={`https://open.spotify.com/track/${track.spotifyId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1DB954] hover:underline text-sm flex items-center gap-1"
                                    data-testid={`link-spotify-${track.id}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View on Spotify
                                  </a>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => matchSingleMutation.mutate(track.id)}
                                    disabled={matchSingleMutation.isPending}
                                    data-testid={`button-match-${track.id}`}
                                  >
                                    {matchSingleMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Zap className="w-4 h-4 mr-1" />
                                        Match
                                      </>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Missing ISRC</p>
                      <p className="text-3xl font-bold text-foreground">0</p>
                    </div>
                    <div className="text-primary/60">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Spotify Matched</p>
                      <p className="text-3xl font-bold text-foreground">{matchedCount}</p>
                    </div>
                    <div className="text-[#1DB954]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                    <span className="text-muted-foreground">Spotify Match Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#1DB954]" style={{ width: `${matchRate}%` }}></div>
                      </div>
                      <span className="text-foreground font-medium">{matchRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">ISRC Coverage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "100%" }}></div>
                      </div>
                      <span className="text-foreground font-medium">100%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Catalog Completeness</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${matchRate}%` }}></div>
                      </div>
                      <span className="text-foreground font-medium">{matchRate}%</span>
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
