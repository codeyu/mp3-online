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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState<string>('デフォルト');
  const [currentTrack, setCurrentTrack] = useState<PlaylistItem | null>(null);
  const [playlists, setPlaylists] = useState<string[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const { addToPlaylist: addToIndexedDB, getPlaylists, getPlaylist, updatePlaylistItem: updatePlaylistItemIndexedDB } = useIndexedDB();
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
        if (currentPlaylistData) {
          setPlaylist(currentPlaylistData.items || []);
        } else {
          // デフォルトプレイリストが存在しない場合は作成
          await addToIndexedDB(currentPlaylist, {
            uuid: 'default',
            name: 'Welcome',
            description: 'Welcome to MP3 Online Player',
            url: ''
          });
          setPlaylist([]);
        }
      } catch (error) {
        console.error('Failed to initialize playlists:', error);
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
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play();
    }
  }, []);

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
  }), [
    currentPlaylist,
    currentTrack,
    playlists,
    playlist,
    addToPlaylist,
    playTrack,
    updatePlaylistItem,
    refreshPlaylists,
    audioRef
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

