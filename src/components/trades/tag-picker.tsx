"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Tag {
  id: number;
  name: string;
}

export function TagPicker({
  tradeId,
  allTags,
  assignedTagIds,
}: {
  tradeId: number;
  allTags: Tag[];
  assignedTagIds: number[];
}) {
  const router = useRouter();
  const [newTagName, setNewTagName] = useState("");
  const [pending, setPending] = useState(false);
  const assigned = new Set(assignedTagIds);

  async function toggle(tagId?: number, tagName?: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleTag", tagId, tagName }),
      });
      if (!res.ok) throw new Error();
      setNewTagName("");
      router.refresh();
    } catch {
      toast.error("Tag konnte nicht aktualisiert werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => (
          <Badge
            key={tag.id}
            variant={assigned.has(tag.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => !pending && toggle(tag.id)}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Neuer Tag..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="h-8 max-w-40"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!newTagName.trim() || pending}
          onClick={() => toggle(undefined, newTagName)}
        >
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}
