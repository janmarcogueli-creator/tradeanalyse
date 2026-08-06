"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Note {
  id: number;
  bodyMarkdown: string;
  createdAt: string;
}

export function NotesPanel({ tradeId, notes }: { tradeId: number; notes: Note[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  async function addNote() {
    if (!draft.trim()) return;
    setPending(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addNote", body: draft }),
      });
      if (!res.ok) throw new Error();
      setDraft("");
      router.refresh();
    } catch {
      toast.error("Notiz konnte nicht gespeichert werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Notiz hinzufügen..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
        />
        <Button size="sm" onClick={addNote} disabled={!draft.trim() || pending} className="self-end">
          Speichern
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch keine Notizen.</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="rounded-md border p-3 text-sm">
            <p className="whitespace-pre-wrap">{note.bodyMarkdown}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(note.createdAt).toLocaleString("de-DE")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
