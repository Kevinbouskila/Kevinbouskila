import type { Market } from "@/types/market";

export async function fetchMarkets(): Promise<Market[]> {
  const response = await fetch("/api/v1/markets", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.status}`);
  }
  return response.json();
}

export function formatProbability(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
