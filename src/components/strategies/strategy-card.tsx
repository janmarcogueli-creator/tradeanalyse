import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Strategy {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "archived";
}

export function StrategyCard({ strategy }: { strategy: Strategy }) {
  return (
    <Link href={`/strategies/${strategy.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{strategy.name}</CardTitle>
          <Badge variant={strategy.status === "active" ? "default" : "secondary"}>
            {strategy.status === "active" ? "aktiv" : "archiviert"}
          </Badge>
        </CardHeader>
        {strategy.description && (
          <CardContent className="text-sm text-muted-foreground">
            {strategy.description}
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
