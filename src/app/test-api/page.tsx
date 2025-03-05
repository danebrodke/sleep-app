'use client';

import { useState, useEffect } from 'react';

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const testDetailedApi = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Get current date and 7 days ago
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      // Format dates
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      
      console.log(`Testing detailed API with date range: ${formattedStartDate} to ${formattedEndDate}`);
      
      // Call our server-side API route
      const url = `/api/oura/sleep?type=detailed&start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
      console.log(`Requesting: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API Response:', data);
      setResponse(data);
    } catch (error) {
      console.error('Error testing API:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testDailyApi = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Get current date and 7 days ago
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      // Format dates
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      
      console.log(`Testing daily API with date range: ${formattedStartDate} to ${formattedEndDate}`);
      
      // Call our server-side API route
      const url = `/api/oura/sleep?type=daily&start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
      console.log(`Requesting: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API Response:', data);
      setResponse(data);
    } catch (error) {
      console.error('Error testing API:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date as YYYY-MM-DD
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={testDetailedApi}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Test Detailed API
        </button>
        
        <button
          onClick={testDailyApi}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          Test Daily API
        </button>
      </div>
      
      {loading && <p className="text-gray-600">Loading...</p>}
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          {error}
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">API Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 