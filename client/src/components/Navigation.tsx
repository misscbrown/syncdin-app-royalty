import { Link, useLocation } from "wouter";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/about", label: "About" },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50" data-testid="nav-main">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        <div className="font-bold text-lg text-foreground" data-testid="text-logo">
          RoyaltyTrack
        </div>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-sm font-medium transition-colors duration-200 ${
                location === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
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
