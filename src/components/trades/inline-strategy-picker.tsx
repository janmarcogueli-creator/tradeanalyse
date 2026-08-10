"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusIcon, XIcon } from "lucide-react";

interface Strategy {
  id: number;
  name: string;
}

export function InlineStrategyPicker({
  tradeId,
  allStrategies,
  assignedStrategies,
}: {
  tradeId: number;
  allStrategies: Strategy[];
  assignedStrategies: Strategy[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const assignedIds = new Set(assignedStrategies.map((s) => s.id));

  async function toggle(strategyId: number) {
    setPending(strategyId);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleStrategy", strategyId }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Strategie konnte nicht aktualisiert werden");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {assignedStrategies.map((s) => (
        <Badge
          key={s.id}
          variant="outline"
          className="cursor-pointer gap-1 pr-1"
          onClick={() => pending !== s.id && toggle(s.id)}
        >
          {s.name}
          <XIcon className="size-3" />
        </Badge>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
          <PlusIcon className="size-3" />
          <span className="sr-only">Strategie zuordnen</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {allStrategies.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Keine Strategien angelegt.</p>
          ) : (
            allStrategies.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.id}
                checked={assignedIds.has(s.id)}
                disabled={pending === s.id}
                onCheckedChange={() => toggle(s.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {s.name}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
