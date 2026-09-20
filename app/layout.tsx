import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RYZE STORES — Everyday, upgraded",
  description:
    "Discover thoughtful tech, creative essentials and everyday upgrades.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "RYZE STORES",
  appleWebApp: { capable: true, title: "RYZE" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
