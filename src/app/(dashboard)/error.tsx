"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] unhandled error:", error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etwas ist schiefgelaufen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{error.message || "Unbekannter Fehler."}</p>
        <Button onClick={reset} className="self-start">
          Erneut versuchen
        </Button>
      </CardContent>
    </Card>
  );
}
