import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MoxyAI Trade Mirror',
  description: 'Automated trade mirroring from MoxyAI',
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
