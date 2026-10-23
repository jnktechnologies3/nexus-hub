import "./globals.css";
import type { Metadata } from "next";
import { HubProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = { title: "Nexus Hub", description: "Self-hosted multi-agent workspace" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="antialiased"><HubProvider><Shell>{children}</Shell></HubProvider></body></html>
  );
}
