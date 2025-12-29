import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bulk Lab - AI Protein Analysis',
  description: 'Instant protein analysis for your meals. Powered by AI.',
  keywords: ['protein', 'nutrition', 'meal analysis', 'fitness', 'muscle building', 'AI'],
  authors: [{ name: 'Bulk Lab' }],
  openGraph: {
    title: 'Bulk Lab - AI Protein Analysis',
    description: 'Instant protein analysis for your meals. Powered by AI.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-bulk-700 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
