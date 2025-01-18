'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Link, Upload } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentTrack, addToPlaylist, playlists, refreshPlaylists, setCurrentPlaylist, currentPlaylist, playlist, playTrack } = usePlayer();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlay = async () => {
    if (url) {
      const newTrack = {
        uuid: uuidv4(),
        name: new URL(url).pathname.split('/').pop() || '',
        description: '',
        url: url,
        source: 'url' as const
      };
      await addToPlaylist(currentPlaylist, newTrack);
      playTrack(newTrack);
      setUrl('');
    }
  };

  const handleFileUpload = async (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    const newTrack = {
      uuid: uuidv4(),
      name: file.name,
      description: '',
      url: blobUrl,
      source: 'local' as const,
      file: file
    };
    await addToPlaylist(currentPlaylist, newTrack);
    playTrack(newTrack);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddToPlaylist = async (playlistName: string) => {
    if (url) {
      const newTrack = {
        uuid: uuidv4(),
        name: new URL(url).pathname.split('/').pop() || '',
        description: '',
        url: url,
        source: 'url' as const
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

        <Tabs defaultValue="url" className="mb-4">
          <TabsList className="mb-4">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URLから追加
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              ファイルから追加
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="flex gap-2">
            <Input
              type="text"
              placeholder="MP3またはM4AのURLを入力"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handlePlay} className="whitespace-nowrap">再生</Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">プレイリストに追加</Button>
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
          </TabsContent>

          <TabsContent value="file">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/mp3,audio/m4a"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-4">
                MP3またはM4Aファイルをドラッグ＆ドロップ、または
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                ファイルを選択
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Playlist />
      </div>
    </div>
  );
}

