"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StrategyFormValues {
  id?: number;
  name: string;
  description: string;
  rulesText: string;
  category: string;
}

export function StrategyForm({
  trigger,
  initial,
  existingCategories = [],
}: {
  trigger: React.ReactElement;
  initial?: StrategyFormValues;
  existingCategories?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [rulesText, setRulesText] = useState(initial?.rulesText ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setPending(true);
    try {
      const url = initial?.id ? `/api/strategies/${initial.id}` : "/api/strategies";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, rulesText, category: category.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Strategie konnte nicht gespeichert werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Strategie bearbeiten" : "Neue Strategie"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strategy-name">Name</Label>
            <Input id="strategy-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strategy-category">Kategorie</Label>
            <Input
              id="strategy-category"
              list="strategy-category-options"
              placeholder="Bestehende wählen oder neue eingeben..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="strategy-category-options">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strategy-description">Beschreibung</Label>
            <Textarea
              id="strategy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strategy-rules">Regeln</Label>
            <Textarea
              id="strategy-rules"
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={4}
            />
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
