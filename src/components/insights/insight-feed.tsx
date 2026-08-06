import { InsightCard } from "./insight-card";

interface Insight {
  id: number;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export function InsightFeed({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Auffälligkeiten gefunden — entweder läuft es gut, oder es sind noch nicht genug Trades für eine
        verlässliche Analyse vorhanden.
      </p>
    );
  }

  const sorted = [...insights].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
