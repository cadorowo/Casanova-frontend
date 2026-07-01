import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Casanova | Paris Sportifs d'Élite & Casino Premium",
  description: "La destination ultime pour les paris sportifs et les jeux de casino premium. Cotes en temps réel, paiements instantanés en TND et une expérience d'élite pour les joueurs professionnels. Rejoignez l'Arène Casanova.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/logo-short.png",
  },
  openGraph: {
    title: "Casanova | Paris Sportifs d'Élite & Casino Premium",
    description: "La destination ultime pour les paris sportifs et les jeux de casino premium. Rejoignez l'Arène Casanova pour une expérience d'élite.",
    type: "website",
    locale: "fr_FR",
    siteName: "Casanova",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casanova | Paris Sportifs d'Élite & Casino Premium",
    description: "La destination ultime pour les paris sportifs et les jeux de casino premium. Rejoignez l'Arène Casanova pour une expérience d'élite.",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} antialiased selection:bg-yellow-500/30`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
