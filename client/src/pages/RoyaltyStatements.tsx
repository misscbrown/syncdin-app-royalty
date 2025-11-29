import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar } from "lucide-react";

const mockStatements = [
  { id: 1, period: "November 2024", amount: "$2,450.00", status: "Paid", date: "2024-11-15" },
  { id: 2, period: "October 2024", amount: "$2,180.00", status: "Paid", date: "2024-10-15" },
  { id: 3, period: "September 2024", amount: "$1,920.00", status: "Paid", date: "2024-09-15" },
  { id: 4, period: "August 2024", amount: "$2,100.00", status: "Paid", date: "2024-08-15" },
];

export default function RoyaltyStatements() {
  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-royalty-statements">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-statements-title">Royalty Statements</h1>
            <p className="text-muted-foreground mt-1">View and download your royalty payment statements</p>
          </div>
          <Button variant="outline" data-testid="button-export-all">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>

        <div className="grid gap-4">
          {mockStatements.map((statement) => (
            <Card key={statement.id} className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{statement.period}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{statement.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{statement.amount}</p>
                      <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                        {statement.status}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" data-testid={`button-download-${statement.id}`}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
