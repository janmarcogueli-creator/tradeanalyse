"use client";

import ReactECharts from "echarts-for-react";
import type { DrawdownPoint } from "@/lib/metrics/types";
import { baseChartOption, useChartPalette } from "./ChartTheme";

export function DrawdownChart({ data }: { data: DrawdownPoint[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten für den Drawdown-Chart.</p>;
  }

  // Explicit min alongside max:0 — otherwise ECharts treats an all-zero
  // series (no drawdown at all) as a degenerate axis and pads it upward
  // past zero instead of downward, putting 0 at the bottom instead of the top.
  const minValue = Math.min(...data.map((p) => p.drawdownPercent), -1);

  const option = {
    ...baseChartOption(palette),
    tooltip: {
      ...baseChartOption(palette).tooltip,
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: palette.axisLine } },
      valueFormatter: (value: number) => `${value.toFixed(1)}%`,
    },
    xAxis: {
      type: "category",
      data: data.map((p) => p.date),
      axisLabel: { color: palette.textMuted, formatter: (v: string) => v.slice(0, 10) },
      axisLine: { lineStyle: { color: palette.axisLine } },
    },
    yAxis: {
      type: "value",
      min: minValue,
      max: 0,
      axisLabel: { color: palette.textMuted, formatter: "{value}%" },
      splitLine: { lineStyle: { color: palette.gridLine } },
    },
    series: [
      {
        name: "Drawdown",
        type: "line",
        data: data.map((p) => p.drawdownPercent),
        showSymbol: false,
        lineStyle: { width: 2, color: palette.negative },
        areaStyle: { color: palette.negative, opacity: 0.15 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220 }} notMerge />;
}
