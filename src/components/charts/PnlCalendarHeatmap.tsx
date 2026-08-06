"use client";

import ReactECharts from "echarts-for-react";
import type { DailyPnl } from "@/lib/metrics/calculate";
import { useChartPalette } from "./ChartTheme";

export function PnlCalendarHeatmap({ data }: { data: DailyPnl[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten für den PnL-Kalender.</p>;
  }

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.netPnl)), 1);
  const range: [string, string] = [data[0].date, data[data.length - 1].date];

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: palette.surface,
      borderColor: palette.gridLine,
      textStyle: { color: palette.textPrimary },
      extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;",
      formatter: (params: { data: [string, number] }) => {
        const [date, value] = params.data;
        const formatted = value.toLocaleString("de-DE", { style: "currency", currency: "USD" });
        return `${date}<br/><strong>${formatted}</strong>`;
      },
    },
    visualMap: {
      min: -maxAbs,
      max: maxAbs,
      show: false,
      inRange: { color: [palette.negative, "#88867e", palette.positive] },
    },
    calendar: {
      range,
      cellSize: [16, 16],
      itemStyle: { borderColor: palette.surface, borderWidth: 2, color: palette.gridLine },
      dayLabel: {
        color: palette.textMuted,
        nameMap: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      },
      monthLabel: {
        color: palette.textMuted,
        nameMap: [
          "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
          "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
        ],
      },
      yearLabel: { show: false },
      splitLine: { lineStyle: { color: palette.axisLine } },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: data.map((d) => [d.date, d.netPnl]),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 200 }} notMerge />;
}
