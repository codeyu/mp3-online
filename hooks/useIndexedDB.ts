import { useState, useEffect, useCallback } from 'react';
import { PlaylistItem } from '../types/interfaces';

const DB_NAME = 'MP3PlayerDB';
const DB_VERSION = 1;
const PLAYLISTS_STORE = 'playlists';
const SETTINGS_STORE = 'settings';

export function useIndexedDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
    };

    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
        db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    return () => {
      db?.close();
    };
  }, []);

  const getPlaylists = useCallback(async (): Promise<{ name: string, items: PlaylistItem[] }[]> => {
    if (!db) return [];
    return new Promise((resolve) => {
      const transaction = db.transaction(PLAYLISTS_STORE, 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  }, [db]);

  const getPlaylist = useCallback(async (name: string): Promise<{ name: string, items: PlaylistItem[] } | null> => {
    if (!db) return null;
    return new Promise((resolve) => {
      const transaction = db.transaction(PLAYLISTS_STORE, 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.get(name);
      request.onsuccess = () => resolve(request.result || null);
    });
  }, [db]);

  const addToPlaylist = useCallback(async (playlistName: string, item: PlaylistItem): Promise<void> => {
    if (!db) return;
    
    const transaction = db.transaction(PLAYLISTS_STORE, 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    
    // 直接获取并更新，不使用Promise包装
    const request = store.get(playlistName);
    
    request.onsuccess = () => {
      const playlist = request.result || { name: playlistName, items: [] };
      playlist.items = [...playlist.items, item];
      store.put(playlist);
    };
  }, [db]);

  const updatePlaylistItem = useCallback(async (playlistName: string, updatedItem: PlaylistItem): Promise<void> => {
    if (!db) return;
    
    const transaction = db.transaction(PLAYLISTS_STORE, 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    
    const request = store.get(playlistName);
    
    request.onsuccess = () => {
      const playlist = request.result;
      if (playlist) {
        playlist.items = playlist.items.map(item =>
          item.uuid === updatedItem.uuid ? updatedItem : item
        );
        store.put(playlist);
      }
    };
  }, [db]);

  const saveSetting = useCallback(async (key: string, value: any): Promise<void> => {
    if (!db) return;
    
    const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    store.put({ key, value });
  }, [db]);

  const getSetting = useCallback(async (key: string): Promise<any> => {
    if (!db) return null;
    return new Promise((resolve) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
    });
  }, [db]);

  return {
    getPlaylists,
    getPlaylist,
    addToPlaylist,
    updatePlaylistItem,
    saveSetting,
    getSetting,
  };
}

