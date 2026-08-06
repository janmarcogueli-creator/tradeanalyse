import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonthDashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monats-Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Folgt in M3 (Metrics-Engine) und M4 (Visualisierungen).
      </CardContent>
    </Card>
  );
}
