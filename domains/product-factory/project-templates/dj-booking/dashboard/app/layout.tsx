import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DJ Studio AI',
  description: 'Multi-agent platform for professional DJs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
