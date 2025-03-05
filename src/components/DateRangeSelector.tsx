'use client';

import { Button } from '@/components/ui/button';
import { addDays, format, subDays, subMonths, subWeeks } from 'date-fns';

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
  // Set to today at 11:59pm to ensure today is fully included
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const handleSelectLastWeek = () => {
    const end = todayEnd;
    const start = subWeeks(today, 1);
    onDateRangeChange(start, end);
  };

  const handleSelectLastMonth = () => {
    const end = todayEnd;
    const start = subMonths(today, 1);
    onDateRangeChange(start, end);
  };

  const handleSelectLastThreeMonths = () => {
    const end = todayEnd;
    const start = subMonths(today, 3);
    onDateRangeChange(start, end);
  };

  const handleNavigatePrevious = () => {
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newEndDate = subDays(startDate, 1);
    const newStartDate = subDays(startDate, daysDiff + 1);
    onDateRangeChange(newStartDate, newEndDate);
  };

  const handleNavigateNext = () => {
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStartDate = addDays(endDate, 1);
    const newEndDate = addDays(endDate, daysDiff + 1);
    
    // Don't allow navigating into the future
    if (newEndDate > todayEnd) {
      return;
    }
    
    onDateRangeChange(newStartDate, newEndDate);
  };

  return (
    <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center w-full mb-6">
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={handleSelectLastWeek}>
          Last Week
        </Button>
        <Button variant="outline" size="sm" onClick={handleSelectLastMonth}>
          Last Month
        </Button>
        <Button variant="outline" size="sm" onClick={handleSelectLastThreeMonths}>
          Last 3 Months
        </Button>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={handleNavigatePrevious}>
          <span className="sr-only">Previous</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </Button>
        
        <div className="text-sm font-medium">
          {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleNavigateNext}
          disabled={endDate >= todayEnd}
        >
          <span className="sr-only">Next</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </Button>
      </div>
    </div>
  );
} 