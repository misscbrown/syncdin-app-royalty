import React from "react";

interface ChartCardProps {
  title: string;
  children?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="h-48 flex items-center justify-center text-gray-400">
        {children || "Chart / Table Placeholder"}
      </div>
    </div>
  );
};

export default ChartCard;
