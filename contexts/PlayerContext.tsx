'use client'

import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { useIndexedDB} from '../hooks/useIndexedDB';
import { PlaylistItem, Playlist } from '../types/interfaces';
interface PlayerContextType {
  currentPlaylist: string;
  setCurrentPlaylist: (playlist: string) => void;
  currentTrack: PlaylistItem | null;
  setCurrentTrack: (track: PlaylistItem | null) => void;
  addToPlaylist: (playlistName: string, item: PlaylistItem) => Promise<void>;
  playlists: string[];
  refreshPlaylists: () => Promise<void>;
  getCurrentPlaylistItems: () => Promise<PlaylistItem[]>;
  playlist: PlaylistItem[];
  setPlaylist: (playlist: PlaylistItem[]) => void;
  playTrack: (track: PlaylistItem) => void;
  updatePlaylistItem: (playlistName: string, updatedItem: PlaylistItem) => Promise<void>;
  audioRef: React.RefObject<HTMLAudioElement>;
  removeFromPlaylist: (uuid: string) => Promise<void>;
  updatePlaylistName: (oldName: string, newName: string) => Promise<void>;
  currentPlayingPlaylist: string;
  setCurrentPlayingPlaylist: (playlist: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState<string>('デフォルト');
  const [currentPlayingPlaylist, setCurrentPlayingPlaylist] = useState<string>('デフォルト');
  const [currentTrack, setCurrentTrack] = useState<PlaylistItem | null>(null);
  const [playlists, setPlaylists] = useState<string[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const { addToPlaylist: addToIndexedDB, getPlaylists, getPlaylist, updatePlaylistItem: updatePlaylistItemIndexedDB, removeFromPlaylist: removeFromIndexedDB } = useIndexedDB();
  const audioRef = useRef<HTMLAudioElement>(null);

  const refreshPlaylists = useCallback(async () => {
    const fetchedPlaylists = await getPlaylists();
    setPlaylists(fetchedPlaylists.map(p => p.name));
  }, [getPlaylists]);

  // 初期化時にプレイリストを読み込む
  useEffect(() => {
    const initializePlaylists = async () => {
      try {
        await refreshPlaylists();
        
        // 現在のプレイリストの曲を取得
        const currentPlaylistData = await getPlaylist(currentPlaylist);
        console.log('Current playlist data:', currentPlaylistData);
        
        if (currentPlaylistData) {
          setPlaylist(currentPlaylistData.items || []);
        } else {
          // デフォルトプレイリストが存在しない場合は空の配列を設定
          console.log('Creating empty default playlist...');
          await addToIndexedDB(currentPlaylist, {
            uuid: 'default',
            name: 'プレイリストが空です',
            description: 'URLまたはファイルを追加してください',
            url: '',
            source: 'url' as const
          });
          setPlaylist([]);
        }
      } catch (error) {
        console.error('Failed to initialize playlists:', error);
        setPlaylist([]); // エラー時も空の配列を設定
      }
    };

    initializePlaylists();
  }, [refreshPlaylists, getPlaylist, currentPlaylist, addToIndexedDB]);

  // プレイリスト変更時の処理
  useEffect(() => {
    const loadPlaylistItems = async () => {
      try {
        const playlistData = await getPlaylist(currentPlaylist);
        if (playlistData) {
          setPlaylist(playlistData.items || []);
        } else {
          setPlaylist([]);
        }
      } catch (error) {
        console.error('Failed to load playlist items:', error);
      }
    };

    loadPlaylistItems();
  }, [currentPlaylist, getPlaylist]);

  const addToPlaylist = useCallback(async (playlistName: string, item: PlaylistItem) => {
    await addToIndexedDB(playlistName, item);
    await refreshPlaylists();
    if (playlistName === currentPlaylist) {
      setPlaylist(prev => [...prev, item]);
    }
  }, [addToIndexedDB, refreshPlaylists, currentPlaylist]);

  const updatePlaylistItem = useCallback(async (playlistName: string, updatedItem: PlaylistItem) => {
    await updatePlaylistItemIndexedDB(playlistName, updatedItem);
    if (playlistName === currentPlaylist) {
      setPlaylist(prevPlaylist => 
        prevPlaylist.map(item => item.uuid === updatedItem.uuid ? updatedItem : item)
      );
    }
    if (currentTrack && currentTrack.uuid === updatedItem.uuid) {
      setCurrentTrack(updatedItem);
    }
  }, [updatePlaylistItemIndexedDB, currentPlaylist, currentTrack]);

  const playTrack = useCallback((track: PlaylistItem) => {
    const validTrack = playlist.find(item => item.uuid === track.uuid);
    if (!validTrack) {
      console.error('Invalid track UUID:', track.uuid);
      return;
    }

    setCurrentTrack(validTrack);
    setCurrentPlayingPlaylist(currentPlaylist); // 设置当前正在播放的播放列表

    if (audioRef.current) {
      audioRef.current.src = validTrack.url;
      audioRef.current.play().catch(error => {
        console.error('Failed to play track:', error);
      });
    }
  }, [playlist, currentPlaylist]);

  const removeFromPlaylist = useCallback(async (uuid: string) => {
    try {
      // 如果要删除的是当前播放的曲目，先停止播放
      if (currentTrack?.uuid === uuid) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentTrack(null);
      }

      await removeFromIndexedDB(currentPlaylist, uuid);
      
      // 更新当前播放列表
      const updatedPlaylist = await getPlaylist(currentPlaylist);
      if (updatedPlaylist) {
        setPlaylist(updatedPlaylist.items);
      }

      console.log('Removed track from playlist:', { playlist: currentPlaylist, uuid });
    } catch (error) {
      console.error('Error removing from playlist:', error);
    }
  }, [currentPlaylist, currentTrack, removeFromIndexedDB, getPlaylist]);

  const updatePlaylistName = useCallback(async (oldName: string, newName: string) => {
    try {
      if (oldName === newName) return;

      // 获取旧播放列表的数据
      const playlistData = await getPlaylist(oldName);
      if (!playlistData) return;

      // 使用新名称创建播放列表
      const newPlaylistData = {
        ...playlistData,
        name: newName,
      };

      // 保存新播放列表
      await addToIndexedDB(newName, ...playlistData.items);

      // 如果是当前播放列表，更新当前播放列表名称
      if (currentPlaylist === oldName) {
        setCurrentPlaylist(newName);
      }

      // 刷新播放列表
      await refreshPlaylists();
    } catch (error) {
      console.error('Error updating playlist name:', error);
    }
  }, [currentPlaylist, getPlaylist, addToIndexedDB, refreshPlaylists]);

  const value = useMemo(() => ({
    currentPlaylist,
    setCurrentPlaylist,
    currentTrack,
    setCurrentTrack,
    playlists,
    playlist,
    addToPlaylist,
    playTrack,
    updatePlaylistItem,
    refreshPlaylists,
    audioRef,
    removeFromPlaylist,
    updatePlaylistName,
    currentPlayingPlaylist,
    setCurrentPlayingPlaylist,
  }), [
    currentPlaylist,
    currentTrack,
    playlists,
    playlist,
    addToPlaylist,
    playTrack,
    updatePlaylistItem,
    refreshPlaylists,
    audioRef,
    removeFromPlaylist,
    updatePlaylistName,
    currentPlayingPlaylist,
    setCurrentPlayingPlaylist
  ]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

