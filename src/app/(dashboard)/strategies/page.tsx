import { Button } from "@/components/ui/button";
import { listStrategies } from "@/db/queries/strategies";
import { StrategyCard } from "@/components/strategies/strategy-card";
import { StrategyForm } from "@/components/strategies/strategy-form";

export default async function StrategiesPage() {
  const strategies = await listStrategies();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {strategies.length} Strategie{strategies.length === 1 ? "" : "n"}
        </h2>
        <StrategyForm trigger={<Button>Neue Strategie</Button>} />
      </div>

      {strategies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Strategien angelegt.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}
    </div>
  );
}
