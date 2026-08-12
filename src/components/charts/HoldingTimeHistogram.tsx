"use client";

import ReactECharts from "echarts-for-react";
import type { HistogramBucket } from "@/lib/metrics/calculate";
import { formatDuration } from "@/lib/utils/format";
import { baseChartOption, useChartPalette } from "./ChartTheme";

/** Holding-time distribution — a dedicated clone of WinLossHistogram rather
 * than a reuse: that component colors bars by netPnl sign, which has no
 * meaning for a duration axis (always non-negative), so bars here use one
 * neutral color and duration-formatted labels instead. */
export function HoldingTimeHistogram({ data }: { data: HistogramBucket[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
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
      data: data.map((b) => `${formatDuration(b.rangeStart)} – ${formatDuration(b.rangeEnd)}`),
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
        data: data.map((b) => b.count),
        itemStyle: { color: palette.categorical[0], borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 24,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 240 }} notMerge />;
}
