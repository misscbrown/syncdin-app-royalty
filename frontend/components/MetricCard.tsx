import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  cardColor?: string;
  textColor?: string;
}

export default function MetricCard({ title, value, cardColor, textColor }: MetricCardProps) {
  return (
    <div className="p-4 rounded-lg shadow-md" style={{ backgroundColor: cardColor, color: textColor }}>
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

