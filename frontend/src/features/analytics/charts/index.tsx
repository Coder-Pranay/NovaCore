"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import type {
  FileTypeDatum,
  StorageTrendPoint,
  UploadTrendPoint,
} from "@/features/analytics/types";
import { useTheme } from "@/hooks";
import { cn, formatFileSize } from "@/utils";

function ChartFrame({
  isLoading,
  className,
  children,
}: {
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <Skeleton className={cn("h-64 w-full rounded-lg", className)} />;
  }
  return <div className={cn("h-64 w-full", className)}>{children}</div>;
}

function tooltipStyle() {
  return {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
  };
}

function StorageTrendChartBase({
  data,
  isLoading,
}: {
  data: StorageTrendPoint[];
  isLoading?: boolean;
}) {
  const { isDark } = useTheme();
  const stroke = isDark ? "oklch(0.75 0.05 250)" : "oklch(0.45 0.08 250)";

  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => formatFileSize(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle()}
            formatter={(value) => [formatFileSize(Number(value)), "Storage"]}
          />
          <Area
            type="monotone"
            dataKey="bytes"
            stroke={stroke}
            fill={stroke}
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function UploadTrendChartBase({
  data,
  isLoading,
}: {
  data: UploadTrendPoint[];
  isLoading?: boolean;
}) {
  const { isDark } = useTheme();
  const fill = isDark ? "oklch(0.7 0.08 160)" : "oklch(0.5 0.1 160)";

  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle()} />
          <Bar dataKey="count" fill={fill} radius={[6, 6, 0, 0]} name="Uploads" />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function GrowthLineChartBase({
  data,
  isLoading,
}: {
  data: StorageTrendPoint[];
  isLoading?: boolean;
}) {
  const { isDark } = useTheme();
  const stroke = isDark ? "oklch(0.78 0.1 40)" : "oklch(0.55 0.12 40)";

  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => formatFileSize(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle()}
            formatter={(value) => [formatFileSize(Number(value)), "Growth"]}
          />
          <Line
            type="monotone"
            dataKey="bytes"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function FileTypePieChartBase({
  data,
  isLoading,
  donut = false,
}: {
  data: FileTypeDatum[];
  isLoading?: boolean;
  donut?: boolean;
}) {
  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={donut ? 55 : 0}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill ?? "var(--chart-1)"} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle()} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function SpaceUsageBarChartBase({
  data,
  isLoading,
}: {
  data: Array<{ name: string; totalBytes: number }>;
  isLoading?: boolean;
}) {
  const { isDark } = useTheme();
  const fill = isDark ? "oklch(0.72 0.07 280)" : "oklch(0.5 0.09 280)";

  return (
    <ChartFrame isLoading={isLoading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => formatFileSize(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={tooltipStyle()}
            formatter={(value) => [formatFileSize(Number(value)), "Usage"]}
          />
          <Bar dataKey="totalBytes" fill={fill} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export const StorageTrendChart = memo(StorageTrendChartBase);
export const UploadTrendChart = memo(UploadTrendChartBase);
export const GrowthLineChart = memo(GrowthLineChartBase);
export const FileTypePieChart = memo(FileTypePieChartBase);
export const SpaceUsageBarChart = memo(SpaceUsageBarChartBase);

export const LazyStorageTrendChart = dynamic(
  () => Promise.resolve(StorageTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> },
);

export const LazyUploadTrendChart = dynamic(
  () => Promise.resolve(UploadTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> },
);

export const LazyGrowthLineChart = dynamic(
  () => Promise.resolve(GrowthLineChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> },
);

export const LazyFileTypePieChart = dynamic(
  () => Promise.resolve(FileTypePieChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> },
);

export const LazySpaceUsageBarChart = dynamic(
  () => Promise.resolve(SpaceUsageBarChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> },
);
