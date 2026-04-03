import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next-StockMarket | Indian Stock Market Dashboard",
  description: "Real-time Indian stock market dashboard with NSE & BSE data, IPO tracking, and expert market analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' } }} />
      </body>
    </html>
  );
}
