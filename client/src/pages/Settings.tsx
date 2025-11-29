export default function Settings() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-settings">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-settings-title">Settings</h1>
        <p className="mt-2 text-muted-foreground" data-testid="text-settings-description">Manage your settings</p>
      </div>
    </div>
  );
}
