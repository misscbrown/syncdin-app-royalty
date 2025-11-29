import React from "react";

interface ChartCardProps {
  title: string;
  data?: number[];
  color?: string;
}

export default function ChartCard({ title, data = [], color = "var(--chart-1)" }: ChartCardProps) {
  return (
    <div className="p-4 rounded-lg shadow-md" style={{ backgroundColor: "var(--card)" }}>
      <h3 className="text-lg font-medium mb-2" style={{ color: "var(--card-foreground)" }}>{title}</h3>
      <div className="h-40">
        {/* Chart.js / Recharts */}
        {/* Use color prop for chart lines */}
      </div>
    </div>
  );
}
