"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function StatusToggleBadge({
  strategyId,
  status,
}: {
  strategyId: number;
  status: "active" | "archived";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      const res = await fetch(`/api/strategies/${strategyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "active" ? "archived" : "active" }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Status konnte nicht geändert werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <Badge
      variant={status === "active" ? "default" : "secondary"}
      className="cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        if (!pending) toggle();
      }}
    >
      {status === "active" ? "aktiv" : "archiviert"}
    </Badge>
  );
}
