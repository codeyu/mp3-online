'use client'

import { usePlayer } from "@/contexts/PlayerContext"

export function Header() {
  const { currentTrack } = usePlayer()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* ロゴ */}
        <div className="font-bold text-xl">
          音楽プレーヤー
        </div>

        {/* 現在の曲 */}
        <div className="flex-1 text-center mx-4">
          {currentTrack ? (
            <div className="text-sm">
              <span className="text-muted-foreground mr-2">再生中:</span>
              <span className="font-medium">
                {currentTrack.name || new URL(currentTrack.url).pathname.split('/').pop()}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              再生中の曲はありません
            </span>
          )}
        </div>

        {/* 右側の余白 */}
        <div className="w-[200px]" />
      </div>
    </header>
  )
}