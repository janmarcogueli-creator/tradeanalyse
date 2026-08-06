import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        IBKR-Flex-Query-Import (Trigger-Button, Batch-Historie, manueller Upload) folgt in M1.
      </CardContent>
    </Card>
  );
}
