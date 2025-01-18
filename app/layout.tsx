'use client'

import { PlayerProvider } from '../contexts/PlayerContext'
import { Header } from '../components/header'
import '@/app/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <PlayerProvider>
          <div className="min-h-screen bg-background">
            <Header />
            {children}
          </div>
        </PlayerProvider>
      </body>
    </html>
  )
}

