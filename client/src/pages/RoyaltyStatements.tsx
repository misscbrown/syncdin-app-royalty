import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, Download, DollarSign } from "lucide-react";
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

interface DSPEarnings {
  name: string;
  amount: number;
}

interface EarningsOverTime {
  month: string;
  mlc: number;
  distributor: number;
}

interface RecoveryItem {
  id: string;
  title: string;
  count: number;
  amount: number;
}

const dspEarnings: DSPEarnings[] = [
  { name: "Spotify", amount: 3240 },
  { name: "Apple Music", amount: 2180 },
  { name: "YouTube", amount: 1920 },
  { name: "Amazon Music", amount: 1540 },
  { name: "Others", amount: 1120 },
];

const earningsOverTime: EarningsOverTime[] = [
  { month: "Aug", mlc: 1850, distributor: 2100 },
  { month: "Sep", mlc: 2100, distributor: 1920 },
  { month: "Oct", mlc: 2340, distributor: 2180 },
  { month: "Nov", mlc: 2650, distributor: 2450 },
];

const recoveryItems: RecoveryItem[] = [
  { id: "1", title: "MLC Black Box Royalties", count: 1240, amount: 15600 },
  {
    id: "2",
    title: "Unregistered but Generating Revenue",
    count: 340,
    amount: 8420,
  },
  { id: "3", title: "Mismatched Statements", count: 180, amount: 4250 },
  { id: "4", title: "Incomplete Metadata Blocks", count: 520, amount: 6890 },
];

const territoryData = [
  { name: "US", value: 4200, percentage: 35 },
  { name: "UK", value: 2100, percentage: 17.5 },
  { name: "EU", value: 2800, percentage: 23.3 },
  { name: "APAC", value: 1900, percentage: 15.8 },
  { name: "Other", value: 800, percentage: 6.7 },
];

const CHART_COLORS = ["hsl(141, 76%, 48%)", "hsl(270, 85%, 60%)", "hsl(200, 50%, 50%)", "hsl(43, 96%, 58%)"];

export default function RoyaltyStatements() {
  const [activeTab, setActiveTab] = useState("financials");

  const totalMechanicalEarnings = 12000;
  const totalDistributorEarnings = 9650;
  const totalRecoverable = 35160;

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-royalty-statements">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-statements-title">
              Royalties & Earnings
            </h1>
            <p className="text-muted-foreground mt-1">
              View combined MLC and distributor financial data
            </p>
          </div>
          <Button variant="outline" data-testid="button-export-all">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border" data-testid="tabs-royalty">
            <TabsTrigger value="financials" data-testid="tab-financials">
              Financial Overview
            </TabsTrigger>
            <TabsTrigger value="recovery" data-testid="tab-recovery">
              Royalty Recovery
            </TabsTrigger>
          </TabsList>

          {/* Financial Overview Tab */}
          <TabsContent value="financials" className="space-y-6 mt-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Mechanical Earnings"
                value={`$${totalMechanicalEarnings.toLocaleString()}`}
                trend="up"
                trendValue="+8.2%"
              />
              <MetricCard
                title="Distributor Earnings"
                value={`$${totalDistributorEarnings.toLocaleString()}`}
                trend="up"
                trendValue="+5.4%"
              />
              <MetricCard
                title="Combined Total"
                value={`$${(totalMechanicalEarnings + totalDistributorEarnings).toLocaleString()}`}
                trend="up"
                trendValue="+6.9%"
              />
              <MetricCard
                title="Recoverable Amount"
                value={`$${totalRecoverable.toLocaleString()}`}
                trend="neutral"
                trendValue="Potential"
                isFlagged={true}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Earnings by DSP */}
              <ChartCard title="Earnings by Digital Service Provider">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dspEarnings}>
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
                    />
                    <Bar dataKey="amount" fill="hsl(141, 76%, 48%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Territory Breakdown */}
              <ChartCard title="Territory Breakdown">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={territoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
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
                      formatter={(value) => `$${value}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Earnings Over Time */}
              <ChartCard title="Earnings Over Time">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={earningsOverTime}>
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
            </div>
          </TabsContent>

          {/* Royalty Recovery Tab */}
          <TabsContent value="recovery" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recoveryItems.map((item) => (
                <Card
                  key={item.id}
                  className="bg-card border-border hover:border-purple-bold/40 transition-colors"
                  data-testid={`card-recovery-${item.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {item.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.count.toLocaleString()} items
                        </p>
                      </div>
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          ${item.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Potential recovery amount</p>
                      </div>
                      <Button className="w-full" size="sm" data-testid={`button-investigate-${item.id}`}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Investigate & Recover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Total Recoverable Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Estimated recoverable royalties:</p>
                    <p className="text-4xl font-bold text-primary">
                      ${totalRecoverable.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These are royalties that may be owed to you based on unmatched metadata,
                    incomplete information, and mismatched statements. Our recovery process helps
                    identify and claim these amounts.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button variant="outline" data-testid="button-generate-recovery-report">
                      Generate Report
                    </Button>
                    <Button data-testid="button-start-recovery">
                      Start Recovery Process
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
