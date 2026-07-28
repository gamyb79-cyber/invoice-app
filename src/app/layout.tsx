import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "GOGO Invoice - Free Invoicing for South African Businesses",
  description: "Create professional invoices in seconds. ZAR currency, WhatsApp sharing, multi-language support, AI-powered features. Free to start.",
  keywords: ["invoice", "invoicing", "South Africa", "ZAR", "business", "accounting", "free", "WhatsApp"],
  authors: [{ name: "GOGO Invoice" }],
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://invoice-app-beige-rho.vercel.app",
    siteName: "GOGO Invoice",
    title: "GOGO Invoice - Free Invoicing for South African Businesses",
    description: "Create professional invoices in seconds. ZAR currency, WhatsApp sharing, multi-language support, AI-powered features. Free to start.",
    images: [
      {
        url: "https://invoice-app-beige-rho.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "GOGO Invoice - Professional Invoicing Made Simple",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GOGO Invoice - Free Invoicing for South African Businesses",
    description: "Create professional invoices in seconds. ZAR currency, WhatsApp sharing, AI-powered features. Free to start.",
    images: ["https://invoice-app-beige-rho.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
