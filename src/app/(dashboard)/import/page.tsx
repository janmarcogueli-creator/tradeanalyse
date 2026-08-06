import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { importBatches } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportPanel } from "@/components/import/import-panel";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  error: "destructive",
  pending: "secondary",
  fetched: "secondary",
  parsed: "secondary",
};

export default async function ImportPage() {
  const batches = await db.query.importBatches.findMany({
    orderBy: [desc(importBatches.requestedAt)],
    limit: 20,
  });

  return (
    <div className="flex flex-col gap-4">
      <ImportPanel />

      <Card>
        <CardHeader>
          <CardTitle>Batch-Historie</CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch kein Import durchgeführt.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead className="text-right">Neu</TableHead>
                  <TableHead className="text-right">Duplikate</TableHead>
                  <TableHead>Fehler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>{new Date(batch.requestedAt).toLocaleString("de-DE")}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[batch.status] ?? "secondary"}>{batch.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {batch.fromDate && batch.toDate ? `${batch.fromDate} – ${batch.toDate}` : "–"}
                    </TableCell>
                    <TableCell className="text-right">{batch.fillsImported}</TableCell>
                    <TableCell className="text-right">{batch.fillsDuplicate}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {batch.errorMessage ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
