"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: number;
  name: string;
}

const ASSET_CATEGORIES = ["STK", "ETF", "OPT", "FUT", "FOP", "CASH"];
const ALL = "__all__";

export function TradeFilterBar({
  strategies,
  tags,
}: {
  strategies: Option[];
  tags: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get("symbol") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Symbol suchen..."
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateParam("symbol", symbol);
        }}
        onBlur={() => updateParam("symbol", symbol)}
        className="max-w-40"
      />

      <Select
        value={searchParams.get("assetCategory") ?? ALL}
        onValueChange={(v) => updateParam("assetCategory", v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Asset-Klasse" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Asset-Klassen</SelectItem>
          {ASSET_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("strategyId") ?? ALL}
        onValueChange={(v) => updateParam("strategyId", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Strategie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Strategien</SelectItem>
          {strategies.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("tagId") ?? ALL} onValueChange={(v) => updateParam("tagId", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Tags</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={searchParams.get("dateFrom") ?? ""}
        onChange={(e) => updateParam("dateFrom", e.target.value)}
        className="w-40"
      />
      <span className="text-sm text-muted-foreground">–</span>
      <Input
        type="date"
        value={searchParams.get("dateTo") ?? ""}
        onChange={(e) => updateParam("dateTo", e.target.value)}
        className="w-40"
      />

      {searchParams.toString() && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
}
