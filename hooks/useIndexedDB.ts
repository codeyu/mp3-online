import { useState, useEffect } from 'react';
import { PlaylistItem, Playlist } from '../types/interfaces';
const DB_NAME = 'MP3PlayerDB';
const DB_VERSION = 1;
const PLAYLISTS_STORE = 'playlists';

export function useIndexedDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
    };

    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'name' });
    };
  }, []);

  const addToPlaylist = async (playlistName: string, item: PlaylistItem) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([PLAYLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.get(playlistName);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const playlist = request.result || { name: playlistName, items: [] };
        playlist.items.push(item);
        store.put(playlist);
        resolve();
      };
    });
  };

  const getPlaylists = async (): Promise<Playlist[]> => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLAYLISTS_STORE], 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const getPlaylist = async (playlistName: string): Promise<Playlist | null> => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLAYLISTS_STORE], 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.get(playlistName);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  };

  const updatePlaylistItem = async (playlistName: string, updatedItem: PlaylistItem) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([PLAYLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.get(playlistName);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const playlist = request.result;
        if (playlist) {
          const itemIndex = playlist.items.findIndex((item: PlaylistItem) => item.uuid === updatedItem.uuid);
          if (itemIndex !== -1) {
            playlist.items[itemIndex] = updatedItem;
            store.put(playlist);
            resolve();
          } else {
            reject(new Error('Item not found in playlist'));
          }
        } else {
          reject(new Error('Playlist not found'));
        }
      };
    });
  };

  return { addToPlaylist, getPlaylists, getPlaylist, updatePlaylistItem };
}

