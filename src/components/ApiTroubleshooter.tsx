'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ApiTroubleshooterProps {
  onClose: () => void;
  onUseMockData: () => void;
}

export default function ApiTroubleshooter({ onClose, onUseMockData }: ApiTroubleshooterProps) {
  const [step, setStep] = useState(1);
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const testApiConnection = async () => {
    setTestingApi(true);
    setApiStatus('untested');
    setErrorDetails(null);
    
    try {
      // Test the API connection with a simple request
      const response = await fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OURA_TOKEN || 'DU4NWDX66XRZN2WY4DCXFN4UD3HGLKKH'}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        setApiStatus('success');
      } else {
        setApiStatus('error');
        setErrorDetails(`Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setApiStatus('error');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>API Connection Troubleshooter</CardTitle>
        <CardDescription>
          Let's troubleshoot your connection to the Oura API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Check API Connection</h3>
            <p>First, let's test your connection to the Oura API.</p>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={testApiConnection} 
                disabled={testingApi}
              >
                {testingApi ? 'Testing...' : 'Test Connection'}
              </Button>
              
              {apiStatus === 'success' && (
                <span className="text-green-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Connection successful!
                </span>
              )}
              
              {apiStatus === 'error' && (
                <span className="text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Connection failed
                </span>
              )}
            </div>
            
            {apiStatus === 'error' && errorDetails && (
              <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800 text-sm">
                <p className="font-medium">Error details:</p>
                <p>{errorDetails}</p>
              </div>
            )}
            
            {apiStatus === 'error' && (
              <div className="space-y-2">
                <h4 className="font-medium">Fixing the "Load failed" error:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Generate a new API token:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Go to <a href="https://cloud.ouraring.com/personal-access-tokens" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Oura Cloud Personal Access Tokens</a></li>
                      <li>Sign in with your Oura account</li>
                      <li>Click "Create New Personal Access Token"</li>
                      <li>Select the scopes: daily, personal, session</li>
                      <li>Give it a name (e.g., "Sleep Tracker App")</li>
                      <li>Copy the newly generated token</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Update your code:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Open <code className="bg-gray-100 px-1 py-0.5 rounded">src/lib/oura-api.ts</code> in your code editor</li>
                      <li>Replace the value of <code className="bg-gray-100 px-1 py-0.5 rounded">OURA_TOKEN</code> with your new token</li>
                      <li>Save the file and restart the development server</li>
                    </ul>
                  </li>
                </ol>
              </div>
            )}
            
            {apiStatus === 'success' && (
              <div className="bg-green-50 p-3 rounded border border-green-200 text-green-800 text-sm">
                <p>Your API connection is working correctly. If you're still seeing mock data, there might be an issue with the specific endpoint or parameters.</p>
                <button 
                  onClick={() => setStep(2)}
                  className="text-green-700 underline mt-2"
                >
                  Continue to next step
                </button>
              </div>
            )}
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 2: Check API Permissions</h3>
            <p>Make sure your API token has the correct permissions to access sleep data.</p>
            
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-blue-800 text-sm">
              <p className="font-medium">How to check your API token permissions:</p>
              <ol className="list-decimal pl-5 space-y-1 mt-2">
                <li>Go to <a href="https://cloud.ouraring.com/personal-access-tokens" target="_blank" rel="noopener noreferrer" className="underline">Oura Cloud Personal Access Tokens</a></li>
                <li>Find your token in the list</li>
                <li>Verify that it has the "daily" scope enabled</li>
                <li>If not, create a new token with the correct permissions</li>
              </ol>
            </div>
            
            <button 
              onClick={() => setStep(3)}
              className="text-blue-700 underline"
            >
              Continue to next step
            </button>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 3: Check for Data Availability</h3>
            <p>Make sure your Oura Ring has synced recently and has data for the selected date range.</p>
            
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-blue-800 text-sm">
              <p className="font-medium">How to ensure your data is available:</p>
              <ol className="list-decimal pl-5 space-y-1 mt-2">
                <li>Open the Oura app on your phone</li>
                <li>Make sure your ring is synced (pull down to sync)</li>
                <li>Check that sleep data appears in the app for the dates you're trying to view</li>
                <li>Try selecting a different date range in the Sleep Tracker app</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onUseMockData}>
          Use Mock Data Instead
        </Button>
      </CardFooter>
    </Card>
  );
} 