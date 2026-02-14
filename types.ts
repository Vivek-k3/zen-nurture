export enum NavigationItem {
  TODAY = 'today',
  REMINDERS = 'reminders',
  TRENDS = 'trends',
  RECORDS = 'records',
  SETTINGS = 'settings'
}

export type EventType = 'FEED_BOTTLE' | 'FEED_BREAST' | 'DIAPER' | 'MED_DOSE' | 'SLEEP' | 'GROWTH' | 'NOTE' | 'VACCINE';

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: string; // ISO string
  notes?: string;
  caregiverId?: string;
}

export interface FeedBottleEvent extends BaseEvent {
  type: 'FEED_BOTTLE';
  payload: {
    amountMl: number;
    formulaName?: string;
  };
}

export interface FeedBreastEvent extends BaseEvent {
  type: 'FEED_BREAST';
  payload: {
    side: 'left' | 'right' | 'both';
    durationMin: number;
  };
}

export interface DiaperEvent extends BaseEvent {
  type: 'DIAPER';
  payload: {
    kind: 'wet' | 'dirty' | 'mixed';
    color?: string;
    rash?: boolean;
  };
}

export interface MedEvent extends BaseEvent {
  type: 'MED_DOSE';
  payload: {
    medicineName: string;
    doseValue: number;
    doseUnit: string;
    outcome: 'taken' | 'skipped' | 'vomited';
  };
}

export interface SleepEvent extends BaseEvent {
  type: 'SLEEP';
  payload: {
    endTs?: string; // If null, currently sleeping
    kind: 'nap' | 'night';
  };
}

export type ZenEvent = FeedBottleEvent | FeedBreastEvent | DiaperEvent | MedEvent | SleepEvent;

export interface ReminderRule {
  id: string;
  category: 'feed' | 'diaper' | 'medicine' | 'vaccine' | 'custom';
  title: string;
  trigger: string; // "3h after last feed"
  enabled: boolean;
}

export interface BabyProfile {
  name: string;
  dob: string;
  weightKg: number;
  heightCm: number;
}
