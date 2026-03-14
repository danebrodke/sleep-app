'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subWeeks } from 'date-fns';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SleepCard from '@/components/SleepCard';
import SleepList from '@/components/SleepList';
import SleepLineGraph from '@/components/SleepLineGraph';
import DateRangeSelector from '@/components/DateRangeSelector';
import ApiTroubleshooter from '@/components/ApiTroubleshooter';
import { fetchSleepData, generateMockData, OuraSleepData } from '@/lib/oura-api';
import { LayoutGrid, List, LineChart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/sleep-utils';

function downloadCSV(data: OuraSleepData[], startDate: Date, endDate: Date) {
  const headers = [
    'Date', 'Bedtime Start', 'Bedtime End', 'Total Sleep', 'Deep Sleep',
    'REM Sleep', 'Light Sleep', 'Awake Time', 'Efficiency %', 'Score',
    'HR Lowest', 'HR Average', 'Temp Delta',
    'Total (seconds)', 'Deep (seconds)', 'REM (seconds)',
    'Light (seconds)', 'Awake (seconds)',
  ];

  const rows = data.map(item => [
    item.day,
    item.bedtime_start,
    item.bedtime_end,
    formatDuration(item.total_sleep_duration),
    formatDuration(item.deep_sleep_duration),
    formatDuration(item.rem_sleep_duration),
    formatDuration(item.light_sleep_duration),
    formatDuration(item.awake_time),
    item.efficiency,
    item.score || '',
    item.hr_lowest || '',
    item.hr_average || '',
    item.temperature_delta || '',
    item.total_sleep_duration,
    item.deep_sleep_duration,
    item.rem_sleep_duration,
    item.light_sleep_duration,
    item.awake_time,
  ]);

  const csv = [headers, ...rows].map(row =>
    row.map(cell => {
      const str = String(cell ?? '');
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sleep-data_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [sleepData, setSleepData] = useState<OuraSleepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [view, setView] = useState<'grid' | 'list' | 'graph'>('grid');
  const [isClient, setIsClient] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = useCallback(async (useMockData = false) => {
    setIsLoading(true);
    setError(null);
    setIsMockData(useMockData);

    try {
      if (!startDate || !endDate) {
        setError('Invalid date range. Please select a start and end date.');
        setIsLoading(false);
        return;
      }

      const formattedStartDate = formatDate(startDate);
      const apiEndDate = new Date(endDate);
      apiEndDate.setDate(apiEndDate.getDate() + 1);
      const formattedEndDate = formatDate(apiEndDate);

      let data;

      if (useMockData) {
        data = generateMockData(formattedStartDate, formattedEndDate);
        setIsMockData(true);
      } else {
        try {
          data = await fetchSleepData(formattedStartDate, formattedEndDate);
          setIsMockData(false);
        } catch (apiError) {
          console.error('API request failed:', apiError);
          setError(`API request failed: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
          const useMock = confirm('Failed to fetch data from Oura API. Would you like to use mock data instead?');
          if (useMock) {
            data = generateMockData(formattedStartDate, formattedEndDate);
            setIsMockData(true);
          } else {
            setIsLoading(false);
            return;
          }
        }
      }

      if (!data || data.length === 0) {
        setError('No sleep data found for the selected date range.');
        setSleepData([]);
      } else {
        const filteredData = data.filter(item => item.total_sleep_duration >= 3600);
        filteredData.sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
        setSleepData(filteredData);
      }
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      setError(`Failed to fetch sleep data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const start = subWeeks(today, 1);
    start.setHours(0, 0, 0, 0);
    setStartDate(start);
    setEndDate(end);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData(isMockData);
    }
  }, [startDate, endDate, retryCount, fetchData, isMockData]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRetry = () => setRetryCount(prev => prev + 1);

  const handleUseMockData = () => {
    setIsMockData(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  if (!isClient) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Sleep Tracker</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Sleep Tracker</h1>

        {startDate && endDate && (
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
          />
        )}

        {isMockData && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            <p className="font-medium">Using mock data</p>
            <p className="text-sm">
              Couldn't connect to the Oura API. Check your API token and internet connection.
            </p>
            <button
              onClick={() => setShowTroubleshooter(true)}
              className="text-yellow-700 underline text-sm mt-1"
            >
              Troubleshoot API connection
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sleep Records</h2>
          <div className="flex items-center gap-2">
            {sleepData.length > 0 && startDate && endDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(sleepData, startDate, endDate)}
                title="Download CSV"
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            )}
            <div className="flex gap-1 ml-2">
              <Button variant={view === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setView('grid')} title="Grid View">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={view === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setView('list')} title="List View">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={view === 'graph' ? 'default' : 'outline'} size="icon" onClick={() => setView('graph')} title="Graph View">
                <LineChart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
            <div className="mt-4 flex space-x-4">
              <button onClick={handleRetry} className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors">
                Retry
              </button>
              <button onClick={handleUseMockData} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors">
                Use Mock Data
              </button>
              <button onClick={() => setShowTroubleshooter(true)} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors">
                Troubleshoot
              </button>
            </div>
          </div>
        ) : sleepData.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">No Data Found</h3>
            <p className="text-yellow-700">No sleep data found for the selected date range.</p>
            <button onClick={handleUseMockData} className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors">
              Use Mock Data
            </button>
          </div>
        ) : (
          view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sleepData.map(item => (
                <SleepCard key={item.id} sleepData={item} />
              ))}
            </div>
          ) : view === 'list' ? (
            <SleepList sleepData={sleepData} />
          ) : (
            <SleepLineGraph sleepData={sleepData} />
          )
        )}
      </div>

      <Dialog open={showTroubleshooter} onOpenChange={setShowTroubleshooter}>
        <DialogContent className="max-w-3xl">
          <ApiTroubleshooter
            onClose={() => setShowTroubleshooter(false)}
            onUseMockData={handleUseMockData}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
