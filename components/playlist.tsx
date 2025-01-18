'use client'

import React, { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Trash2, Pencil, Loader2, Music } from 'lucide-react'
import { EditDialog } from './edit-dialog'
import { PlaylistItem } from '../types/interfaces';
import { cn } from "@/lib/utils"

export function Playlist() {
  const { currentPlaylist, playlist, playTrack, updatePlaylistItem, removeFromPlaylist, currentTrack } = usePlayer();
  const [editingItem, setEditingItem] = useState<PlaylistItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handlePlay = (item: PlaylistItem) => {
    playTrack(item);
  };

  const handleDelete = async (item: PlaylistItem) => {
    try {
      setIsDeleting(item.uuid);
      await removeFromPlaylist(item.uuid);
      
      if (item.source === 'local' && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveEdit = async (editedItem: PlaylistItem) => {
    try {
      await updatePlaylistItem(currentPlaylist, editedItem);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
    setEditingItem(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{currentPlaylist}</h2>
      {playlist.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          プレイリストが空です。<br />
          URLまたはファイルを追加してください。
        </div>
      ) : (
        <Table className="relative">
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>説明</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlist.map((item) => (
              <TableRow 
                key={item.uuid} 
                className={cn(
                  "group",
                  currentTrack?.uuid === item.uuid && "bg-primary/10"
                )}
              >
                <TableCell>
                  {item.name || new URL(item.url).pathname.split('/').pop()}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.source === 'local' ? 'ローカル' : 'URL'}
                  </span>
                </TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handlePlay(item)}
                      className={cn(
                        currentTrack?.uuid === item.uuid && "text-primary"
                      )}
                    >
                      {currentTrack?.uuid === item.uuid ? (
                        <Music className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setEditingItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting === item.uuid}
                    >
                      {isDeleting === item.uuid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {editingItem && (
        <EditDialog
          item={editingItem}
          onSave={handleSaveEdit}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

