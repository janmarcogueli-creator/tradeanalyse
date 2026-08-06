import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        IBKR-Token/Query-ID-Verwaltung &amp; DB-Backup/Export folgen in M6.
      </CardContent>
    </Card>
  );
}
