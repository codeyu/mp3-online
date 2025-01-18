export interface PlaylistItem {
    uuid: string;
    name: string;
    description: string;
    url: string;
}
  
export interface Playlist {
    name: string;
    items: PlaylistItem[];
}