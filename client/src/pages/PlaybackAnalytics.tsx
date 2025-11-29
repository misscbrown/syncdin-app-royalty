export default function PlaybackAnalytics() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-playback-analytics">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-playback-analytics-title">Playback Analytics</h1>
        <p className="mt-2 text-muted-foreground" data-testid="text-playback-analytics-description">View your playback analytics</p>
      </div>
    </div>
  );
}
