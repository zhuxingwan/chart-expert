import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoteRich Chart Expert - Zero-code Visualization Tool",
  description: "A rich chart-making tool supporting data charts, flowcharts, and infographics. Non-coder friendly. Built with ECharts, Mermaid, and AntV Infographic.",
  keywords: ["NoteRich", "chart", "visualization", "ECharts", "Mermaid", "AntV Infographic", "infographic", "flowchart", "zero-code"],
  authors: [{ name: "NoteRich" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
