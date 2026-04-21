import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Music Player",
  description: "Create AI-generated visual memories tied to moments in your music",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
