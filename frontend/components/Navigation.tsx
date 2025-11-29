import { Link, useLocation } from "wouter";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/dashboard", label: "Dashboard"},
  { path: "/upload-tracks", label: "Upload Tracks" },
  { path: "/royalty-statements", label: "Royalty Statements" },
  { path: "/metadata-matching", label: "Metadata Matching" },
  { path: "/missing-royalties", label: "Missing Royalties" },
  { path: "/playback-analytics", label: "Playback Analytics" },
  { path: "/reports-exports", label: "Reports & Exports" },
  { path: "/settings", label: "Settings" },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50" data-testid="nav-main">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        <div className="font-semibold text-lg text-foreground" data-testid="text-logo">
          MyApp
        </div>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-sm font-medium transition-colors ${
                location === item.path
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
