import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyInsight — Student Performance",
  description: "Understand your learning habits and explore an indicative performance prediction.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}