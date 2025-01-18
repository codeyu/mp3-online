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
import { Link, Upload, Pencil, Check, Music } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Home() {
  const [url, setUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editedPlaylistName, setEditedPlaylistName] = useState('');
  const { currentTrack, addToPlaylist, playlists, refreshPlaylists, setCurrentPlaylist, currentPlaylist, currentPlayingPlaylist, playlist, playTrack, updatePlaylistName } = usePlayer();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setEditingPlaylist(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-muted p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">プレイリスト</h2>
        <div className="space-y-0.5">
          {playlists.map((name, index) => (
            <div
              key={name}
              className={cn(
                "relative group flex items-center justify-between p-2 rounded-md",
                "hover:bg-accent/50 transition-colors duration-200",
                "border-b border-border/30",
                currentPlaylist === name && "bg-accent/70 hover:bg-accent/70",
                editingPlaylist === name ? '' : 'cursor-pointer',
                index === playlists.length - 1 && "border-b-0"
              )}
              onClick={() => {
                if (!editingPlaylist) {
                  setCurrentPlaylist(name);
                }
              }}
            >
              <div className="flex items-center flex-1 min-w-0">
                {editingPlaylist === name ? (
                  <div onClick={(e) => e.stopPropagation()} className="flex-1">
                    <Input
                      ref={inputRef}
                      value={editedPlaylistName}
                      onChange={(e) => setEditedPlaylistName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSavePlaylistName();
                        } else if (e.key === 'Escape') {
                          setEditingPlaylist(null);
                        }
                      }}
                      className="h-6 text-sm cursor-text"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className={cn(
                      "truncate",
                      currentPlaylist === name && "font-medium"
                    )}>
                      {name}
                    </span>
                    {currentPlayingPlaylist === name && (
                      <div className="flex items-center gap-1 text-primary">
                        <Music className="h-3.5 w-3.5 animate-pulse" />
                        <span className="text-xs">再生中</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {editingPlaylist === name ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-100 flex-shrink-0 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSavePlaylistName();
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPlaylist(name);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}

              {currentPlaylist === name && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
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

