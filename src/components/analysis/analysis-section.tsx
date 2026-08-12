import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Shared shape for every Analyse-page section: a chart, a table, and a
 * short rule-based interpretation sentence — so no section is "just a
 * table" without added context. */
export function AnalysisSection({
  title,
  chart,
  table,
  interpretation,
}: {
  title: string;
  chart?: React.ReactNode;
  table?: React.ReactNode;
  interpretation: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {chart}
        {table}
        <p className="text-sm text-muted-foreground">{interpretation}</p>
      </CardContent>
    </Card>
  );
}
