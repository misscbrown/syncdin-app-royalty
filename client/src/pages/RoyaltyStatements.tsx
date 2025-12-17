import { useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, TrendingUp, Download, DollarSign, Upload, 
  FileText, Music, Globe, Calendar, Loader2, PoundSterling
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import ChartCard from "@/components/ChartCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { PrsStatement, WorkWithStats, PerformanceRoyalty } from "@shared/schema";

const CHART_COLORS = ["hsl(141, 76%, 48%)", "hsl(270, 85%, 60%)", "hsl(200, 50%, 50%)", "hsl(43, 96%, 58%)", "hsl(0, 70%, 50%)"];

interface SummaryData {
  totalStatements: number;
  totalWorks: number;
  totalRoyalties: string;
  totalPerformances: number;
  territoryBreakdown: Record<string, { count: number; royalties: number }>;
  latestStatement: PrsStatement | null;
}

export default function RoyaltyStatements() {
  const [activeTab, setActiveTab] = useState("prs-statements");
  const [isUploading, setIsUploading] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: statements = [], isLoading: statementsLoading } = useQuery<PrsStatement[]>({
    queryKey: ['/api/prs-statements'],
  });

  const { data: works = [], isLoading: worksLoading } = useQuery<WorkWithStats[]>({
    queryKey: ['/api/works'],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ['/api/performance-royalties/summary'],
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (statementPeriod) {
      formData.append('statementPeriod', statementPeriod);
    }

    try {
      const response = await fetch('/api/prs-statements/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Statement uploaded successfully",
        description: `Processed ${result.worksProcessed} works, ${result.entriesProcessed} entries, £${result.totalRoyalties} total`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/prs-statements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/works'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance-royalties/summary'] });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setStatementPeriod("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const territoryData = summary?.territoryBreakdown 
    ? Object.entries(summary.territoryBreakdown)
        .map(([name, data]) => ({ 
          name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
          fullName: name,
          value: data.royalties,
          count: data.count 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  const totalRoyalties = parseFloat(summary?.totalRoyalties || '0');

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-royalty-statements">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-statements-title">
              Royalties & Earnings
            </h1>
            <p className="text-muted-foreground mt-1">
              View PRS performance royalty statements and collection society data
            </p>
          </div>
          <Button variant="outline" data-testid="button-export-all">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border" data-testid="tabs-royalty">
            <TabsTrigger value="prs-statements" data-testid="tab-prs-statements">
              PRS Statements
            </TabsTrigger>
            <TabsTrigger value="works" data-testid="tab-works">
              Works Library
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* PRS Statements Tab */}
          <TabsContent value="prs-statements" className="space-y-6 mt-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total PRS Statements"
                value={String(summary?.totalStatements || 0)}
                trend="neutral"
                trendValue="Uploaded"
              />
              <MetricCard
                title="Total Works"
                value={String(summary?.totalWorks || 0)}
                trend="neutral"
                trendValue="Registered"
              />
              <MetricCard
                title="Total Royalties"
                value={`£${totalRoyalties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                trend="up"
                trendValue="GBP"
              />
              <MetricCard
                title="Total Performances"
                value={(summary?.totalPerformances || 0).toLocaleString()}
                trend="neutral"
                trendValue="Broadcast"
              />
            </div>

            {/* Upload Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload PRS Statement
                </CardTitle>
                <CardDescription>
                  Upload a CSV export from your PRS statement. The system will parse work titles, territories, and royalty amounts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="period">Statement Period (optional)</Label>
                    <Input
                      id="period"
                      placeholder="e.g., 2024 Q3"
                      value={statementPeriod}
                      onChange={(e) => setStatementPeriod(e.target.value)}
                      data-testid="input-statement-period"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="file">CSV File</Label>
                    <Input
                      ref={fileInputRef}
                      id="file"
                      type="file"
                      accept=".csv"
                      onChange={handleUpload}
                      disabled={isUploading}
                      data-testid="input-prs-file"
                    />
                  </div>
                  {isUploading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statements List */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Uploaded Statements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statementsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : statements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No PRS statements uploaded yet</p>
                    <p className="text-sm mt-1">Upload a CSV file above to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Works</TableHead>
                        <TableHead>Total Royalties</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statements.map((statement) => (
                        <TableRow key={statement.id} data-testid={`row-statement-${statement.id}`}>
                          <TableCell className="font-medium">{statement.originalName}</TableCell>
                          <TableCell>{statement.statementPeriod || '-'}</TableCell>
                          <TableCell>{statement.workCount || 0}</TableCell>
                          <TableCell>£{parseFloat(statement.totalRoyalties || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Badge variant={statement.status === 'completed' ? 'default' : 'secondary'}>
                              {statement.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(statement.uploadedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Works Library Tab */}
          <TabsContent value="works" className="space-y-6 mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  Registered Works
                </CardTitle>
                <CardDescription>
                  All musical works from your PRS statements with aggregated performance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {worksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : works.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No works registered yet</p>
                    <p className="text-sm mt-1">Upload a PRS statement to add works</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Work No</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Writers</TableHead>
                        <TableHead>Your Share</TableHead>
                        <TableHead>Performances</TableHead>
                        <TableHead>Territories</TableHead>
                        <TableHead className="text-right">Total Royalties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {works.map((work) => (
                        <TableRow key={work.id} data-testid={`row-work-${work.id}`}>
                          <TableCell className="font-mono text-sm">{work.workNo}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{work.title}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground">
                            {[work.ip1, work.ip2, work.ip3, work.ip4].filter(Boolean).join(', ') || '-'}
                          </TableCell>
                          <TableCell>
                            {work.yourSharePercent ? `${work.yourSharePercent}%` : '-'}
                          </TableCell>
                          <TableCell>{(work.totalPerformances || 0).toLocaleString()}</TableCell>
                          <TableCell>{work.territoriesCount || 0}</TableCell>
                          <TableCell className="text-right font-medium">
                            £{parseFloat(work.totalRoyalties || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : territoryData.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No analytics data available</p>
                    <p className="text-sm mt-1">Upload PRS statements to see territory breakdowns</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Territory Breakdown Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartCard title="Royalties by Territory">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={territoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
                        <XAxis type="number" stroke="hsl(0, 0%, 70%)" fontSize={12} />
                        <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 70%)" fontSize={11} width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(0, 0%, 12%)",
                            border: "1px solid hsl(0, 0%, 18%)",
                            borderRadius: "6px",
                            color: "hsl(0, 0%, 95%)",
                          }}
                          formatter={(value: number) => [`£${value.toFixed(2)}`, 'Royalties']}
                          labelFormatter={(label) => territoryData.find(t => t.name === label)?.fullName || label}
                        />
                        <Bar dataKey="value" fill="hsl(270, 85%, 60%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Territory Distribution">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={territoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {territoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(0, 0%, 12%)",
                            border: "1px solid hsl(0, 0%, 18%)",
                            borderRadius: "6px",
                            color: "hsl(0, 0%, 95%)",
                          }}
                          formatter={(value: number) => `£${value.toFixed(2)}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Top Works by Royalties */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Top Earning Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {works.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No works data available</p>
                    ) : (
                      <div className="space-y-3">
                        {works.slice(0, 5).map((work, index) => (
                          <div 
                            key={work.id} 
                            className="flex items-center justify-between p-3 rounded-md bg-background/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-muted-foreground w-6">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium">{work.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {work.totalPerformances?.toLocaleString() || 0} performances
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">
                                £{parseFloat(work.totalRoyalties || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {work.territoriesCount || 0} territories
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
