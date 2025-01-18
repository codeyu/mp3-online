'use client'

import React, { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Trash2, Pencil } from 'lucide-react'
import { EditDialog } from './edit-dialog'
import { PlaylistItem } from '../types/interfaces';

export function Playlist() {
  const { currentPlaylist, playlist, playTrack, updatePlaylistItem, currentTrack } = usePlayer();
  const [editingItem, setEditingItem] = useState<PlaylistItem | null>(null);

  const handlePlay = (item: PlaylistItem) => {
    playTrack(item);
  };

  const handleDelete = async (item: PlaylistItem) => {
    // 削除の実装はここに追加します
    console.log('Delete item:', item);
  };

  const handleEdit = (item: PlaylistItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async (editedItem: PlaylistItem) => {
    try {
      await updatePlaylistItem(currentPlaylist, editedItem);
      // 成功メッセージを表示するなどの処理をここに追加できます
    } catch (error) {
      console.error('Failed to update item:', error);
      // エラーメッセージを表示するなどの処理をここに追加できます
    }
    setEditingItem(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{currentPlaylist}</h2>
      <Table className="relative">
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>説明</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="relative">
          {playlist.map((item) => (
            <TableRow 
              key={item.uuid} 
              className={`group ${currentTrack?.uuid === item.uuid ? 'bg-primary/10' : ''}`}
            >
              <TableCell>{item.name || new URL(item.url).pathname.split('/').pop()}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button size="icon" variant="ghost" onClick={() => handlePlay(item)}>
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

