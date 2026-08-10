"use client";

import ReactECharts from "echarts-for-react";
import type { DailyPnl } from "@/lib/metrics/calculate";
import { useChartPalette } from "./ChartTheme";

function monthStart(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

function monthEnd(isoDate: string): string {
  const [year, month] = isoDate.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this month
  return `${isoDate.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
}

export function PnlCalendarHeatmap({ data }: { data: DailyPnl[] }) {
  const palette = useChartPalette();

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.netPnl)), 1);
  // Always show complete calendar months (padded to the 1st / last day),
  // not just the sparse span the data happens to cover — a heatmap that
  // stops mid-month reads as broken, not as "no more data". With no data at
  // all, still render the current month's empty grid rather than nothing.
  const today = new Date().toISOString().slice(0, 10);
  const firstDate = data[0]?.date ?? today;
  const lastDate = data[data.length - 1]?.date ?? today;
  const range: [string, string] = [monthStart(firstDate), monthEnd(lastDate)];

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
