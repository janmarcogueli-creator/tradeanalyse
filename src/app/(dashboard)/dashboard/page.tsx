import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All-time / YTD Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Kennzahlen &amp; Equity Curve folgen in M3 (Metrics-Engine) und M4 (Visualisierungen).
      </CardContent>
    </Card>
  );
}
