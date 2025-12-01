import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Calendar,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import ChartCard from "@/components/ChartCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

const reportTypes = [
  {
    id: "royalty",
    title: "Royalty Report",
    description: "Detailed breakdown of all royalty earnings",
    icon: FileSpreadsheet,
  },
  {
    id: "streaming",
    title: "Streaming Report",
    description: "Playback statistics across platforms",
    icon: FileText,
  },
  {
    id: "metadata",
    title: "Metadata Report",
    description: "Track metadata status and issues",
    icon: FileText,
  },
  {
    id: "financial",
    title: "Financial Summary",
    description: "Overall financial performance",
    icon: FileSpreadsheet,
  },
];

const recentExports = [
  { id: 1, name: "Royalty_Report_Nov2024.xlsx", date: "2024-11-20", size: "2.4 MB" },
  { id: 2, name: "Streaming_Report_Q3.pdf", date: "2024-10-15", size: "1.8 MB" },
  { id: 3, name: "Annual_Summary_2024.xlsx", date: "2024-10-01", size: "4.2 MB" },
];

const comparisonData = [
  {
    month: "Jul",
    mlc: 12500,
    distributor: 10200,
  },
  {
    month: "Aug",
    mlc: 14200,
    distributor: 11800,
  },
  {
    month: "Sep",
    mlc: 13800,
    distributor: 12100,
  },
  {
    month: "Oct",
    mlc: 15600,
    distributor: 13500,
  },
  {
    month: "Nov",
    mlc: 16800,
    distributor: 14200,
  },
];

const distributorComparison = [
  { name: "Spotify", mlc: 3200, distributor: 2800, difference: 400 },
  { name: "Apple Music", mlc: 2100, distributor: 1950, difference: 150 },
  { name: "YouTube", mlc: 1800, distributor: 1600, difference: 200 },
  { name: "Amazon", mlc: 900, distributor: 750, difference: 150 },
];

export default function ReportsExports() {
  const [activeTab, setActiveTab] = useState("reports");

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-reports-exports">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-reports-exports-title">
            Reports & Exports
          </h1>
          <p className="text-muted-foreground mt-1">Generate and download detailed reports and export data</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border" data-testid="tabs-reports">
            <TabsTrigger value="reports" data-testid="tab-reports">
              Reports
            </TabsTrigger>
            <TabsTrigger value="comparison" data-testid="tab-comparison">
              MLC vs Distributor
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <Card key={report.id} className="bg-card border-border hover:border-primary/40 transition-all">
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
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/40 transition-colors"
                      data-testid={`row-export-${file.id}`}
                    >
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
          </TabsContent>

          {/* MLC vs Distributor Tab */}
          <TabsContent value="comparison" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="MLC Total (6mo)"
                value="$78,900"
                trend="up"
                trendValue="+12.5%"
              />
              <MetricCard
                title="Distributor Total (6mo)"
                value="$64,150"
                trend="up"
                trendValue="+8.3%"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Earnings Comparison Over Time */}
              <ChartCard title="MLC vs Distributor - Earnings Over Time">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                    <XAxis dataKey="month" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                    <YAxis stroke="hsl(0, 0%, 70%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 12%)",
                        border: "1px solid hsl(0, 0%, 18%)",
                        borderRadius: "6px",
                        color: "hsl(0, 0%, 95%)",
                      }}
                      formatter={(value) => `$${value}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mlc"
                      stroke="hsl(141, 76%, 48%)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "hsl(141, 76%, 48%)" }}
                      name="MLC"
                    />
                    <Line
                      type="monotone"
                      dataKey="distributor"
                      stroke="hsl(270, 85%, 60%)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "hsl(270, 85%, 60%)" }}
                      name="Distributor"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Platform Breakdown */}
              <ChartCard title="Revenue by DSP - MLC vs Distributor">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={distributorComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                    <XAxis dataKey="name" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                    <YAxis stroke="hsl(0, 0%, 70%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 12%)",
                        border: "1px solid hsl(0, 0%, 18%)",
                        borderRadius: "6px",
                        color: "hsl(0, 0%, 95%)",
                      }}
                      formatter={(value) => `$${value}`}
                    />
                    <Legend />
                    <Bar dataKey="mlc" fill="hsl(141, 76%, 48%)" name="MLC" />
                    <Bar dataKey="distributor" fill="hsl(270, 85%, 60%)" name="Distributor" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Detailed Comparison Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Detailed Comparison by Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">Platform</th>
                        <th className="text-right py-3 px-3 text-muted-foreground font-medium">MLC</th>
                        <th className="text-right py-3 px-3 text-muted-foreground font-medium">Distributor</th>
                        <th className="text-right py-3 px-3 text-muted-foreground font-medium">Difference</th>
                        <th className="text-right py-3 px-3 text-muted-foreground font-medium">% Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributorComparison.map((row, idx) => {
                        const variance = ((row.difference / row.distributor) * 100).toFixed(1);
                        return (
                          <tr
                            key={idx}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                            data-testid={`row-comparison-${row.name.toLowerCase()}`}
                          >
                            <td className="py-3 px-3 text-foreground font-medium">{row.name}</td>
                            <td className="text-right py-3 px-3 text-foreground">${row.mlc.toLocaleString()}</td>
                            <td className="text-right py-3 px-3 text-foreground">${row.distributor.toLocaleString()}</td>
                            <td className="text-right py-3 px-3 text-primary font-medium">${row.difference}</td>
                            <td className="text-right py-3 px-3 text-primary font-medium">{variance}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
