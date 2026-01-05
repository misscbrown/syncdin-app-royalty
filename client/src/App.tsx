import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import './styles/theme.css';
import Dashboard from "@/pages/Dashboard";
import UploadTracks from "@/pages/UploadTracks"
import TrackLibrary from "@/pages/TrackLibrary";
import RoyaltyStatements from "@/pages/RoyaltyStatements";
import MetadataMatching from "@/pages/MetadataMatching";
import PlaybackAnalytics from "./pages/PlaybackAnalytics";
import ReportsExports from "./pages/ReportsExports";
import Settings from "./pages/Settings";
import MLCVerification from "@/pages/MLCVerification";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Music } from "lucide-react";

// Landing page for logged out users
function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Music className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold">RoyaltyTrack</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Track your music royalties, manage your catalog, and gain insights into your earnings across all platforms.
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-signup"
          >
            Sign Up
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => window.location.href = "/api/login"}
              className="text-foreground hover:underline font-medium"
              data-testid="link-signin"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Loading screen
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Protected route wrapper - redirects to login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Check if user needs onboarding
  const needsOnboarding = isAuthenticated && user && !user.onboardingCompleted;
  const isOnOnboardingPage = location === "/onboarding";

  useEffect(() => {
    // Redirect to onboarding if needed (and not already on onboarding page)
    if (needsOnboarding && !isOnOnboardingPage) {
      setLocation("/onboarding");
    }
  }, [needsOnboarding, isOnOnboardingPage, setLocation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show landing page for logged out users at root
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // Show onboarding for users who haven't completed it
  if (needsOnboarding) {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route component={Onboarding} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/upload-tracks">
        <ProtectedRoute>
          <UploadTracks />
        </ProtectedRoute>
      </Route>
      <Route path="/track-library">
        <ProtectedRoute>
          <TrackLibrary />
        </ProtectedRoute>
      </Route>
      <Route path="/royalty-statements">
        <ProtectedRoute>
          <RoyaltyStatements />
        </ProtectedRoute>
      </Route>
      <Route path="/metadata-matching">
        <ProtectedRoute>
          <MetadataMatching />
        </ProtectedRoute>
      </Route>
      <Route path="/playback-analytics">
        <ProtectedRoute>
          <PlaybackAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/reports-exports">
        <ProtectedRoute>
          <ReportsExports />
        </ProtectedRoute>
      </Route>
      <Route path="/mlc-verification">
        <ProtectedRoute>
          <MLCVerification />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
