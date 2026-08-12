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

interface Tag {
  id: number;
  name: string;
}

export function InlineTagPicker({
  tradeId,
  allTags,
  assignedTags,
}: {
  tradeId: number;
  allTags: Tag[];
  assignedTags: Tag[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const assignedIds = new Set(assignedTags.map((t) => t.id));

  async function toggle(tagId: number) {
    setPending(tagId);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleTag", tagId }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Tag konnte nicht aktualisiert werden");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {assignedTags.map((t) => (
        <Badge
          key={t.id}
          variant="secondary"
          className="cursor-pointer gap-1 pr-1"
          onClick={() => pending !== t.id && toggle(t.id)}
        >
          {t.name}
          <XIcon className="size-3" />
        </Badge>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
          <PlusIcon className="size-3" />
          <span className="sr-only">Tag zuordnen</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {allTags.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Keine Tags angelegt.</p>
          ) : (
            allTags.map((t) => (
              <DropdownMenuCheckboxItem
                key={t.id}
                checked={assignedIds.has(t.id)}
                disabled={pending === t.id}
                onCheckedChange={() => toggle(t.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {t.name}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
