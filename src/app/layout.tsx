import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Outfit, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CounterPuff — Companion to The CounterPuff Method",
    template: "%s · CounterPuff",
  },
  description:
    "CounterPuff helps you understand tobacco urges, use Craving SOS tools, track progress, and read The CounterPuff Method by Warren Lockhart.",
  applicationName: "CounterPuff",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0e2438",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${sourceSerif.variable}`}>
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{});});}`,
          }}
        />
      </body>
    </html>
  );
}
