import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { headers } from "next/headers";
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

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "MangaMori — Anime & Manhwa Empfehlungen";
  const description =
    "Entdecke persönliche Anime- und Manhwa-Empfehlungen passend zu deinen Lieblingsgenres — mit echten Covern und Live-Daten von AniList.";
  const socialImage = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      type: "website",
      url: origin,
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
}

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
