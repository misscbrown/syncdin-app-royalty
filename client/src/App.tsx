import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import './styles/theme.css';
import Home from "@/pages/Home";
import About from "@/pages/About";
import Dashboard from "@/pages/Dashboard";
import UploadTracks from "@/pages/UploadTracks"
import TrackLibrary from "@/pages/TrackLibrary";
import RoyaltyStatements from "@/pages/RoyaltyStatements";
import MetadataMatching from "@/pages/MetadataMatching";
import PlaybackAnalytics from "./pages/PlaybackAnalytics";
import ReportsExports from "./pages/ReportsExports";
import Settings from "./pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/home" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/upload-tracks" component={UploadTracks} />
      <Route path="/track-library" component={TrackLibrary} />
      <Route path="/royalty-statements" component={RoyaltyStatements} />
      <Route path="/metadata-matching" component={MetadataMatching} />
      <Route path="/playback-analytics" component={PlaybackAnalytics} />
      <Route path="/reports-exports" component={ReportsExports} />
      <Route path="/settings" component={Settings} />
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
