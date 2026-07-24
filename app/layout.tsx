import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Noto_Serif_JP({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://weeeedddd.github.io/MangaMori/";
const title = "MangaMori — Anime & Manhwa Empfehlungen";
const description =
  "Entdecke persönliche Anime- und Manhwa-Empfehlungen passend zu deinen Lieblingsgenres — mit echten Covern und Live-Daten von AniList.";
const socialImage = new URL("og.png", siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MangaMori",
    title,
    description,
    locale: "de_DE",
    images: [
      {
        url: socialImage,
        width: 1760,
        height: 909,
        alt: "MangaMori — Dein nächstes Kapitel wartet.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f3eadc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
