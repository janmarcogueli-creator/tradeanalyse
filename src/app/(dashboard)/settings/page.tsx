import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IbkrSettingsForm } from "@/components/settings/ibkr-settings-form";
import { BackupButton } from "@/components/settings/backup-button";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>IBKR Flex Query</CardTitle>
          <CardDescription>
            Token/Query-ID hier speichern überschreibt die Werte aus .env.local, ohne Server-Neustart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IbkrSettingsForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>Lädt die komplette lokale SQLite-Datenbank als Datei herunter.</CardDescription>
        </CardHeader>
        <CardContent>
          <BackupButton />
        </CardContent>
      </Card>
    </div>
  );
}
