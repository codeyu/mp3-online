'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { usePlayer } from '../contexts/PlayerContext';
import { AudioPlayer } from '../components/audio-player';
import { Playlist } from '../components/playlist';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentTrack, setCurrentTrack, addToPlaylist, playlists, refreshPlaylists, setCurrentPlaylist, currentPlaylist, playlist, playTrack } = usePlayer();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const handlePlay = async () => {
    if (url) {
      const newTrack = {
        uuid: uuidv4(),
        name: new URL(url).pathname.split('/').pop() || '',
        description: '',
        url: url
      };
      await addToPlaylist(currentPlaylist, newTrack);
      playTrack(newTrack);
      setUrl('');
    }
  };

  const handleAddToPlaylist = async (playlistName: string) => {
    if (url) {
      const newTrack = {
        uuid: uuidv4(),
        name: new URL(url).pathname.split('/').pop() || '',
        description: '',
        url: url
      };
      await addToPlaylist(playlistName, newTrack);
      setIsDialogOpen(false);
      setUrl('');
    }
  };

  const handlePlaylistItemEnd = () => {
    const currentIndex = playlist.findIndex(item => item.url === currentTrack?.url);
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIndex]);
  };

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 border-r">
        <h2 className="text-xl font-bold mb-4">プレイリスト一覧</h2>
        {playlists.map((playlist) => (
          <Button
            key={playlist}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setCurrentPlaylist(playlist)}
          >
            {playlist}
          </Button>
        ))}
      </div>
      <div className="flex-1 p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">音楽プレーヤー</h2>
          {currentTrack && (
            <AudioPlayer
              ref={audioPlayerRef}
              src={currentTrack.url}
              onNext={handlePlaylistItemEnd}
              onPrevious={() => {
                const currentIndex = playlist.findIndex(item => item.url === currentTrack.url);
                const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
                playTrack(playlist[prevIndex]);
              }}
              playlist={playlist}
              onPlaylistItemEnd={handlePlaylistItemEnd}
            />
          )}
        </div>
        <div className="flex mb-4">
          <Input
            type="text"
            placeholder="MP3またはM4AのURLを入力"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 mr-2"
          />
          <Button onClick={handlePlay} className="mr-2">再生</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>プレイリストに追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>プレイリストを選択</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {playlists.map((playlist) => (
                  <Button key={playlist} onClick={() => handleAddToPlaylist(playlist)}>
                    {playlist}
                  </Button>
                ))}
                <Input
                  placeholder="新しいプレイリスト名"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddToPlaylist((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div>
          <Playlist />
        </div>
      </div>
    </div>
  );
}

