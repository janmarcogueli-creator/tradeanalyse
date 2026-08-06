"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: number;
  type: string;
}

export function AttachmentUpload({
  tradeId,
  attachments,
}: {
  tradeId: number;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setPending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/trades/${tradeId}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      toast.error("Screenshot konnte nicht hochgeladen werden");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-secondary-foreground"
        />
        <Button size="sm" variant="secondary" onClick={upload} disabled={pending}>
          Hochladen
        </Button>
      </div>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={`/api/attachments/${a.id}`}
              alt="Trade Screenshot"
              className="h-24 w-24 rounded-md border object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
