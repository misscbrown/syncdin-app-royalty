import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, ArrowUpDown, ChevronUp, ChevronDown, 
  Loader2, CheckCircle, XCircle, AlertCircle, HelpCircle, Clock,
  FileCheck, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Track } from "@shared/schema";

type SortField = "title" | "artist" | "isrc" | "mlcStatus" | "mlcLastCheckedAt" | "createdAt";

export default function MLCVerification() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [checkingTrackId, setCheckingTrackId] = useState<string | null>(null);

  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const checkMlcMutation = useMutation({
    mutationFn: async (trackId: string) => {
      return await apiRequest("PATCH", `/api/tracks/${trackId}/mlc-status`, {
        mlcStatus: "unknown",
        mlcNotes: "MLC check not yet connected"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast({
        title: "MLC Status Updated",
        description: "Track marked as pending MLC verification",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update MLC status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setCheckingTrackId(null);
    }
  });

  const handleCheckMlc = (trackId: string) => {
    setCheckingTrackId(trackId);
    checkMlcMutation.mutate(trackId);
  };

  const filteredTracks = tracks
    .filter((track) => {
      const query = searchQuery.toLowerCase();
      return (
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.isrc.toLowerCase().includes(query) ||
        (track.upc && track.upc.toLowerCase().includes(query))
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
        case "isrc":
          comparison = a.isrc.localeCompare(b.isrc);
          break;
        case "mlcStatus":
          comparison = (a.mlcStatus || "unchecked").localeCompare(b.mlcStatus || "unchecked");
          break;
        case "mlcLastCheckedAt":
          const aDate = a.mlcLastCheckedAt ? new Date(a.mlcLastCheckedAt).getTime() : 0;
          const bDate = b.mlcLastCheckedAt ? new Date(b.mlcLastCheckedAt).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === "desc" ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronUp className="w-4 h-4" />
    );
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const s = status || "unchecked";
    switch (s) {
      case "registered":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Registered
          </Badge>
        );
      case "unregistered":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Unregistered
          </Badge>
        );
      case "unknown":
        return (
          <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-500 border-yellow-600/30">
            <HelpCircle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-600/20 text-red-400 border-red-600/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Unchecked
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const statusCounts = {
    total: tracks.length,
    unchecked: tracks.filter(t => !t.mlcStatus || t.mlcStatus === "unchecked").length,
    registered: tracks.filter(t => t.mlcStatus === "registered").length,
    unregistered: tracks.filter(t => t.mlcStatus === "unregistered").length,
    unknown: tracks.filter(t => t.mlcStatus === "unknown").length,
    error: tracks.filter(t => t.mlcStatus === "error").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-mlc-verification">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-mlc-title">
              MLC Verification
            </h1>
            <p className="text-muted-foreground mt-1">
              Mechanical Licensing Collective registration status for your tracks
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, artist, ISRC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-mlc"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-tracks">
                    {statusCounts.total}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-unchecked">
                    {statusCounts.unchecked}
                  </p>
                  <p className="text-xs text-muted-foreground">Unchecked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-registered">
                    {statusCounts.registered}
                  </p>
                  <p className="text-xs text-muted-foreground">Registered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-unregistered">
                    {statusCounts.unregistered}
                  </p>
                  <p className="text-xs text-muted-foreground">Unregistered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-unknown">
                    {statusCounts.unknown}
                  </p>
                  <p className="text-xs text-muted-foreground">Unknown</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
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
                          Title <SortIcon field="title" />
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
                      <th className="text-left py-3 px-3">
                        <button
                          onClick={() => handleSort("isrc")}
                          className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors"
                          data-testid="button-sort-isrc"
                        >
                          ISRC <SortIcon field="isrc" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                        UPC
                      </th>
                      <th className="text-left py-3 px-3">
                        <button
                          onClick={() => handleSort("mlcStatus")}
                          className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors"
                          data-testid="button-sort-status"
                        >
                          MLC Status <SortIcon field="mlcStatus" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                        Work ID
                      </th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                        Confidence
                      </th>
                      <th className="text-left py-3 px-3">
                        <button
                          onClick={() => handleSort("mlcLastCheckedAt")}
                          className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors"
                          data-testid="button-sort-checked"
                        >
                          Last Checked <SortIcon field="mlcLastCheckedAt" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                        Notes
                      </th>
                      <th className="text-center py-3 px-3 text-muted-foreground font-medium">
                        Action
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
                          <p className="font-medium text-foreground truncate max-w-[180px]" title={track.title}>
                            {track.title}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-foreground">
                          {track.artist}
                        </td>
                        <td className="py-3 px-3">
                          <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono text-muted-foreground">
                            {track.isrc}
                          </code>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {track.upc || "-"}
                        </td>
                        <td className="py-3 px-3">
                          {getStatusBadge(track.mlcStatus)}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs font-mono">
                          {track.mlcWorkId || "-"}
                        </td>
                        <td className="py-3 px-3">
                          {track.mlcMatchConfidence ? (
                            <Badge 
                              variant="outline" 
                              className={
                                track.mlcMatchConfidence === "high" 
                                  ? "text-green-500 border-green-600/30" 
                                  : track.mlcMatchConfidence === "medium"
                                  ? "text-yellow-500 border-yellow-600/30"
                                  : "text-red-500 border-red-600/30"
                              }
                            >
                              {track.mlcMatchConfidence}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {formatDate(track.mlcLastCheckedAt)}
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={track.mlcNotes || ""}>
                            {track.mlcNotes || "-"}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckMlc(track.id)}
                            disabled={checkingTrackId === track.id}
                            data-testid={`button-check-mlc-${track.id}`}
                          >
                            {checkingTrackId === track.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Check MLC
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No tracks yet</p>
                <p className="text-sm mt-1">Upload a distributor CSV to see your tracks here</p>
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
