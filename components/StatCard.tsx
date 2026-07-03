import React from "react";

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "blue" | "green" | "amber" | "red" | "gray";
}> = ({ label, value, icon: Icon, tone = "blue" }) => {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
};
