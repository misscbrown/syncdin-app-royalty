import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Palette, Link2, CheckCircle2 } from "lucide-react";
import { SiSpotify, SiSoundcloud, SiYoutube } from "react-icons/si";

interface Connection {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  username?: string;
}

export default function Settings() {
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "spotify",
      name: "Spotify",
      icon: <SiSpotify className="w-5 h-5" />,
      connected: false,
    },
    {
      id: "soundcloud",
      name: "SoundCloud",
      icon: <SiSoundcloud className="w-5 h-5" />,
      connected: false,
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: <SiYoutube className="w-5 h-5" />,
      connected: false,
    },
  ]);

  const handleConnect = (id: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === id
          ? { ...conn, connected: true, username: `${conn.name.toLowerCase()}_user` }
          : conn
      )
    );
  };

  const handleDisconnect = (id: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === id ? { ...conn, connected: false, username: undefined } : conn
      )
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-settings">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-settings-title">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-settings-description">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-4">
          {/* API Connections */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                API Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                  data-testid={`connection-${conn.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        conn.connected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {conn.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{conn.name}</p>
                      {conn.connected && conn.username ? (
                        <p className="text-sm text-primary flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected as @{conn.username}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {conn.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(conn.id)}
                      data-testid={`button-disconnect-${conn.id}`}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(conn.id)}
                      data-testid={`button-connect-${conn.id}`}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Profile */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Display Name</p>
                  <p className="text-sm text-muted-foreground">John Doe</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-edit-name">
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">john@example.com</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-edit-email">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch data-testid="switch-email-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Royalty Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified about new payments</p>
                </div>
                <Switch defaultChecked data-testid="switch-royalty-alerts" />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch defaultChecked data-testid="switch-dark-mode" />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-enable-2fa">
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your password</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-change-password">
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
