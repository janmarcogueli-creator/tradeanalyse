"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSET_CATEGORIES = ["STK", "ETF", "OPT", "FUT", "FOP", "CASH"];

export function ManualTradeForm() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [assetCategory, setAssetCategory] = useState("STK");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [commissions, setCommissions] = useState("0");
  const [multiplier, setMultiplier] = useState("1");
  const [stopLoss, setStopLoss] = useState("");
  const [pending, setPending] = useState(false);

  const exitPartial = (exitPrice.trim() !== "") !== (exitTime.trim() !== "");
  const canSubmit =
    symbol.trim() !== "" && quantity.trim() !== "" && entryPrice.trim() !== "" && entryTime.trim() !== "" && !exitPartial;

  async function submit() {
    if (!canSubmit) return;
    setPending(true);
    try {
      const res = await fetch("/api/trades/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          assetCategory,
          direction,
          quantity: Number(quantity),
          entryPrice: Number(entryPrice),
          entryTime,
          exitPrice: exitPrice.trim() !== "" ? Number(exitPrice) : null,
          exitTime: exitTime.trim() !== "" ? exitTime : null,
          commissions: commissions.trim() !== "" ? Number(commissions) : 0,
          multiplier: multiplier.trim() !== "" ? Number(multiplier) : 1,
          stopLoss: stopLoss.trim() !== "" ? Number(stopLoss) : null,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      router.push(`/trades/${created.id}`);
    } catch {
      toast.error("Trade konnte nicht angelegt werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-symbol">Symbol</Label>
          <Input id="mt-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-asset">Asset-Klasse</Label>
          <Select value={assetCategory} onValueChange={(v) => v && setAssetCategory(v)}>
            <SelectTrigger id="mt-asset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-direction">Richtung</Label>
          <Select value={direction} onValueChange={(v) => v && setDirection(v as "long" | "short")}>
            <SelectTrigger id="mt-direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-quantity">Menge</Label>
          <Input id="mt-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-entry-price">Entry-Preis</Label>
          <Input
            id="mt-entry-price"
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-entry-time">Entry-Zeit</Label>
          <Input
            id="mt-entry-time"
            type="datetime-local"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-exit-price">Exit-Preis (leer = offene Position)</Label>
          <Input
            id="mt-exit-price"
            type="number"
            step="any"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-exit-time">Exit-Zeit</Label>
          <Input id="mt-exit-time" type="datetime-local" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
        </div>
      </div>
      {exitPartial && (
        <p className="text-sm text-red-500">Exit-Preis und Exit-Zeit müssen beide gesetzt sein (oder beide leer).</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-commissions">Kommissionen</Label>
          <Input
            id="mt-commissions"
            type="number"
            step="any"
            value={commissions}
            onChange={(e) => setCommissions(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mt-multiplier">Multiplikator</Label>
          <Input
            id="mt-multiplier"
            type="number"
            step="any"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mt-stop-loss">Stop-Loss-Preis (optional, für Risiko-Auswertung)</Label>
        <Input id="mt-stop-loss" type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
      </div>

      <div>
        <Button onClick={submit} disabled={!canSubmit || pending}>
          Trade anlegen
        </Button>
      </div>
    </div>
  );
}
