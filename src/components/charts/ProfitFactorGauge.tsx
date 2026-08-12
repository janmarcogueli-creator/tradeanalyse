"use client";

import ReactECharts from "echarts-for-react";
import { useChartPalette } from "./ChartTheme";

const SCALE_MAX = 3;

/** Profit Factor as a speedometer — red below 1 (losing), yellow 1–1.5
 * (marginal), green above 1.5 (healthy). Values above the 3.0 display cap
 * still pin the needle at max but show the real number in the label. */
export function ProfitFactorGauge({ profitFactor }: { profitFactor: number | null }) {
  const palette = useChartPalette();
  const capped = profitFactor === null ? 0 : Math.min(Math.max(profitFactor, 0), SCALE_MAX);

  const option = {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        min: 0,
        max: SCALE_MAX,
        splitNumber: 3,
        radius: "90%",
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [1 / 3, palette.negative],
              [1.5 / 3, "#c98500"],
              [1, palette.positive],
            ],
          },
        },
        pointer: { itemStyle: { color: palette.textPrimary } },
        axisTick: { show: false },
        splitLine: { length: 10, lineStyle: { color: palette.axisLine } },
        axisLabel: { color: palette.textMuted, fontSize: 10, distance: 14 },
        title: { show: false },
        detail: {
          valueAnimation: true,
          formatter: () => (profitFactor === null ? "–" : profitFactor > SCALE_MAX ? `>${SCALE_MAX}` : profitFactor.toFixed(2)),
          color: palette.textPrimary,
          fontSize: 20,
          offsetCenter: [0, "70%"],
        },
        data: [{ value: capped, name: "Profit Factor" }],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 160 }} notMerge />;
}
