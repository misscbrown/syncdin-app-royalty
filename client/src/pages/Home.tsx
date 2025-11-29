export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-home">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-home-title">Home</h1>
        <p className="mt-2 text-muted-foreground" data-testid="text-home-description">Welcome to the home page</p>
      </div>
    </div>
  );
}
