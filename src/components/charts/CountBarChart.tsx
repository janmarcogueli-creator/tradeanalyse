"use client";

import ReactECharts from "echarts-for-react";
import { baseChartOption, useChartPalette } from "./ChartTheme";

export interface CountBar {
  label: string;
  count: number;
}

/** Neutral horizontal bar for count-based rankings (e.g. most-traded
 * symbols) — unlike GroupPerformanceChart, values here aren't a win/loss
 * amount, so bars use a single neutral color instead of sign-coloring. */
export function CountBarChart({ data }: { data: CountBar[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
  }

  const option = {
    ...baseChartOption(palette),
    tooltip: { ...baseChartOption(palette).tooltip, trigger: "item" },
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
        data: data.map((d) => d.count).reverse(),
        itemStyle: { color: palette.categorical[0], borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 20,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: Math.max(140, data.length * 32) }} notMerge />;
}
