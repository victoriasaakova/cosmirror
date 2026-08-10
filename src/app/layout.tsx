import type { Metadata } from "next";
import { Playfair_Display, Roboto } from "next/font/google";
import { YandexMetrika } from "@/components/YandexMetrika";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const body = Roboto({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cosmirror.ru"),
  title: "Cosmirror — Живая карта себя",
  description:
    "Cosmirror превращает натальную карту в Живую карту — историю, которая развивается вместе с тобой. Не чтобы предсказывать будущее, а чтобы лучше понимать себя.",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://cosmirror.ru",
    siteName: "Cosmirror",
    title: "Cosmirror — Живая карта себя",
    description:
      "Cosmirror превращает натальную карту в Живую карту — историю, которая развивается вместе с тобой. Не чтобы предсказывать будущее, а чтобы лучше понимать себя.",
    images: [
      {
        url: "/images/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Cosmirror",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmirror — Живая карта себя",
    description:
      "Cosmirror превращает натальную карту в Живую карту — историю, которая развивается вместе с тобой.",
    images: ["/images/og-cover.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <YandexMetrika />
        {children}
      </body>
    </html>
  );
}
