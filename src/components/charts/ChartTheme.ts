"use client";

import { useTheme } from "next-themes";

// Validated categorical palette (dataviz skill reference palette).
// Fixed slot order is the CVD-safety mechanism — never reorder/cycle.
const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];
const CATEGORICAL_DARK = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#008300",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
];

const STATUS = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
};

export interface ChartPalette {
  isDark: boolean;
  categorical: string[];
  positive: string;
  negative: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gridLine: string;
  axisLine: string;
}

function buildPalette(isDark: boolean): ChartPalette {
  return {
    isDark,
    categorical: isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT,
    positive: isDark ? STATUS.good.dark : STATUS.good.light,
    negative: isDark ? STATUS.critical.dark : STATUS.critical.light,
    surface: isDark ? "#1a1a19" : "#fcfcfb",
    textPrimary: isDark ? "#ffffff" : "#0b0b0b",
    textSecondary: isDark ? "#c3c2b7" : "#52514e",
    textMuted: "#898781",
    gridLine: isDark ? "#2c2c2a" : "#e1e0d9",
    axisLine: isDark ? "#383835" : "#c3c2b7",
  };
}

/** Resolves the validated dataviz palette for the current (light/dark) theme. */
export function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme();
  return buildPalette(resolvedTheme === "dark");
}

/** Shared axis/grid/tooltip base so every chart looks like one system. */
export function baseChartOption(palette: ChartPalette) {
  return {
    backgroundColor: "transparent",
    textStyle: { color: palette.textSecondary, fontFamily: "inherit" },
    grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
    tooltip: {
      backgroundColor: palette.surface,
      borderColor: palette.gridLine,
      textStyle: { color: palette.textPrimary },
      extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;",
    },
    axisLine: { lineStyle: { color: palette.axisLine } },
    splitLine: { lineStyle: { color: palette.gridLine } },
  };
}
