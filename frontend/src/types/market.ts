export interface Market {
  id: string;
  condition_id: string;
  slug: string | null;
  question: string;
  category: string | null;
  outcomes: string[];
  active: boolean;
  closed: boolean;
  volume: number | null;
  liquidity: number | null;
  best_bid: number | null;
  best_ask: number | null;
  spread: number | null;
  last_price: number | null;
  implied_probability: number | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}
