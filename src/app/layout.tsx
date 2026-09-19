import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/shared/providers/motion-provider";
import { QueryProvider } from "@/shared/providers/query-provider";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArahIn — Rangkum materi jadi PPT, Quiz, & rangkuman",
  description:
    "Unggah soal atau materi, biarkan AI merangkumnya, lalu ubah hasilnya menjadi PPT, Quiz, atau rangkuman dalam hitungan detik.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={nunito.variable}>
      <body>
        <a href="#main" className="skip-link">
          Lewati ke konten
        </a>
        <QueryProvider>
          <MotionProvider>{children}</MotionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
