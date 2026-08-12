"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TagFormValues {
  id?: number;
  name: string;
  category: string;
  color: string;
}

export function TagForm({
  trigger,
  initial,
  existingCategories = [],
}: {
  trigger: React.ReactElement;
  initial?: TagFormValues;
  existingCategories?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Fehler");
  const [color, setColor] = useState(initial?.color ?? "");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setPending(true);
    try {
      const url = initial?.id ? `/api/tags/${initial.id}` : "/api/tags";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: category.trim() || null, color: color.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Tag konnte nicht gespeichert werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Tag bearbeiten" : "Neuer Tag"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-name">Name</Label>
            <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-category">Kategorie</Label>
            <Input
              id="tag-category"
              list="tag-category-options"
              placeholder="Bestehende wählen oder neue eingeben..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="tag-category-options">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-color">Farbe (optional)</Label>
            <Input id="tag-color" placeholder="#e34948" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!name.trim() || pending}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
