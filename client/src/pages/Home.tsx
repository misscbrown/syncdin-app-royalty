import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart3, Upload, FileText, GitCompare } from "lucide-react";

export default function Home() {
  const quickActions = [
    { icon: Upload, label: "Upload Tracks", path: "/upload-tracks", description: "Add new tracks to your catalog" },
    { icon: FileText, label: "View Statements", path: "/royalty-statements", description: "Check your royalty reports" },
    { icon: GitCompare, label: "Match Metadata", path: "/metadata-matching", description: "Reconcile track information" },
    { icon: BarChart3, label: "Analytics", path: "/playback-analytics", description: "View playback statistics" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8" data-testid="page-home">
        <div className="text-center max-w-2xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="text-home-title">
            Welcome to RoyaltyTrack
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="text-home-description">
            Your comprehensive music royalty tracking and analytics platform. 
            Monitor streams, manage metadata, and maximize your earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} href={action.path}>
                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200 cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {action.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Start by uploading your tracks or connecting your distribution accounts. 
              Once your catalog is set up, you can track royalties and analyze performance.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/upload-tracks">
                <Button data-testid="button-upload-tracks">
                  Upload Tracks
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" data-testid="button-view-dashboard">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
