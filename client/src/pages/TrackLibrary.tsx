import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Music, Search, DollarSign, PlayCircle, Globe, Store, 
  Loader2, ArrowUpDown, ChevronUp, ChevronDown, ExternalLink 
} from "lucide-react";
import type { TrackWithStats } from "@shared/schema";

export default function TrackLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"title" | "artist" | "totalEarnings" | "totalStreams">("totalEarnings");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: tracks = [], isLoading } = useQuery<TrackWithStats[]>({
    queryKey: ['/api/tracks'],
  });

  const filteredTracks = tracks
    .filter((track) => {
      const query = searchQuery.toLowerCase();
      return (
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.isrc.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "artist":
          comparison = a.artist.localeCompare(b.artist);
          break;
        case "totalEarnings":
          comparison = parseFloat(a.totalEarnings || "0") - parseFloat(b.totalEarnings || "0");
          break;
        case "totalStreams":
          comparison = (a.totalStreams || 0) - (b.totalStreams || 0);
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const totalEarnings = tracks.reduce((sum, track) => sum + parseFloat(track.totalEarnings || "0"), 0);
  const totalStreams = tracks.reduce((sum, track) => sum + parseInt(String(track.totalStreams || 0), 10), 0);
  const totalTracks = tracks.length;
  const uniqueArtists = new Set(tracks.map(t => t.artist)).size;

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === "desc" ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronUp className="w-4 h-4" />
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-track-library">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-library-title">
              Track Library
            </h1>
            <p className="text-muted-foreground mt-1">
              View all your tracks and their earnings
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, artist, or ISRC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-tracks"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-tracks">
                    {formatNumber(totalTracks)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-earnings">
                    {formatCurrency(totalEarnings)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-streams">
                    {formatNumber(totalStreams)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Streams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-unique-artists">
                    {formatNumber(uniqueArtists)}
                  </p>
                  <p className="text-xs text-muted-foreground">Artists</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Music className="w-5 h-5" />
              All Tracks ({filteredTracks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading tracks...</p>
              </div>
            ) : filteredTracks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3">
                        <button
                          onClick={() => handleSort("title")}
                          className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors"
                          data-testid="button-sort-title"
                        >
                          Track <SortIcon field="title" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-3">
                        <button
                          onClick={() => handleSort("artist")}
                          className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors"
                          data-testid="button-sort-artist"
                        >
                          Artist <SortIcon field="artist" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                        ISRC
                      </th>
                      <th className="text-right py-3 px-3">
                        <button
                          onClick={() => handleSort("totalStreams")}
                          className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors ml-auto"
                          data-testid="button-sort-streams"
                        >
                          Streams <SortIcon field="totalStreams" />
                        </button>
                      </th>
                      <th className="text-right py-3 px-3">
                        <button
                          onClick={() => handleSort("totalEarnings")}
                          className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors ml-auto"
                          data-testid="button-sort-earnings"
                        >
                          Earnings <SortIcon field="totalEarnings" />
                        </button>
                      </th>
                      <th className="text-center py-3 px-3 text-muted-foreground font-medium">
                        Platforms
                      </th>
                      <th className="text-center py-3 px-3 text-muted-foreground font-medium">
                        Countries
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTracks.map((track) => (
                      <tr
                        key={track.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                        data-testid={`row-track-${track.id}`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                              <Music className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[200px]" title={track.title}>
                                {track.title}
                              </p>
                              {track.upc && (
                                <p className="text-xs text-muted-foreground">UPC: {track.upc}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-foreground">
                          {track.artist}
                        </td>
                        <td className="py-3 px-3">
                          <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono text-muted-foreground">
                            {track.isrc}
                          </code>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-foreground">
                          {formatNumber(track.totalStreams || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-primary">
                          {formatCurrency(track.totalEarnings || 0)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="secondary" className="text-xs">
                            <Store className="w-3 h-3 mr-1" />
                            {track.storeCount || 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            {track.countryCount || 0}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No tracks yet</p>
                <p className="text-sm mt-1">Upload a distributor CSV to see your tracks here</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/upload'}
                  data-testid="button-go-to-upload"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to Upload
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No tracks found</p>
                <p className="text-sm mt-1">Try adjusting your search query</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
