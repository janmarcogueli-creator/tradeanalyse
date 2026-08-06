"use client";

import ReactECharts from "echarts-for-react";
import { baseChartOption, useChartPalette } from "./ChartTheme";

export interface GroupBar {
  label: string;
  netPnl: number;
}

/** Shared horizontal bar renderer for netPnl-by-group charts (strategy, asset
 * class, symbol) — bars colored by sign, sorted order preserved from the caller. */
export function GroupPerformanceChart({ data }: { data: GroupBar[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
  }

  const option = {
    ...baseChartOption(palette),
    tooltip: {
      ...baseChartOption(palette).tooltip,
      trigger: "item",
      valueFormatter: (value: number) =>
        value.toLocaleString("de-DE", { style: "currency", currency: "USD" }),
    },
    xAxis: {
      type: "value",
      axisLabel: { color: palette.textMuted },
      splitLine: { lineStyle: { color: palette.gridLine } },
    },
    yAxis: {
      type: "category",
      data: data.map((d) => d.label).reverse(),
      axisLabel: { color: palette.textSecondary },
      axisLine: { lineStyle: { color: palette.axisLine } },
    },
    series: [
      {
        type: "bar",
        data: data
          .map((d) => ({
            value: d.netPnl,
            // Rounded data-end, square baseline — the round corner sits on
            // whichever side the bar actually extends toward from zero.
            itemStyle: {
              color: d.netPnl >= 0 ? palette.positive : palette.negative,
              borderRadius: d.netPnl >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
            },
          }))
          .reverse(),
        barMaxWidth: 20,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: Math.max(140, data.length * 32) }} notMerge />;
}
