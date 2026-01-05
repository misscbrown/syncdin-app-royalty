import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import './styles/theme.css';
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import UploadTracks from "@/pages/UploadTracks"
import TrackLibrary from "@/pages/TrackLibrary";
import RoyaltyStatements from "@/pages/RoyaltyStatements";
import MetadataMatching from "@/pages/MetadataMatching";
import PlaybackAnalytics from "./pages/PlaybackAnalytics";
import ReportsExports from "./pages/ReportsExports";
import Settings from "./pages/Settings";
import MLCVerification from "@/pages/MLCVerification";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
