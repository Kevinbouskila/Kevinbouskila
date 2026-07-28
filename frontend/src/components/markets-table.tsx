"use client";

import { useEffect, useState } from "react";

import { fetchMarkets, formatProbability, formatUsd } from "@/lib/api";
import type { Market } from "@/types/market";

export function MarketsTable() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchMarkets()
      .then((data) => {
        if (!cancelled) setMarkets(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Chargement des marchés…</p>;
  }

  if (error) {
    return (
      <p className="text-negative">
        Impossible de charger les marchés ({error}). Vérifiez que le backend et le Market Scanner
        tournent.
      </p>
    );
  }

  if (markets.length === 0) {
    return (
      <p className="text-muted-foreground">
        Aucun marché détecté pour le moment. Le Market Scanner scanne Polymarket toutes les
        minutes — revenez sous peu.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Marché</th>
            <th className="px-4 py-2 font-medium">Catégorie</th>
            <th className="px-4 py-2 font-medium text-right">Probabilité implicite</th>
            <th className="px-4 py-2 font-medium text-right">Spread</th>
            <th className="px-4 py-2 font-medium text-right">Volume</th>
            <th className="px-4 py-2 font-medium text-right">Liquidité</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market) => (
            <tr key={market.id} className="border-t border-border">
              <td className="px-4 py-2">{market.question}</td>
              <td className="px-4 py-2 text-muted-foreground">{market.category ?? "—"}</td>
              <td className="px-4 py-2 text-right">{formatProbability(market.implied_probability)}</td>
              <td className="px-4 py-2 text-right">{market.spread?.toFixed(3) ?? "—"}</td>
              <td className="px-4 py-2 text-right">{formatUsd(market.volume)}</td>
              <td className="px-4 py-2 text-right">{formatUsd(market.liquidity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
