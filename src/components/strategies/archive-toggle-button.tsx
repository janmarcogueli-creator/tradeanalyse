"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ArchiveToggleButton({
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
    <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
      {status === "active" ? "Archivieren" : "Aktivieren"}
    </Button>
  );
}
