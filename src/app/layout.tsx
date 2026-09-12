import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/shared/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArahIn — Small steps, clear direction",
  description:
    "A calm little home for your next steps. Capture a task, make a little progress, and find your direction with ArahIn.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
