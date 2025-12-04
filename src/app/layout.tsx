import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import FaviconForce from "@/components/FaviconForce";
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
    default: "Diyetlik | Diyetisyenler İçin Online Randevu ve Klinik Yönetim Yazılımı",
    template: "%s | Diyetlik",
  },
  description: "Diyetisyenlerin işini %80 hızlandıran yerli sistem. Tek tıkla WhatsApp diyet gönderimi, otomatik randevu takibi ve finansal yönetim. Ücretsiz 15 gün deneyin.",
  keywords: ["Diyetisyen Yazılımı", "Klinik Yönetim", "Online Randevu Sistemi", "Diyet Takip Programı", "Diyetlik", "WhatsApp Entegrasyon", "diyetisyen yazılımı", "klinik yönetim", "online randevu", "diyet takip programı", "diyetisyen asistanı", "randevu yönetimi"],
  authors: [{ name: "Diyetlik" }],
  creator: "Diyetlik",
  publisher: "Diyetlik",
  alternates: {
    canonical: "https://diyetlik.com.tr",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://diyetlik.com.tr",
    siteName: "Diyetlik",
    title: "Diyetlik | Diyetisyenler İçin Online Randevu ve Klinik Yönetim Yazılımı",
    description: "Diyetisyenlerin işini %80 hızlandıran yerli sistem. Tek tıkla WhatsApp diyet gönderimi, otomatik randevu takibi ve finansal yönetim. Ücretsiz 15 gün deneyin.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Diyetlik - Diyetisyenler İçin Online Randevu ve Klinik Yönetim Yazılımı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diyetlik | Diyetisyenler İçin Online Randevu ve Klinik Yönetim Yazılımı",
    description: "Diyetisyenlerin işini %80 hızlandıran yerli sistem. Tek tıkla WhatsApp diyet gönderimi, otomatik randevu takibi ve finansal yönetim.",
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
    google: "VJdGaRIAPwQLdTfEdMCht2fRXEEBNw6e-uwKu7Pz0sU",
    // yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico.png',
    apple: '/icon.png',
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
        <FaviconForce />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
