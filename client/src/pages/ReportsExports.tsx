import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, FileText, Calendar } from "lucide-react";

const reportTypes = [
  { id: "royalty", title: "Royalty Report", description: "Detailed breakdown of all royalty earnings", icon: FileSpreadsheet },
  { id: "streaming", title: "Streaming Report", description: "Playback statistics across platforms", icon: FileText },
  { id: "metadata", title: "Metadata Report", description: "Track metadata status and issues", icon: FileText },
  { id: "financial", title: "Financial Summary", description: "Overall financial performance", icon: FileSpreadsheet },
];

const recentExports = [
  { id: 1, name: "Royalty_Report_Nov2024.xlsx", date: "2024-11-20", size: "2.4 MB" },
  { id: 2, name: "Streaming_Report_Q3.pdf", date: "2024-10-15", size: "1.8 MB" },
  { id: 3, name: "Annual_Summary_2024.xlsx", date: "2024-10-01", size: "4.2 MB" },
];

export default function ReportsExports() {
  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-reports-exports">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-reports-exports-title">Reports & Exports</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-reports-exports-description">Generate and download detailed reports</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="bg-card border-border">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{report.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Button size="sm" data-testid={`button-generate-${report.id}`}>
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExports.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <FileDown className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{file.date}</span>
                        <span>-</span>
                        <span>{file.size}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" data-testid={`button-download-${file.id}`}>
                    <FileDown className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
