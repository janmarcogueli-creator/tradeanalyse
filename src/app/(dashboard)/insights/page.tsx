import { refreshInsights } from "@/db/queries/insights";
import { InsightFeed } from "@/components/insights/insight-feed";

export default async function InsightsPage() {
  const insights = await refreshInsights();

  return <InsightFeed insights={insights} />;
}
