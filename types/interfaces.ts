export interface PlaylistItem {
    uuid: string;
    name: string;
    description: string;
    url: string;
    source: string;
}
  
export interface Playlist {
    name: string;
    items: PlaylistItem[];
}