'use client';

import { useState, useEffect } from 'react';
import { format, subMonths, subWeeks } from 'date-fns';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SleepCard from '@/components/SleepCard';
import SleepList from '@/components/SleepList';
import SleepLineGraph from '@/components/SleepLineGraph';
import DateRangeSelector from '@/components/DateRangeSelector';
import ApiTroubleshooter from '@/components/ApiTroubleshooter';
import { fetchSleepData, generateMockData, OuraSleepData } from '@/lib/oura-api';
import { getSleepNotes } from '@/lib/sleep-notes-service';
import { SleepDataWithNotes } from '@/lib/types';
import { LayoutGrid, List, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [sleepData, setSleepData] = useState<SleepDataWithNotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [view, setView] = useState<'grid' | 'list' | 'graph'>('grid');
  const [isClient, setIsClient] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Add useEffect to set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = async (useMockData = false) => {
    setIsLoading(true);
    setError(null);
    setIsMockData(useMockData);
    
    try {
      // Make sure startDate and endDate are not null
      if (!startDate || !endDate) {
        setError('Invalid date range. Please select a start and end date.');
        setIsLoading(false);
        return;
      }
      
      // Format dates for API requests
      const formattedStartDate = formatDate(startDate);
      const apiEndDate = new Date(endDate);
      apiEndDate.setDate(apiEndDate.getDate() + 1);
      const formattedEndDate = formatDate(apiEndDate);
      
      console.log('Fetching data for date range:', formattedStartDate, 'to', formattedEndDate);
      console.log('Raw date objects:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      let sleepData;
      
      if (useMockData) {
        // Use mock data if requested
        console.log('Using mock data as requested');
        sleepData = generateMockData(formattedStartDate, formattedEndDate);
        setIsMockData(true);
      } else {
        try {
          // Fetch real data from API
          console.log('Fetching real data from API');
          sleepData = await fetchSleepData(formattedStartDate, formattedEndDate);
          setIsMockData(false);
        } catch (apiError) {
          console.error('API request failed:', apiError);
          setError(`API request failed: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
          
          // Ask user if they want to use mock data
          const useMock = confirm('Failed to fetch data from Oura API. Would you like to use mock data instead?');
          if (useMock) {
            console.log('Falling back to mock data due to API error');
            sleepData = generateMockData(formattedStartDate, formattedEndDate);
            setIsMockData(true);
          } else {
            setIsLoading(false);
            return;
          }
        }
      }
      
      if (!sleepData || sleepData.length === 0) {
        console.warn('No sleep data returned');
        setError('No sleep data found for the selected date range.');
        setSleepData([]);
      } else {
        console.log(`Received ${sleepData.length} sleep records`);
        
        // Log all days in the data for debugging
        console.log('All sleep days before filtering:', sleepData.map(item => item.day));
        
        // Filter out naps (sleep sessions less than 1 hour)
        const filteredData = sleepData.filter(item => item.total_sleep_duration >= 3600); // 3600 seconds = 1 hour
        
        console.log(`After filtering naps, ${filteredData.length} sleep records remain`);
        console.log('All sleep days after filtering:', filteredData.map(item => item.day));
        
        // Add detailed debugging for the first record
        if (filteredData.length > 0) {
          console.log('First sleep record details:', JSON.stringify(filteredData[0], null, 2));
        }
        
        // Fetch sleep notes from Supabase
        try {
          const notes = await getSleepNotes(formattedStartDate, formattedEndDate);
          console.log(`Fetched ${notes.length} sleep notes`);
          
          // Combine the data
          const combinedData = filteredData.map(sleepItem => {
            const matchingNote = notes.find(note => note.sleep_date === sleepItem.day);
            return {
              ...sleepItem,
              notes: matchingNote || undefined
            };
          });
          
          // Sort by date (newest first)
          combinedData.sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
          
          console.log('Combined data first record:', JSON.stringify(combinedData[0], null, 2));
          
          setSleepData(combinedData);
        } catch (notesError) {
          console.error('Error fetching notes:', notesError);
          // Still use the sleep data even if notes fail
          
          // Sort by date (newest first)
          filteredData.sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
          
          setSleepData(filteredData);
        }
      }
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      setError(`Failed to fetch sleep data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to set initial date range and fetch data when component mounts
  useEffect(() => {
    // Set initial date range to last week (similar to the DateRangeSelector's "Last Week" button)
    const today = new Date();
    
    // Set to today at 23:59:59.999 to ensure today is fully included
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    // Set start date to 1 week ago
    const startDate = subWeeks(today, 1);
    startDate.setHours(0, 0, 0, 0);
    
    setStartDate(startDate);
    setEndDate(endDate);
  }, []);

  // Effect to fetch data when date range changes or retry count changes
  useEffect(() => {
    if (startDate && endDate) {
      fetchData(isMockData);
    }
  }, [startDate, endDate, retryCount]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleUseMockData = () => {
    // Force using mock data
    setIsMockData(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  // Show a loading state until client-side code has executed
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
            <p className="font-medium">⚠️ Using mock data</p>
            <p className="text-sm">
              You're currently viewing mock data because we couldn't connect to the Oura API.
              Please check your API token and internet connection.
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
          <div className="flex space-x-2">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setView('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setView('list')}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'graph' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setView('graph')}
              title="Graph View"
            >
              <LineChart className="h-4 w-4" />
            </Button>
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
              <button 
                onClick={handleRetry} 
                className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
              <button 
                onClick={handleUseMockData} 
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
              >
                Use Mock Data
              </button>
              <button 
                onClick={() => setShowTroubleshooter(true)}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                Troubleshoot
              </button>
            </div>
          </div>
        ) : sleepData.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">No Data Found</h3>
            <p className="text-yellow-700">No sleep data found for the selected date range.</p>
            <p className="text-yellow-700 mt-2">Try selecting a different date range or using mock data.</p>
            <button 
              onClick={handleUseMockData} 
              className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
            >
              Use Mock Data
            </button>
          </div>
        ) : (
          view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sleepData.map(item => (
                <SleepCard 
                  key={item.id} 
                  sleepData={item} 
                  onNotesUpdated={handleRetry} 
                />
              ))}
            </div>
          ) : view === 'list' ? (
            <SleepList 
              sleepData={sleepData} 
              onNotesUpdated={handleRetry} 
            />
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
  // Format date as YYYY-MM-DD for API requests
  return format(date, 'yyyy-MM-dd');
}
