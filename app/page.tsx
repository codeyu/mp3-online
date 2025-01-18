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
import { Link, Upload, Pencil, Check } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editedPlaylistName, setEditedPlaylistName] = useState('');
  const { currentTrack, addToPlaylist, playlists, refreshPlaylists, setCurrentPlaylist, currentPlaylist, playlist, playTrack, updatePlaylistName } = usePlayer();
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
      console.log('Added track to playlist:', { playlist: currentPlaylist, track: newTrack });

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
    console.log('Added file to playlist:', { playlist: currentPlaylist, track: newTrack });

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
      console.log('Added track to playlist via dialog:', { playlist: playlistName, track: newTrack });
      setIsDialogOpen(false);
      setUrl('');
    }
  };

  const handlePlaylistItemEnd = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(item => item.uuid === currentTrack.uuid);
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIndex]);
  };

  const handleEditPlaylist = (name: string) => {
    setEditingPlaylist(name);
    setEditedPlaylistName(name);
  };

  const handleSavePlaylistName = async () => {
    if (editingPlaylist && editedPlaylistName.trim()) {
      await updatePlaylistName(editingPlaylist, editedPlaylistName.trim());
      setEditingPlaylist(null);
    }
  };

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-muted p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">プレイリスト</h2>
        <div className="space-y-2">
          {playlists.map((name) => (
            <div
              key={name}
              className={`group flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer ${
                currentPlaylist === name ? 'bg-primary/10' : ''
              }`}
              onClick={() => {
                if (!editingPlaylist) {
                  setCurrentPlaylist(name);
                }
              }}
            >
              {editingPlaylist === name ? (
                <Input
                  value={editedPlaylistName}
                  onChange={(e) => setEditedPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePlaylistName();
                    } else if (e.key === 'Escape') {
                      setEditingPlaylist(null);
                    }
                  }}
                  className="h-6 text-sm"
                  autoFocus
                />
              ) : (
                <span className="flex-1">{name}</span>
              )}
              {editingPlaylist === name ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-100"
                  onClick={handleSavePlaylistName}
                >
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPlaylist(name);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="mb-8">
          {currentTrack && (
            <AudioPlayer
              ref={audioPlayerRef}
              src={currentTrack.url}
              onNext={handlePlaylistItemEnd}
              onPrevious={() => {
                if (!currentTrack || playlist.length === 0) return;
                const currentIndex = playlist.findIndex(item => item.uuid === currentTrack.uuid);
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

