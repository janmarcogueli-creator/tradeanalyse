"use client";

import ReactECharts from "echarts-for-react";
import type { HistogramBucket } from "@/lib/metrics/calculate";
import { baseChartOption, useChartPalette } from "./ChartTheme";

export function WinLossHistogram({ data }: { data: HistogramBucket[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten für die Verteilung.</p>;
  }

  const option = {
    ...baseChartOption(palette),
    tooltip: {
      ...baseChartOption(palette).tooltip,
      trigger: "item",
      formatter: (p: { name: string; value: number }) => `${p.name}<br/><strong>${p.value} Trades</strong>`,
    },
    xAxis: {
      type: "category",
      data: data.map(
        (b) =>
          `${b.rangeStart.toLocaleString("de-DE", { maximumFractionDigits: 0 })} – ${b.rangeEnd.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`,
      ),
      axisLabel: { color: palette.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: palette.axisLine } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: palette.textMuted },
      splitLine: { lineStyle: { color: palette.gridLine } },
    },
    series: [
      {
        type: "bar",
        data: data.map((b) => ({
          value: b.count,
          itemStyle: { color: b.rangeStart >= 0 ? palette.positive : palette.negative },
        })),
        barMaxWidth: 24,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 240 }} notMerge />;
}
