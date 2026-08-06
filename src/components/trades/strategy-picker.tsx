"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Strategy {
  id: number;
  name: string;
}

export function StrategyPicker({
  tradeId,
  allStrategies,
  assignedStrategyIds,
}: {
  tradeId: number;
  allStrategies: Strategy[];
  assignedStrategyIds: number[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const assigned = new Set(assignedStrategyIds);

  async function toggle(strategyId: number) {
    setPending(true);
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
      setPending(false);
    }
  }

  if (allStrategies.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Strategien angelegt.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {allStrategies.map((strategy) => (
        <Badge
          key={strategy.id}
          variant={assigned.has(strategy.id) ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => !pending && toggle(strategy.id)}
        >
          {strategy.name}
        </Badge>
      ))}
    </div>
  );
}
