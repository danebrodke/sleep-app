import { format, parseISO } from 'date-fns';
import { OuraSleepData } from './oura-api';

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${hours}h ${minutes}m`;
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'EEE MMM d, yyyy');
}

export function formatTime(dateTimeString: string): string {
  return format(parseISO(dateTimeString), 'h:mm a');
}

export function formatSleepEfficiency(efficiency: number): string {
  return `${Math.round(efficiency)}%`;
}

export function getSleepStagePercentage(sleepData: OuraSleepData, stage: 'deep' | 'rem' | 'light'): number {
  const totalSleep = sleepData.total_sleep_duration;
  
  if (totalSleep === 0) return 0;
  
  switch (stage) {
    case 'deep':
      return (sleepData.deep_sleep_duration / totalSleep) * 100;
    case 'rem':
      return (sleepData.rem_sleep_duration / totalSleep) * 100;
    case 'light':
      return (sleepData.light_sleep_duration / totalSleep) * 100;
    default:
      return 0;
  }
}

export function getHypnogramColors(): { [key: number]: string } {
  return {
    1: '#3B82F6', // Deep sleep - Blue
    2: '#A3E635', // Light sleep - Lime
    3: '#EC4899', // REM sleep - Pink
    4: '#9CA3AF', // Awake - Gray
  };
} 