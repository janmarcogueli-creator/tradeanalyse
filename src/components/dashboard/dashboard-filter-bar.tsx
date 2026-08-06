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

export function DashboardFilterBar({
  strategies,
  tags,
}: {
  strategies: Option[];
  tags: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get("symbols") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Symbol..."
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateParam("symbols", symbol.toUpperCase());
        }}
        onBlur={() => updateParam("symbols", symbol.toUpperCase())}
        className="max-w-40"
      />

      <Select
        value={searchParams.get("assetClasses") ?? ALL}
        onValueChange={(v) => updateParam("assetClasses", v)}
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
        value={searchParams.get("strategyIds") ?? ALL}
        onValueChange={(v) => updateParam("strategyIds", v)}
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

      <Select value={searchParams.get("tagIds") ?? ALL} onValueChange={(v) => updateParam("tagIds", v)}>
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

      {searchParams.toString() && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
}
