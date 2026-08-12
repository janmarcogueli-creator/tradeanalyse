import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManualTradeForm } from "@/components/trades/manual-trade-form";

export default function NewTradePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade anlegen</CardTitle>
      </CardHeader>
      <CardContent>
        <ManualTradeForm />
      </CardContent>
    </Card>
  );
}
