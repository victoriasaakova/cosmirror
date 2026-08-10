import type { Metadata } from "next";
import { Onest, Playfair_Display } from "next/font/google";
import { YandexMetrika } from "@/components/YandexMetrika";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const grotesk = Onest({
  variable: "--font-grotesk",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cosmirror.ru"),
  title: "Натальная карта с расшифровкой онлайн — Cosmirror",
  description:
    "Cosmirror — приложение для самопознания через астрологию. Натальная карта, текущие астрологические циклы и личные наблюдения помогают лучше понимать себя и замечать закономерности своей жизни.",
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
    title: "Натальная карта с расшифровкой онлайн — Cosmirror",
    description:
      "Cosmirror — приложение для самопознания через астрологию. Натальная карта, текущие астрологические циклы и личные наблюдения помогают лучше понимать себя и замечать закономерности своей жизни.",
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
    title: "Натальная карта с расшифровкой онлайн — Cosmirror",
    description:
      "Cosmirror — приложение для самопознания через астрологию. Натальная карта, текущие астрологические циклы и личные наблюдения помогают лучше понимать себя и замечать закономерности своей жизни.",
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
      className={`${display.variable} ${grotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-grotesk" suppressHydrationWarning>
        <YandexMetrika />
        {children}
      </body>
    </html>
  );
}
