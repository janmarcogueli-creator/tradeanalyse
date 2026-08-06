"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ImportResult {
  batchId: number;
  status: "completed" | "error";
  fillsImported: number;
  fillsDuplicate: number;
  errorMessage: string | null;
}

function describeResult(result: ImportResult) {
  return `${result.fillsImported} neue Fills, ${result.fillsDuplicate} Duplikate übersprungen.`;
}

export function ImportPanel() {
  const router = useRouter();
  const [isFlexLoading, setFlexLoading] = useState(false);
  const [isUploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFlexImport() {
    setFlexLoading(true);
    try {
      const res = await fetch("/api/import/flex", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Import fehlgeschlagen");
        return;
      }
      const result = data as ImportResult;
      if (result.status === "error") {
        toast.error(result.errorMessage ?? "Import mit Fehlern abgeschlossen");
      } else {
        toast.success(describeResult(result));
      }
      router.refresh();
    } catch {
      toast.error("Import fehlgeschlagen — Netzwerkfehler");
    } finally {
      setFlexLoading(false);
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Keine Datei ausgewählt");
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload fehlgeschlagen");
        return;
      }
      const result = data as ImportResult;
      if (result.status === "error") {
        toast.error(result.errorMessage ?? "Import mit Fehlern abgeschlossen");
      } else {
        toast.success(describeResult(result));
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch {
      toast.error("Upload fehlgeschlagen — Netzwerkfehler");
    } finally {
      setUploadLoading(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>IBKR Flex Query Import</CardTitle>
          <CardDescription>
            Holt den aktuellen Flex-Query-Report über die IBKR Flex Web Service API (Token/Query-ID aus .env.local).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFlexImport} disabled={isFlexLoading}>
            {isFlexLoading ? "Importiere..." : "Jetzt importieren"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manueller Upload</CardTitle>
          <CardDescription>
            Fallback: von Hand exportiertes Flex-Query-XML aus IBKR Client Portal hochladen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-secondary-foreground"
          />
          <Button variant="secondary" onClick={handleUpload} disabled={isUploadLoading}>
            {isUploadLoading ? "Lade hoch..." : "Hochladen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
