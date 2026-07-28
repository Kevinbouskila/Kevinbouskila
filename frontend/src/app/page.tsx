import { MarketsTable } from "@/components/markets-table";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Polymarket SaaS Platform</h1>
        <p className="mt-1 text-muted-foreground">
          Marchés détectés par le Market Scanner (rafraîchi toutes les minutes).
        </p>
      </header>
      <MarketsTable />
    </main>
  );
}
