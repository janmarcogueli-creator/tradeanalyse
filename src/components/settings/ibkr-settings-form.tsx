"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface IbkrStatus {
  tokenSet: boolean;
  tokenSource: "settings" | "env" | null;
  tokenMasked: string | null;
  queryIdSet: boolean;
  queryIdSource: "settings" | "env" | null;
  queryIdMasked: string | null;
}

export function IbkrSettingsForm() {
  const [status, setStatus] = useState<IbkrStatus | null>(null);
  const [token, setToken] = useState("");
  const [queryId, setQueryId] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ibkr")
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => toast.error("Status konnte nicht geladen werden"));
  }, []);

  async function save() {
    if (!token.trim() && !queryId.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/settings/ibkr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, queryId }),
      });
      if (!res.ok) throw new Error();
      const updated = await fetch("/api/settings/ibkr").then((r) => r.json());
      setStatus(updated);
      setToken("");
      setQueryId("");
      toast.success("Gespeichert");
    } catch {
      toast.error("Konnte nicht gespeichert werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Token:</span>
          {status?.tokenSet ? (
            <>
              <Badge variant="default">{status.tokenMasked}</Badge>
              <span className="text-xs text-muted-foreground">
                ({status.tokenSource === "settings" ? "Settings" : ".env.local"})
              </span>
            </>
          ) : (
            <Badge variant="secondary">nicht gesetzt</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Query-ID:</span>
          {status?.queryIdSet ? (
            <>
              <Badge variant="default">{status.queryIdMasked}</Badge>
              <span className="text-xs text-muted-foreground">
                ({status.queryIdSource === "settings" ? "Settings" : ".env.local"})
              </span>
            </>
          ) : (
            <Badge variant="secondary">nicht gesetzt</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ibkr-token">Flex Token</Label>
          <Input
            id="ibkr-token"
            type="password"
            placeholder="Neuen Token eingeben..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ibkr-query-id">Flex Query-ID</Label>
          <Input
            id="ibkr-query-id"
            placeholder="Neue Query-ID eingeben..."
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={save} disabled={pending || (!token.trim() && !queryId.trim())} className="self-start">
        Speichern
      </Button>
    </div>
  );
}
