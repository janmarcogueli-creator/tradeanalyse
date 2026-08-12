"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analysis": "Analyse",
  "/trades": "Trades",
  "/strategies": "Strategien",
  "/tags": "Tags",
  "/insights": "Insights",
  "/import": "Import",
  "/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  const segment = Object.keys(titles)
    .filter((key) => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return segment ? titles[segment] : "tradeanalyse";
}

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-sm font-medium">{resolveTitle(pathname)}</h1>
    </header>
  );
}
