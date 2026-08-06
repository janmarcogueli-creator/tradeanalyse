import { Button } from "@/components/ui/button";

export function BackupButton() {
  return (
    <Button variant="secondary" nativeButton={false} render={<a href="/api/settings/backup" download />}>
      Datenbank herunterladen
    </Button>
  );
}
