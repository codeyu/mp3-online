'use client'

import { PlayerProvider } from '../contexts/PlayerContext'
import { ThemeProvider } from '@/components/theme-provider'
import '@/app/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PlayerProvider>
            <div className="min-h-screen bg-background text-foreground">
              {children}
            </div>
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

