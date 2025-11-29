export default function Dashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-dashboard">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="mt-2 text-muted-foreground" data-testid="text-dashboard-description">Your dashboard overview</p>
      </div>
    </div>
  );
}
