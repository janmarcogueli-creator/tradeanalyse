import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InsightsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Regelbasierte Musterkennung (Wochentag, Strategie-Expectancy, Overtrading, ...) folgt in M5.
      </CardContent>
    </Card>
  );
}
