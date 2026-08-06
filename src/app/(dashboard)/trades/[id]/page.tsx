import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade #{id}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Fills-Aufschlüsselung, Notizen, Tags &amp; Strategie-Zuordnung folgen in M2.
      </CardContent>
    </Card>
  );
}
