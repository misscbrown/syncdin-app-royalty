import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  GitCompare, 
  BarChart3, 
  FileDown, 
  Settings,
  Music,
  Library,
  FileCheck,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/upload-tracks", label: "Upload Files", icon: Upload },
  { path: "/track-library", label: "Track Library", icon: Library },
  { path: "/metadata-matching", label: "Metadata & Matching", icon: GitCompare },
  { path: "/royalty-statements", label: "Royalties & Earnings", icon: FileText },
  { path: "/playback-analytics", label: "Playback Analytics", icon: BarChart3 },
  { path: "/mlc-verification", label: "MLC Verification", icon: FileCheck },
  { path: "/reports-exports", label: "Reports & Exports", icon: FileDown },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-background" data-testid="app-layout">
      <aside className="w-64 bg-card flex flex-col border-r border-border" data-testid="sidebar">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground" data-testid="text-app-name">RoyaltyTrack</span>
          </div>
        </div>
        
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-accent text-primary"
                        : "text-muted-foreground hover:text-primary hover:bg-accent/50"
                    }`}
                    data-testid={`link-sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? "text-primary" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-email">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card flex items-center justify-between px-6 border-b border-border" data-testid="top-nav">
          <div className="text-sm text-muted-foreground font-medium">
            Music Royalty Tracking
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-accent transition-colors duration-200">
              <span className="text-sm font-medium text-muted-foreground">U</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
