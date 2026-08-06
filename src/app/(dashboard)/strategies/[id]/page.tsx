import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategie #{id}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Performance-Vergleich &amp; zugeordnete Trades folgen in M2/M3.
      </CardContent>
    </Card>
  );
}
