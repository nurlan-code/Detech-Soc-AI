import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/shared/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Detech SOC AI — Security Operations Center",
  description: "Enterprise AI-powered SOC platform for alert triage, incident management, phishing analysis, and threat intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-soc-dark text-gray-100 antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#111827",
              color: "#f3f4f6",
              border: "1px solid #1f2937",
              borderRadius: "8px",
              fontSize: "13px",
              padding: "10px 14px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#111827" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#111827" } },
          }}
        />
      </body>
    </html>
  );
}
