"use client";

import ReactECharts from "echarts-for-react";
import type { EquityPoint } from "@/lib/metrics/types";
import { baseChartOption, useChartPalette } from "./ChartTheme";

export function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten für die Equity Curve.</p>;
  }

  const option = {
    ...baseChartOption(palette),
    tooltip: {
      ...baseChartOption(palette).tooltip,
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: palette.axisLine } },
      valueFormatter: (value: number) =>
        value.toLocaleString("de-DE", { style: "currency", currency: "USD" }),
    },
    legend: {
      data: ["Netto", "Brutto"],
      top: 0,
      textStyle: { color: palette.textSecondary },
    },
    xAxis: {
      type: "category",
      data: data.map((p) => p.date),
      axisLabel: { color: palette.textMuted, formatter: (v: string) => v.slice(0, 10) },
      axisLine: { lineStyle: { color: palette.axisLine } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: palette.textMuted },
      splitLine: { lineStyle: { color: palette.gridLine } },
    },
    series: [
      {
        name: "Netto",
        type: "line",
        data: data.map((p) => p.cumulativeNet),
        showSymbol: false,
        lineStyle: { width: 2, color: palette.categorical[0] },
        areaStyle: { color: palette.categorical[0], opacity: 0.1 },
      },
      {
        name: "Brutto",
        type: "line",
        data: data.map((p) => p.cumulativeGross),
        showSymbol: false,
        lineStyle: { width: 2, color: palette.categorical[1], type: "dashed" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280 }} notMerge />;
}
