export default function About() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-about">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-about-title">About</h1>
        <p className="mt-2 text-muted-foreground" data-testid="text-about-description">Learn more about us</p>
      </div>
    </div>
  );
}
