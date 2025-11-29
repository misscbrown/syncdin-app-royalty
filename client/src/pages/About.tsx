import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, BarChart3, Shield, Globe } from "lucide-react";

const features = [
  { icon: Music, title: "Track Management", description: "Upload and manage your entire music catalog in one place" },
  { icon: BarChart3, title: "Analytics", description: "Detailed insights into your streaming performance" },
  { icon: Shield, title: "Royalty Protection", description: "Identify and recover missing royalty payments" },
  { icon: Globe, title: "Global Coverage", description: "Track royalties across all major streaming platforms" },
];

export default function About() {
  return (
    <AppLayout>
      <div className="space-y-8" data-testid="page-about">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-about-title">About RoyaltyTrack</h1>
          <p className="text-muted-foreground mt-4 text-lg" data-testid="text-about-description">
            RoyaltyTrack is a comprehensive music royalty tracking platform designed to help 
            artists, labels, and publishers maximize their earnings and streamline royalty management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We believe that every artist deserves to be fairly compensated for their work. 
              Our platform uses advanced technology to track, analyze, and optimize royalty 
              collection across all major streaming services, ensuring you never miss a payment.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
