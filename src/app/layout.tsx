import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { AppShell } from "@/components/shell/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Wordmark serif — SIL Open Font License (Google Fonts), latin subset only:
// the wordmark is Latin; interface text keeps the Armenian-capable stack below.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Galstyan & Partners — Իրավական աշխատանքային համակարգ",
    template: "%s — Galstyan & Partners",
  },
  description:
    "Galstyan & Partners — իրավաբանական աշխատանքային համակարգ՝ գործեր, փաստաթղթեր, իրավական որոնում (ARLIS, Datalex, Սահմանադրական դատարան, ՄԻԵԴ), ԱԲ վերլուծություն և փաստաթղթերի նախագծում։",
  keywords: [
    "Galstyan & Partners",
    "ARLIS",
    "Հայաստանի օրենսդրություն",
    "իրավական որոնում",
    "գործերի վարում",
  ],
  authors: [{ name: "Galstyan & Partners" }],
  applicationName: "Galstyan & Partners",
  robots: { index: false, follow: false },
  icons: { icon: "/brand/crest.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080909",
};

// Dark mode only — the brand is black marble (no light theme).
const themeInitScript = `
(function() {
  document.documentElement.classList.add('dark');
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased bg-[var(--app-bg)] text-[var(--text-primary)]`}
        style={{
          fontFamily:
            "'Noto Sans Armenian','Noto Serif Armenian','DejaVu Sans',var(--font-geist-sans),system-ui,-apple-system,sans-serif",
        }}
      >
        <LocaleProvider>
          <AppShell>{children}</AppShell>
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
