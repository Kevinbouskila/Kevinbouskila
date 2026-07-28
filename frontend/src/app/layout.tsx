import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polymarket SaaS Platform",
  description: "Détection, analyse et exécution d'opportunités sur Polymarket.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
