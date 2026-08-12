"use client";

import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DailyPnl } from "@/lib/metrics/calculate";
import { formatMoney } from "@/lib/utils/format";
import { useChartPalette } from "./ChartTheme";

const MONTH_LABELS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function monthRange(month: string): [string, string] {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return [`${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`];
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Single-month, large-format PnL calendar with prev/next navigation — the
 * dashboard's primary view. Unlike the compact multi-month overview, values
 * are printed directly on each cell rather than relying on hover-only
 * tooltips. Independent of the dashboard's timeframe filter (`dailyPnl` is
 * expected to be the full, unfiltered-by-date history) so navigation always
 * works regardless of which timeframe preset is selected elsewhere. */
export function MonthHeroCalendar({ dailyPnl }: { dailyPnl: DailyPnl[] }) {
  const palette = useChartPalette();
  const defaultMonth = dailyPnl.length > 0 ? dailyPnl[dailyPnl.length - 1].date.slice(0, 7) : new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(defaultMonth);

  const [rangeStart, rangeEnd] = monthRange(month);
  const monthData = dailyPnl.filter((d) => d.date >= rangeStart && d.date <= rangeEnd);
  const maxAbs = Math.max(...monthData.map((d) => Math.abs(d.netPnl)), 1);
  const [year, m] = month.split("-").map(Number);
  const monthLabel = `${MONTH_LABELS[m - 1]} ${year}`;
  const netPnlThisMonth = monthData.reduce((sum, d) => sum + d.netPnl, 0);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: palette.surface,
      borderColor: palette.gridLine,
      textStyle: { color: palette.textPrimary },
      extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;",
      formatter: (params: { data: [string, number] }) => {
        const [date, value] = params.data;
        return `${date}<br/><strong>${formatMoney(value)}</strong>`;
      },
    },
    visualMap: {
      min: -maxAbs,
      max: maxAbs,
      show: false,
      inRange: { color: [palette.negative, "#88867e", palette.positive] },
    },
    calendar: {
      range: [rangeStart, rangeEnd],
      cellSize: ["auto", 56],
      itemStyle: { borderColor: palette.surface, borderWidth: 3, color: palette.gridLine },
      dayLabel: { color: palette.textMuted, nameMap: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] },
      monthLabel: { show: false },
      yearLabel: { show: false },
      splitLine: { lineStyle: { color: palette.axisLine } },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: monthData.map((d) => [d.date, d.netPnl]),
        label: {
          show: true,
          formatter: (p: { data: [string, number] }) =>
            p.data[1] === 0 ? "" : formatMoney(p.data[1]),
          color: palette.textPrimary,
          fontSize: 11,
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={() => setMonth(shiftMonth(month, -1))}>
          <ChevronLeftIcon />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-medium">{monthLabel}</span>
          <span className={`text-sm font-medium ${netPnlThisMonth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatMoney(netPnlThisMonth)}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setMonth(shiftMonth(month, 1))}>
          <ChevronRightIcon />
        </Button>
      </div>
      <ReactECharts option={option} style={{ height: 280 }} notMerge />
    </div>
  );
}
