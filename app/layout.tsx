import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import FontSizeProvider from "@/components/settings/FontSizeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ensina AI - Aprenda Português com IA",
  description: "Agente educacional inteligente baseado em método socrático para ensino de Português",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FontSizeProvider />
        {children}
      </body>
    </html>
  );
}
