'use client';

import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';

export default function TestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [token, setToken] = useState<string>('');
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    // Get the token from environment variables
    const ouraToken = process.env.NEXT_PUBLIC_OURA_TOKEN || 'K7YZPNFESE2ZGRETPXXYEFNAXV5473HB';
    setToken(ouraToken);
    
    // Check environment variables
    setEnvVars({
      NEXT_PUBLIC_OURA_TOKEN: process.env.NEXT_PUBLIC_OURA_TOKEN ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY ? 'Set' : 'Not set'
    });
    
    // Test the API
    testApi();
  }, []);

  const testApi = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get date range (last month to today)
      const today = new Date();
      const oneMonthAgo = subMonths(today, 1);
      
      // Format dates for API requests
      const formattedStartDate = format(oneMonthAgo, 'yyyy-MM-dd');
      const formattedEndDate = format(today, 'yyyy-MM-dd');
      
      console.log('Testing API with date range:', formattedStartDate, 'to', formattedEndDate);
      
      // Test detailed sleep endpoint
      await testDetailedSleepEndpoint(formattedStartDate, formattedEndDate);
      
      // Test daily sleep summary endpoint
      await testDailySleepSummaryEndpoint(formattedStartDate, formattedEndDate);
      
    } catch (err: any) {
      console.error('Error testing API:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testDetailedSleepEndpoint = async (startDate: string, endDate: string) => {
    try {
      const ouraToken = process.env.NEXT_PUBLIC_OURA_TOKEN || 'K7YZPNFESE2ZGRETPXXYEFNAXV5473HB';
      
      // Construct the URL with proper query parameters
      const url = new URL('https://api.ouraring.com/v2/usercollection/sleep');
      url.searchParams.append('start_date', startDate);
      url.searchParams.append('end_date', endDate);
      
      console.log(`Detailed API request URL: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ouraToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      console.log(`Detailed API response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Unexpected API response format');
      }
      
      console.log(`Received ${data.data.length} detailed sleep records`);
      setDetailedData(data.data);
      
    } catch (error: any) {
      console.error('Error testing detailed sleep endpoint:', error);
      setError(`Detailed endpoint error: ${error.message}`);
    }
  };

  const testDailySleepSummaryEndpoint = async (startDate: string, endDate: string) => {
    try {
      const ouraToken = process.env.NEXT_PUBLIC_OURA_TOKEN || 'K7YZPNFESE2ZGRETPXXYEFNAXV5473HB';
      
      // Construct the URL with proper query parameters
      const url = new URL('https://api.ouraring.com/v2/usercollection/daily_sleep');
      url.searchParams.append('start_date', startDate);
      url.searchParams.append('end_date', endDate);
      
      console.log(`Summary API request URL: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ouraToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      console.log(`Summary API response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Unexpected API response format');
      }
      
      console.log(`Received ${data.data.length} summary sleep records`);
      setSummaryData(data.data);
      
    } catch (error: any) {
      console.error('Error testing daily sleep summary endpoint:', error);
      setError(`Summary endpoint error: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
        <pre className="bg-gray-800 text-white p-3 rounded overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
        <p className="mt-2">Token being used: {token.substring(0, 5)}...{token.substring(token.length - 5)}</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Testing API...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={testApi}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Detailed Sleep Data</h2>
            {detailedData.length === 0 ? (
              <p className="text-gray-500">No detailed sleep data found.</p>
            ) : (
              <div>
                <p className="mb-2">Found {detailedData.length} records</p>
                <div className="overflow-auto max-h-64 bg-gray-100 p-4 rounded">
                  <pre>{JSON.stringify(detailedData[0], null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Daily Sleep Summary</h2>
            {summaryData.length === 0 ? (
              <p className="text-gray-500">No summary sleep data found.</p>
            ) : (
              <div>
                <p className="mb-2">Found {summaryData.length} records</p>
                <div className="overflow-auto max-h-64 bg-gray-100 p-4 rounded">
                  <pre>{JSON.stringify(summaryData[0], null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={testApi}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Again
          </button>
        </div>
      )}
    </div>
  );
} 