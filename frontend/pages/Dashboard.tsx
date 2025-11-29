import React from "react";
import Navigation from "../components/Navigation";
import MetricCard from "../components/MetricCard";
import ChartCard from "../components/ChartCard";
import { Link } from "wouter";

const Dashboard: React.FC = () => {
  // placeholder metrics
  const metrics = [
    { title: "Total Streams", value: "1,234,567" },
    { title: "Total Royalties Earned", value: "$12,345" },
    { title: "Unmatched Metadata", value: "24" },
    { title: "Missing Royalties", value: "5" },
    { title: "Flagged Royalties", value: "3" },
    { title: "New Metadata Matches", value: "7" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-xl font-bold mb-6">Dashboard Menu</h2>
        <nav className="flex flex-col gap-3">
          <Link href="/" className="hover:text-blue-600">Dashboard</Link>
          <Link href="/upload-tracks" className="hover:text-blue-600">Upload Tracks</Link>
          <Link href="/royalty-statements" className="hover:text-blue-600">Royalty Statements</Link>
          <Link href="/metadata-matching" className="hover:text-blue-600">Metadata Matching</Link>
          <Link href="/missing-royalties" className="hover:text-blue-600">Missing Royalties</Link>
          <Link href="/playback-analytics" className="hover:text-blue-600">Playback Analytics</Link>
          <Link href="/reports-exports" className="hover:text-blue-600">Reports & Exports</Link>
          <Link href="/settings" className="hover:text-blue-600">Settings</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <Navigation />

        {/* Dashboard Content */}
        <main className="p-6 flex-1 overflow-y-auto">
          <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} title={metric.title} value={metric.value} />
            ))}
          </div>

          {/* Charts / Tables */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChartCard title="Playback Frequency" />
            <ChartCard title="Missing Metadata Stats" />
            <ChartCard title="Royalty Gap Estimation" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

