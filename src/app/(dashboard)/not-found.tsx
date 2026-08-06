import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nicht gefunden</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Der angeforderte Eintrag existiert nicht (mehr).
        </p>
        <Button nativeButton={false} render={<Link href="/dashboard" />} className="self-start">
          Zum Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
