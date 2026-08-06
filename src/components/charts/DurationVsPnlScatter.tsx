"use client";

import ReactECharts from "echarts-for-react";
import type { DurationPnlPoint } from "@/lib/metrics/buildDashboardPayload";
import { baseChartOption, useChartPalette } from "./ChartTheme";
import { formatDuration } from "@/lib/utils/format";

export function DurationVsPnlScatter({ data }: { data: DurationPnlPoint[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten (Haltedauer fehlt).</p>;
  }

  const option = {
    ...baseChartOption(palette),
    tooltip: {
      ...baseChartOption(palette).tooltip,
      trigger: "item",
      formatter: (p: { data: [number, number, string] }) => {
        const [holdingSeconds, netPnl, symbol] = p.data;
        const money = netPnl.toLocaleString("de-DE", { style: "currency", currency: "USD" });
        return `${symbol}<br/>Haltedauer: ${formatDuration(holdingSeconds)}<br/><strong>${money}</strong>`;
      },
    },
    xAxis: {
      type: "value",
      name: "Haltedauer (Min.)",
      nameTextStyle: { color: palette.textMuted },
      axisLabel: { color: palette.textMuted, formatter: (v: number) => Math.round(v / 60) },
      splitLine: { lineStyle: { color: palette.gridLine } },
    },
    yAxis: {
      type: "value",
      name: "Netto-PnL",
      nameTextStyle: { color: palette.textMuted },
      axisLabel: { color: palette.textMuted },
      splitLine: { lineStyle: { color: palette.gridLine } },
    },
    series: [
      {
        type: "scatter",
        symbolSize: 10,
        data: data.map((d) => [d.holdingSeconds, d.netPnl, d.symbol]),
        itemStyle: {
          color: (p: { data: [number, number, string] }) =>
            p.data[1] >= 0 ? palette.positive : palette.negative,
          opacity: 0.75,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 260 }} notMerge />;
}
