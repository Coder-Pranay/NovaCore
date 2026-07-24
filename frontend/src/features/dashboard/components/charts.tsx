"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDatum, TimeSeriesDatum } from "@/features/dashboard/types";
import { useTheme } from "@/hooks";
import { cn } from "@/utils";

interface ChartFrameProps {
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
}

function ChartFrame({ isLoading, className, children }: ChartFrameProps) {
  if (isLoading) {
    return <Skeleton className={cn("h-56 w-full rounded-lg", className)} />;
  }

  return <div className={cn("h-56 w-full", className)}>{children}</div>;
}

interface StorageUsageChartProps {
  usedPercent: number;
  usedLabel: string;
  remainingLabel: string;
  isLoading?: boolean;
}

function StorageUsageChartBase({
  usedPercent,
  usedLabel,
  remainingLabel,
  isLoading,
}: StorageUsageChartProps) {
  const { isDark } = useTheme();
  const data: ChartDatum[] = [
    { name: "Used", value: usedPercent, fill: isDark ? "oklch(0.75 0.05 250)" : "oklch(0.45 0.08 250)" },
    {
      name: "Remaining",
      value: Math.max(100 - usedPercent, 0),
      fill: isDark ? "oklch(0.3 0.02 250)" : "oklch(0.9 0.01 250)",
    },
  ];

  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${String(value)}%`, "Share"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-muted-foreground -mt-2 flex justify-center gap-4 text-xs">
        <span>Used: {usedLabel}</span>
        <span>Free: {remainingLabel}</span>
      </div>
    </ChartFrame>
  );
}

interface AssetDistributionChartProps {
  data: ChartDatum[];
  isLoading?: boolean;
}

function AssetDistributionChartBase({
  data,
  isLoading,
}: AssetDistributionChartProps) {
  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill ?? "var(--chart-1)"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

interface UploadsOverTimeChartProps {
  data: TimeSeriesDatum[];
  isLoading?: boolean;
}

function UploadsOverTimeChartBase({
  data,
  isLoading,
}: UploadsOverTimeChartProps) {
  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="count" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export const StorageUsageChart = memo(StorageUsageChartBase);
export const AssetDistributionChart = memo(AssetDistributionChartBase);
export const UploadsOverTimeChart = memo(UploadsOverTimeChartBase);

export const LazyStorageUsageChart = dynamic(
  () => Promise.resolve({ default: StorageUsageChart }),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-lg" /> },
);

export const LazyAssetDistributionChart = dynamic(
  () => Promise.resolve({ default: AssetDistributionChart }),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-lg" /> },
);

export const LazyUploadsOverTimeChart = dynamic(
  () => Promise.resolve({ default: UploadsOverTimeChart }),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-lg" /> },
);
