import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

export const metadata: Metadata = {
  title: 'IMD System - نظام إدارة المتاجر',
  description: 'نظام متكامل لإدارة المتاجر والمبيعات',
  manifest: '/manifest.json',
  icons: {
    icon: '/imd-logo.jpeg',
    apple: '/imd-logo.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex flex-col bg-dark-slate">
        <AppProvider>
          <main className="flex-1">
            {children}
          </main>
          <footer className="footer-branding bg-dark-card border-t border-gray-800 py-4 mt-auto">
            <p className="text-gray-400 text-sm">
              <span className="text-electric-blue font-semibold">IMD System</span> - 
              Developed by <span className="text-electric-blue font-semibold">Eng. Ibrahim Mabrouk</span>
            </p>
          </footer>
        </AppProvider>
      </body>
    </html>
  )
}