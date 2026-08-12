"use client";

import ReactECharts from "echarts-for-react";
import type { WeekdayHourBreakdown } from "@/lib/metrics/calculate";
import { formatMoney } from "@/lib/utils/format";
import { baseChartOption, useChartPalette } from "./ChartTheme";

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const HOURS = Array.from({ length: 24 }, (_, h) => `${h}:00`);

/** "Best time to trade" heatmap: net PnL by weekday x hour-of-day. Cells
 * with zero trades render as an empty/neutral color rather than green — a
 * cell with no data is not the same as a break-even cell. */
export function WeekdayHourHeatmap({ data }: { data: WeekdayHourBreakdown[] }) {
  const palette = useChartPalette();

  const withTrades = data.filter((d) => d.tradeCount > 0);
  if (withTrades.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
  }
  const maxAbs = Math.max(...withTrades.map((d) => Math.abs(d.netPnl)), 1);

  const option = {
    ...baseChartOption(palette),
    tooltip: {
      ...baseChartOption(palette).tooltip,
      formatter: (p: { data: [number, number, number]; value: [number, number, number] }) => {
        const [hourIdx, weekdayIdx] = p.data;
        const cell = data.find((d) => d.hour === hourIdx && d.weekday === weekdayIdx);
        if (!cell || cell.tradeCount === 0) return `${WEEKDAYS[weekdayIdx]} ${HOURS[hourIdx]}<br/>Keine Trades`;
        return `${WEEKDAYS[weekdayIdx]} ${HOURS[hourIdx]}<br/><strong>${formatMoney(cell.netPnl)}</strong> (${cell.tradeCount} Trades)`;
      },
    },
    grid: { left: 40, right: 16, top: 8, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: HOURS,
      axisLabel: { color: palette.textMuted, fontSize: 10, interval: 1 },
      splitArea: { show: false },
    },
    yAxis: {
      type: "category",
      data: WEEKDAYS,
      axisLabel: { color: palette.textSecondary },
      splitArea: { show: false },
    },
    visualMap: {
      min: -maxAbs,
      max: maxAbs,
      show: false,
      inRange: { color: [palette.negative, palette.gridLine, palette.positive] },
    },
    series: [
      {
        type: "heatmap",
        data: data.map((d) => [d.hour, d.weekday, d.tradeCount === 0 ? null : d.netPnl]),
        itemStyle: { borderColor: palette.surface, borderWidth: 1 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220 }} notMerge />;
}
