"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveTimeframePreset, type TimeframePreset } from "@/lib/utils/date";

const PRESETS: { value: TimeframePreset; label: string }[] = [
  { value: "all", label: "All-Time" },
  { value: "ytd", label: "YTD" },
  { value: "week", label: "Diese Woche" },
  { value: "month", label: "Dieser Monat" },
  { value: "custom", label: "Benutzerdefiniert" },
];

export function TimeframeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("timeframe") as TimeframePreset | null) ?? "all";

  function selectPreset(preset: TimeframePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("timeframe", preset);
    if (preset !== "custom") {
      const { dateFrom, dateTo } = resolveTimeframePreset(preset);
      if (dateFrom) params.set("dateFrom", dateFrom);
      else params.delete("dateFrom");
      if (dateTo) params.set("dateTo", dateTo);
      else params.delete("dateTo");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateCustomDate(key: "dateFrom" | "dateTo", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={current} onValueChange={(v) => v && selectPreset(v as TimeframePreset)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {current === "custom" && (
        <>
          <Input
            type="date"
            value={searchParams.get("dateFrom") ?? ""}
            onChange={(e) => updateCustomDate("dateFrom", e.target.value)}
            className="w-40"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="date"
            value={searchParams.get("dateTo") ?? ""}
            onChange={(e) => updateCustomDate("dateTo", e.target.value)}
            className="w-40"
          />
        </>
      )}
    </div>
  );
}
