import { NextResponse } from 'next/server';

// The Oura API endpoints
const OURA_DETAILED_SLEEP_URL = 'https://api.ouraring.com/v2/usercollection/sleep';
const OURA_DAILY_SLEEP_URL = 'https://api.ouraring.com/v2/usercollection/daily_sleep';

// Get the token from environment variables
const getOuraToken = () => {
  const token = process.env.NEXT_PUBLIC_OURA_TOKEN || '';
  console.log('[Server] Using Oura token:', token ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : 'Not set');
  return token;
};

export async function GET(request: Request) {
  console.log('[Server] API route called:', request.url);
  
  // Get query parameters from the request URL
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const type = searchParams.get('type') || 'detailed'; // 'detailed' or 'daily'
  
  console.log('[Server] Query parameters:', { startDate, endDate, type });
  console.log('[Server] Date range spans:', 
    startDate ? new Date(startDate).toISOString() : 'invalid', 
    'to', 
    endDate ? new Date(endDate).toISOString() : 'invalid'
  );
  
  // Validate required parameters
  if (!startDate || !endDate) {
    console.log('[Server] Missing required parameters');
    return NextResponse.json(
      { error: 'Missing required parameters: start_date and end_date' },
      { status: 400 }
    );
  }

  // Get the Oura token
  const token = getOuraToken();
  if (!token) {
    console.log('[Server] Oura API token not configured');
    return NextResponse.json(
      { error: 'Oura API token not configured' },
      { status: 500 }
    );
  }

  try {
    // Determine which API endpoint to use
    const apiUrl = type === 'daily' 
      ? OURA_DAILY_SLEEP_URL 
      : OURA_DETAILED_SLEEP_URL;
    
    // Construct the full URL with query parameters
    const url = `${apiUrl}?start_date=${startDate}&end_date=${endDate}`;
    
    console.log(`[Server] Fetching from Oura API: ${url}`);
    
    // Make the request to the Oura API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // This ensures the request is made server-side
      cache: 'no-store',
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Server] Oura API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Server] Error details: ${errorText}`);
      
      return NextResponse.json(
        { 
          error: `Oura API returned ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    // Parse the response data
    const data = await response.json();
    console.log(`[Server] Successfully fetched Oura data, found ${data.data?.length || 0} records`);
    
    // Add detailed logging for debugging the sleep score
    if (data.data && data.data.length > 0) {
      const firstRecord = data.data[0];
      console.log('[Server] First record structure:', JSON.stringify(firstRecord, null, 2));
      
      // Check for sleep score in different locations
      console.log('[Server] Sleep score direct:', firstRecord.score);
      
      if (firstRecord.contributors) {
        console.log('[Server] Sleep score in contributors:', firstRecord.contributors.score?.value);
      }
      
      // Log all top-level keys
      console.log('[Server] Top-level keys:', Object.keys(firstRecord));
    }
    
    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Server] Error fetching from Oura API:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch data from Oura API', details: String(error) },
      { status: 500 }
    );
  }
} 