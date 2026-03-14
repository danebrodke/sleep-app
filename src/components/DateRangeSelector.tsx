'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { addDays, format, subDays, subMonths, subWeeks, differenceInDays } from 'date-fns';

type Preset = 'week' | 'month' | '3months' | 'custom';

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

export default function DateRangeSelector({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeSelectorProps) {
  const today = new Date();
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [activePreset, setActivePreset] = useState<Preset>('week');
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(format(startDate, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(endDate, 'yyyy-MM-dd'));
  const customRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomStart(format(startDate, 'yyyy-MM-dd'));
    setCustomEnd(format(endDate, 'yyyy-MM-dd'));
  }, [startDate, endDate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customRef.current && !customRef.current.contains(e.target as Node)) {
        setShowCustom(false);
      }
    }
    if (showCustom) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustom]);

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset);
    setShowCustom(false);
    const end = new Date(todayEnd);
    let start: Date;
    switch (preset) {
      case 'week':
        start = subWeeks(today, 1);
        break;
      case 'month':
        start = subMonths(today, 1);
        break;
      case '3months':
        start = subMonths(today, 3);
        break;
      default:
        return;
    }
    start.setHours(0, 0, 0, 0);
    onDateRangeChange(start, end);
  };

  const handleCustomApply = () => {
    const start = new Date(customStart + 'T00:00:00');
    const end = new Date(customEnd + 'T23:59:59.999');
    if (start > end) return;
    if (end > todayEnd) return;
    setActivePreset('custom');
    setShowCustom(false);
    onDateRangeChange(start, end);
  };

  const handleNavigatePrevious = () => {
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newEndDate = subDays(startDate, 1);
    const newStartDate = subDays(startDate, daysDiff + 1);
    setActivePreset('custom');
    onDateRangeChange(newStartDate, newEndDate);
  };

  const handleNavigateNext = () => {
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStartDate = addDays(endDate, 1);
    const newEndDate = addDays(endDate, daysDiff + 1);
    if (newEndDate > todayEnd) return;
    setActivePreset('custom');
    onDateRangeChange(newStartDate, newEndDate);
  };

  const days = differenceInDays(endDate, startDate);
  const rangeLabel = days <= 8 ? 'Last Week' : days <= 32 ? 'Last Month' : days <= 95 ? 'Last 3 Months' : `${days} days`;

  return (
    <div className="flex flex-col gap-3 w-full mb-6">
      {/* Top row: presets + custom toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          ['week', 'Last Week'],
          ['month', 'Last Month'],
          ['3months', 'Last 3 Months'],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            variant={activePreset === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyPreset(key)}
            className="text-sm"
          >
            {label}
          </Button>
        ))}

        <div className="relative" ref={customRef}>
          <Button
            variant={activePreset === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm"
          >
            Custom Range
          </Button>

          {showCustom && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[300px]">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">From</label>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    max={format(today, 'yyyy-MM-dd')}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <Button size="sm" onClick={handleCustomApply} className="w-full">
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: navigation + date display */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNavigatePrevious}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Button>

        <div className="text-sm font-medium text-muted-foreground">
          {format(startDate, 'MMM d, yyyy')} — {format(endDate, 'MMM d, yyyy')}
          <span className="ml-2 text-xs opacity-60">({days} days)</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleNavigateNext}
          disabled={endDate >= todayEnd}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </Button>
      </div>
    </div>
  );
}
