export type Theme = 'space' | 'ocean' | 'forest' | 'city';
export type TrackKind = 'melody' | 'bass' | 'rain' | 'wind' | 'bells' | 'upload';
export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  emoji: string;
  color: string;
  volume: number;
  enabled: boolean;
  buffer?: AudioBuffer;
}
export interface Preset {
  theme: Theme;
  bpm: number;
  volumes: Partial<Record<Exclude<TrackKind, 'upload'>, number>>;
  label: string;
  description: string;
}
