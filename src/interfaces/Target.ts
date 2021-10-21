import { Coordinates } from '../helper/ChromeApi';

export type TargetStatusInactive = 'status_abbr_inactive';
export type TargetStatusActive = 'status_abbr_active';
export type TargetStatusHonorable = 'status_abbr_honorableTarget';
export type TargetStatusStrong = 'status_abbr_strong';
export type TargetStatusVacation = 'status_abbr_vacation';
export type TargetStatusNoob = 'status_abbr_noob';
export type TargetStatusUnknown = 'status_abbr_unknown';

export type TargetStatus = TargetStatusInactive | TargetStatusActive | TargetStatusHonorable | TargetStatusStrong | TargetStatusVacation | TargetStatusNoob | TargetStatusUnknown;

export enum TargetStatusKey {
  Inactive = 'status_abbr_inactive',
  Active = 'status_abbr_active',
  Honorable = 'status_abbr_honorableTarget',
  Strong = 'status_abbr_strong',
  Vacation = 'status_abbr_vacation',
  Noob = 'status_abbr_noob',
  Unknown = 'status_abbr_unknown',
}

export enum TargetStatusValue {
  Inactive = 'Inactive',
  Active = 'Active',
  Honorable = 'Honnorable',
  Strong = 'Strong',
  Vacation = 'Vacation',
  Noob = 'Noob',
  Unknown = 'Unknown',
}

export interface Target {
  name: string;
  status: TargetStatus;
  coordinates: Coordinates;
  lastscan: number;
}
