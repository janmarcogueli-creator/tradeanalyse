import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TradesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trades</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Trade-Liste, Filter &amp; Suche folgen in M2 (Trade-Management-UI). Vorher: M1 (IBKR-Import).
      </CardContent>
    </Card>
  );
}
