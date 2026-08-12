"use client";

import ReactECharts from "echarts-for-react";
import { useChartPalette } from "./ChartTheme";
import type { GroupMetrics } from "@/lib/metrics/buildDashboardPayload";
import type { MetricsResult } from "@/lib/metrics/types";

const AXES: { key: keyof MetricsResult; name: string }[] = [
  { key: "winrate", name: "Winrate" },
  { key: "profitFactor", name: "Profit Factor" },
  { key: "expectancy", name: "Expectancy" },
  { key: "rrRatio", name: "R:R" },
];

// Radar axes can't represent negative values sensibly (the shape would fold
// back through the center) — expectancy in particular can be negative for a
// losing strategy, so it's floored at 0 for this chart specifically. The
// bar chart next to it still shows the true signed netPnl.
function axisValue(metrics: MetricsResult, key: keyof MetricsResult): number {
  const v = metrics[key];
  return typeof v === "number" ? Math.max(v, 0) : 0;
}

/** Compares the top strategies (by netPnl) across Winrate/Profit Factor/
 * Expectancy/R:R on one radar — each axis is scaled to the max among the
 * shown strategies, not a fixed range, since these metrics have very
 * different natural scales. */
export function StrategyRadarChart({ groups }: { groups: GroupMetrics[] }) {
  const palette = useChartPalette();
  const top = groups.slice(0, 6);

  if (top.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
  }

  const indicator = AXES.map(({ key, name }) => ({
    name,
    max: Math.max(...top.map((g) => axisValue(g.metrics, key)), 0.01),
  }));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: palette.surface,
      borderColor: palette.gridLine,
      textStyle: { color: palette.textPrimary },
      extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;",
    },
    legend: {
      data: top.map((g) => g.label),
      textStyle: { color: palette.textSecondary },
      bottom: 0,
      type: "scroll",
    },
    radar: {
      indicator,
      axisName: { color: palette.textSecondary },
      splitLine: { lineStyle: { color: palette.gridLine } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: palette.axisLine } },
    },
    series: [
      {
        type: "radar",
        data: top.map((g, i) => ({
          name: g.label,
          value: AXES.map(({ key }) => axisValue(g.metrics, key)),
          lineStyle: { color: palette.categorical[i % palette.categorical.length] },
          itemStyle: { color: palette.categorical[i % palette.categorical.length] },
          areaStyle: { opacity: 0.08 },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 320 }} notMerge />;
}
