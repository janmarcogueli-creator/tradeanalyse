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

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ISO 8601 week number (Monday-based, week 1 contains the year's first
 * Thursday) — the "KW" convention used in DE. */
function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface WeekRow {
  weekStart: string;
  isoWeek: number;
  netPnl: number;
  tradeCount: number;
}

/** Rolls daily PnL up into ISO calendar weeks touching [rangeStart,
 * rangeEnd] — using the full (unfiltered) daily history so a week
 * straddling a month boundary still totals correctly, not just the days
 * that happen to fall inside the displayed month. */
function computeWeekRows(dailyPnl: DailyPnl[], rangeStart: string, rangeEnd: string): WeekRow[] {
  const byDate = new Map(dailyPnl.map((d) => [d.date, d]));
  const weekStarts = new Set<string>();
  const cursor = new Date(rangeStart);
  const end = new Date(rangeEnd);
  while (cursor <= end) {
    weekStarts.add(toIsoDate(mondayOf(cursor)));
    cursor.setDate(cursor.getDate() + 1);
  }

  return Array.from(weekStarts)
    .sort()
    .map((weekStartStr) => {
      const weekStart = new Date(weekStartStr);
      let netPnl = 0;
      let tradeCount = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const entry = byDate.get(toIsoDate(d));
        if (entry) {
          netPnl += entry.netPnl;
          tradeCount += entry.tradeCount;
        }
      }
      return { weekStart: weekStartStr, isoWeek: isoWeekNumber(weekStart), netPnl, tradeCount };
    });
}

/** Single-month, large-format PnL calendar with prev/next navigation — the
 * dashboard's primary view. Unlike the compact multi-month overview, values
 * are printed directly on each cell rather than relying on hover-only
 * tooltips. Independent of the dashboard's timeframe filter (`dailyPnl` is
 * expected to be the full, unfiltered-by-date history) so navigation always
 * works regardless of which timeframe preset is selected elsewhere. Below
 * the grid, a row of per-ISO-week totals (KW, result, trade count) gives the
 * weekly rollup the daily grid alone doesn't show. */
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
  const weekRows = computeWeekRows(dailyPnl, rangeStart, rangeEnd);

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
      <div className="flex flex-wrap gap-2">
        {weekRows.map((w) => (
          <div key={w.weekStart} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm">
            <span className="text-muted-foreground">KW {w.isoWeek}</span>
            <span className={`font-medium ${w.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatMoney(w.netPnl)}
            </span>
            <span className="text-muted-foreground">
              {w.tradeCount} Trade{w.tradeCount === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
