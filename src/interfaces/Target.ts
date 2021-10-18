import { Coordinates } from '../helper/ChromeApi';

export interface Target {
  name: string;
  coordinates: Coordinates;
  lastscan: number;
}
