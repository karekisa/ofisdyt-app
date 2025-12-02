import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  metadataBase: new URL('https://diyetlik.com.tr'),
  title: {
    default: "Diyetlik | Diyetisyen Asistanı",
    template: "%s | Diyetlik",
  },
  description: "Diyetisyenler için en hızlı randevu ve klinik yönetim yazılımı. WhatsApp ile diyet listesi gönderin, randevularınızı otomatikleştirin.",
  keywords: ["diyetisyen yazılımı", "klinik yönetim", "online randevu", "diyet takip programı", "ofisdyt", "diyetlik", "diyetisyen asistanı", "randevu yönetimi"],
  authors: [{ name: "Diyetlik" }],
  creator: "Diyetlik",
  publisher: "Diyetlik",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://diyetlik.com",
    siteName: "Diyetlik",
    title: "Diyetlik | Diyetisyen Asistanı",
    description: "Diyetisyenler için en hızlı randevu ve klinik yönetim yazılımı. WhatsApp ile diyet listesi gönderin, randevularınızı otomatikleştirin.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Diyetlik Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diyetlik | Diyetisyen Asistanı",
    description: "Diyetisyenler için en hızlı randevu ve klinik yönetim yazılımı.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
