'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Calendar, TrendingUp, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  // SoftwareApplication Schema
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Diyetlik",
    "description": "Diyetisyenler için randevu ve klinik yönetim yazılımı.",
    "applicationCategory": "MedicalApplication",
    "operatingSystem": "Web platform",
    "url": "https://www.diyetlik.com.tr",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.diyetlik.com.tr/logo.png"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Ücretsiz Deneme",
        "price": "0",
        "priceCurrency": "TRY",
        "availability": "https://schema.org/InStock",
        "priceValidUntil": "2025-12-31",
        "description": "15 gün ücretsiz deneme"
      },
      {
        "@type": "Offer",
        "name": "Aylık Paket",
        "price": "499",
        "priceCurrency": "TRY",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "billingIncrement": "P1M",
        "description": "Aylık abonelik paketi"
      },
      {
        "@type": "Offer",
        "name": "Yıllık Paket",
        "price": "4999",
        "priceCurrency": "TRY",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "billingIncrement": "P1Y",
        "description": "Yıllık abonelik paketi (%17 tasarruf)"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "WhatsApp Entegrasyonu",
      "Akıllı Randevu Yönetimi",
      "Gelişim Takibi",
      "Finansal Takip",
      "Danışan Yönetimi",
      "Diyet Şablonları",
      "Otomatik Hatırlatmalar",
      "Raporlama ve Analiz"
    ],
    "screenshot": "https://www.diyetlik.com.tr/logo.png",
    "softwareVersion": "1.0",
    "publisher": {
      "@type": "Organization",
      "name": "Diyetlik (Karekisa Yazılım)",
      "url": "https://www.diyetlik.com.tr",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.diyetlik.com.tr/logo.png"
      }
    }
  }

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Diyetlik (Karekisa Yazılım)",
    "url": "https://www.diyetlik.com.tr",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.diyetlik.com.tr/logo.png"
    },
    "description": "Diyetisyenler için online randevu ve klinik yönetim yazılımı. Diyetisyenlerin işini %80 hızlandıran yerli sistem.",
    "sameAs": [
      // Add social media links when available
      // "https://www.facebook.com/diyetlik",
      // "https://www.twitter.com/diyetlik",
      // "https://www.linkedin.com/company/diyetlik"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Turkish", "tr"]
    },
    "areaServed": {
      "@type": "Country",
      "name": "Turkey"
    },
    "knowsAbout": [
      "Diyetisyen Yazılımı",
      "Klinik Yönetim",
      "Online Randevu Sistemi",
      "Diyet Takip Programı",
      "WhatsApp Entegrasyon"
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <div className="min-h-screen bg-white">
      {/* Header/Navbar */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Diyetlik Logo" 
                width={140} 
                height={40} 
                className="object-contain h-8 w-auto" 
                priority 
              />
            </Link>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">
                  Ücretsiz Dene
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Diyetisyenler İçin
            <br />
            <span className="text-green-600">Diyetlik: Diyetisyenin Dijital Kutusu</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Randevularınızı yönetin, diyet listelerini WhatsApp'tan tek tuşla gönderin.
            <br />
            Excel ve defter karmaşasına son verin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                15 Gün Ücretsiz Başla
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Giriş Yap
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Neden Diyetlik?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Diyetisyenlerin işlerini kolaylaştıran özellikler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                WhatsApp Entegrasyonu
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Diyet listelerini ve randevu hatırlatmalarını müşterinizin cebine anında gönderin.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Akıllı Randevu
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Müşterileriniz profilinizdeki linkten kendi randevusunu alsın, siz sadece onaylayın.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Gelişim Takibi
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Danışanlarınızın kilo değişimini ve başarı hikayelerini otomatik grafiklerle sunun.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Şeffaf Fiyatlandırma
            </h2>
            <p className="text-xl text-gray-600">
              İhtiyacınıza uygun paketi seçin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-green-500 transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Aylık Paket</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">₺499</span>
                <span className="text-gray-600 ml-2">/ay</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Sınırsız danışan yönetimi</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Randevu takvimi</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">WhatsApp entegrasyonu</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Gelişim takibi</span>
                </li>
              </ul>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">
                  Başla
                </Button>
              </Link>
            </div>

            {/* Yearly Plan */}
            <div className="bg-white rounded-xl border-2 border-green-500 p-8 relative">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-medium">
                Popüler
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Yıllık Paket</h3>
              <div className="mb-2">
                <span className="text-5xl font-bold text-gray-900">₺4,999</span>
                <span className="text-gray-600 ml-2">/yıl</span>
              </div>
              <div className="mb-6">
                <span className="text-lg text-gray-500 line-through">₺5,988</span>
                <span className="text-green-600 font-semibold ml-2">
                  %17 tasarruf
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Sınırsız danışan yönetimi</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Randevu takvimi</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">WhatsApp entegrasyonu</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Gelişim takibi</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-semibold">
                    Öncelikli destek
                  </span>
                </li>
              </ul>
              <Link href="/login" className="block">
                <Button className="w-full">
                  Başla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
            15 gün ücretsiz deneme ile Diyetlik'in tüm özelliklerini keşfedin.
            Kredi kartı gerektirmez.
          </p>
          <Link href="/login">
            <Button size="lg" variant="outline" className="bg-white text-green-600 hover:bg-gray-50 text-lg px-8 py-6">
              15 Gün Ücretsiz Dene
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-xl font-bold text-white">Diyetlik</span>
              </div>
              <p className="text-sm text-gray-400">
                Diyetisyenler için dijital asistan platformu
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Ürün</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Özellikler
                  </Link>
                </li>
                <li>
                  <Link href="/subscription" className="hover:text-white transition-colors">
                    Fiyatlandırma
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Şirket</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Hakkımızda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    İletişim
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Gizlilik Sözleşmesi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Kullanım Koşulları
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Diyetlik. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

