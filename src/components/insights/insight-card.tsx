"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Insight {
  id: number;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
}

const SEVERITY_VARIANT = {
  info: "outline",
  warning: "default",
  critical: "destructive",
} as const;

const SEVERITY_LABEL = {
  info: "Info",
  warning: "Warnung",
  critical: "Kritisch",
};

export function InsightCard({ insight }: { insight: Insight }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function dismiss() {
    setPending(true);
    try {
      const res = await fetch(`/api/insights/${insight.id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Konnte Insight nicht ausblenden");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Badge variant={SEVERITY_VARIANT[insight.severity]}>{SEVERITY_LABEL[insight.severity]}</Badge>
          {insight.title}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={dismiss} disabled={pending}>
          Ausblenden
        </Button>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{insight.description}</CardContent>
    </Card>
  );
}
