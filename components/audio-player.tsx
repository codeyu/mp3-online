'use client'

import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCw, SkipBack, SkipForward, Play, Pause, Repeat, Repeat1, RotateCcw } from 'lucide-react'
import { formatTime } from '../utils/formatTime'
import { PlaylistItem } from '../types/interfaces'

interface AudioPlayerProps {
  src: string;
  onNext: () => void;
  onPrevious: () => void;
  playlist: PlaylistItem[];
  onPlaylistItemEnd: () => void;
}

type RepeatMode = 'none' | 'all' | 'one';

const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({ src, onNext, onPrevious, playlist, onPlaylistItemEnd }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null)

  useImperativeHandle(ref, () => audioRef.current as HTMLAudioElement);

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none')
  const [playbackRate, setPlaybackRate] = useState('1.0')

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0
        audio.play()
      } else if (repeatMode === 'all' || (repeatMode === 'none' && playlist.length > 1)) {
        onPlaylistItemEnd()
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [repeatMode, onPlaylistItemEnd, playlist.length])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = src
      if (isPlaying) {
        audioRef.current.play()
      }
    }
  }, [src])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, duration)
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0)
    }
  }

  const handleRepeatClick = () => {
    const modes: RepeatMode[] = ['none', 'all', 'one']
    const currentIndex = modes.indexOf(repeatMode)
    setRepeatMode(modes[(currentIndex + 1) % modes.length])
  }

  const handlePlaybackRateChange = (value: string) => {
    setPlaybackRate(value)
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(value)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-4">
      <audio ref={audioRef} src={src} />
      
      {/* 上部コントロール */}
      <div className="flex justify-center items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={skipBackward}
          aria-label="5秒戻る"
        >
          <RotateCcw className="h-6 w-6 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={playlist.length <= 1}
          aria-label="前の曲"
        >
          <SkipBack className="h-6 w-6 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          aria-label={isPlaying ? '一時停止' : '再生'}
          className="h-12 w-12"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 text-primary" />
          ) : (
            <Play className="h-8 w-8 text-primary" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={playlist.length <= 1}
          aria-label="次の曲"
        >
          <SkipForward className="h-6 w-6 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={skipForward}
          aria-label="5秒進む"
        >
          <RotateCw className="h-6 w-6 text-primary" />
        </Button>
      </div>

      {/* 下部コントロール */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRepeatClick}
          aria-label="リピートモード切替"
        >
          {repeatMode === 'one' ? (
            <Repeat1 className="h-5 w-5 text-primary" />
          ) : (
            <Repeat className={`h-5 w-5 ${repeatMode === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
        </Button>

        <span className="text-sm tabular-nums">
          {formatTime(currentTime)}
        </span>

        <Slider
          className="flex-1"
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={([value]) => seek(value)}
          aria-label="再生位置"
        />

        <span className="text-sm tabular-nums">
          {formatTime(duration)}
        </span>

        <Select value={playbackRate} onValueChange={handlePlaybackRateChange}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="x1.0" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">x0.5</SelectItem>
            <SelectItem value="1.0">x1.0</SelectItem>
            <SelectItem value="1.5">x1.5</SelectItem>
            <SelectItem value="2.0">x2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})

AudioPlayer.displayName = 'AudioPlayer';

export { AudioPlayer };

