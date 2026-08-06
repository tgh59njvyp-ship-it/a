export interface PinItem {
  id: string;
  title: string;
  description: string;
  originalUrl: string;
  mediumUrl: string;
  thumbnailUrl: string;
  link: string;
  width?: number;
  height?: number;
  boardTitle?: string;
}

export interface BoardData {
  url: string;
  title: string;
  description?: string;
  author?: string;
  authorAvatar?: string;
  pinCount: number;
  pins: PinItem[];
  fetchedAt: string;
}

export type ImageQuality = 'original' | 'high' | 'medium';

export interface PresetBoard {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  coverImage: string;
  pins: PinItem[];
}

export interface SearchHistoryItem {
  id: string;
  url: string;
  title: string;
  pinCount: number;
  coverImage: string;
  timestamp: number;
}
