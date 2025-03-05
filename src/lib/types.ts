import { OuraSleepData } from './oura-api';

export interface SleepNote {
  id: string;
  sleep_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SleepDataWithNotes extends OuraSleepData {
  notes?: SleepNote;
} 