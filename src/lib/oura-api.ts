// Updated API endpoint to use our server-side API route
// Adding more debugging to identify environment variable issues

// The server-side API routes that proxy requests to Oura API
const OURA_DETAILED_SLEEP_ROUTE = '/api/oura/sleep?type=detailed';
const OURA_DAILY_SLEEP_ROUTE = '/api/oura/sleep?type=daily';

// Use environment variable for the Oura API token
// Make sure to set this in your .env.local file or Vercel environment variables
const OURA_TOKEN = process.env.NEXT_PUBLIC_OURA_TOKEN || '';

// For debugging purposes
console.log('Environment variables loaded:', {
  NEXT_PUBLIC_OURA_TOKEN: process.env.NEXT_PUBLIC_OURA_TOKEN ? 'Set' : 'Not set',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
  NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY ? 'Set' : 'Not set'
});

// Only log a portion of the token for security
if (OURA_TOKEN) {
  console.log('Using Oura API token:', OURA_TOKEN.substring(0, 3) + '...' + OURA_TOKEN.substring(OURA_TOKEN.length - 3));
} else {
  console.log('No Oura API token found. Please set NEXT_PUBLIC_OURA_TOKEN in your environment variables.');
}

export interface OuraSleepData {
  id: string;
  day: string;
  bedtime_start: string;
  bedtime_end: string;
  latency: number;
  total_sleep_duration: number;
  awake_time: number;
  light_sleep_duration: number;
  rem_sleep_duration: number;
  deep_sleep_duration: number;
  efficiency: number;
  hypnogram_5min: string;
  hr_lowest: number;
  hr_average: number;
  temperature_delta: number;
  score: number;
  _rawData?: any; // Store the original API response for debugging
}

export interface OuraApiResponse {
  data: any[];
  next_token: string | null;
}

// Mock data for testing when API is not available
const MOCK_SLEEP_DATA: OuraSleepData[] = [
  {
    id: "mock-1",
    day: new Date().toISOString().split('T')[0],
    bedtime_start: new Date(Date.now() - 28800000).toISOString(),
    bedtime_end: new Date(Date.now() - 1800000).toISOString(),
    latency: 600,
    total_sleep_duration: 25200,
    awake_time: 1800,
    light_sleep_duration: 12600,
    rem_sleep_duration: 7200,
    deep_sleep_duration: 5400,
    efficiency: 92,
    hypnogram_5min: "4444332221111222333444332221111222333444",
    hr_lowest: 52,
    hr_average: 62,
    temperature_delta: 0.2,
    score: 85
  },
  {
    id: "mock-2",
    day: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    bedtime_start: new Date(Date.now() - 115200000).toISOString(),
    bedtime_end: new Date(Date.now() - 88200000).toISOString(),
    latency: 900,
    total_sleep_duration: 23400,
    awake_time: 2700,
    light_sleep_duration: 11700,
    rem_sleep_duration: 6300,
    deep_sleep_duration: 5400,
    efficiency: 88,
    hypnogram_5min: "4444332221111222333444332221111222333444",
    hr_lowest: 54,
    hr_average: 64,
    temperature_delta: 0.1,
    score: 78
  }
];

export async function fetchSleepData(startDate: string, endDate: string): Promise<OuraSleepData[]> {
  console.log(`Fetching sleep data from ${startDate} to ${endDate}`);
  console.log('Current token being used:', `${OURA_TOKEN.substring(0, 5)}...`);
  console.log('Environment:', process.env.NODE_ENV || 'unknown');

  try {
    // First try to fetch daily sleep summary data for scores
    console.log('Attempting to fetch daily sleep summary data first for scores...');
    const summaryData = await fetchDailySleepSummary(startDate, endDate);
    
    // Create a map of sleep scores by date from the summary data
    const sleepScoresByDate: Record<string, number> = {};
    if (summaryData && summaryData.length > 0) {
      console.log(`Found ${summaryData.length} daily sleep summary records with scores`);
      let validScoreCount = 0;
      
      summaryData.forEach(item => {
        // Ensure we're getting a valid numeric score
        const score = typeof item.score === 'number' ? item.score : parseInt(String(item.score), 10);
        
        if (!isNaN(score) && score > 0) {
          sleepScoresByDate[item.day] = score;
          validScoreCount++;
          console.log(`Stored valid score for ${item.day}: ${score}`);
        } else {
          console.warn(`Invalid or missing score for ${item.day}: ${item.score} (${typeof item.score})`);
        }
      });
      
      console.log(`Total valid scores found: ${validScoreCount} out of ${summaryData.length} records`);
      
      // If we have no valid scores, try to extract them from the raw data
      if (validScoreCount === 0) {
        console.log('No valid scores found in processed data, checking raw data...');
        // This is a fallback for production where data structure might be different
        summaryData.forEach(item => {
          // Try to access score from raw data if available
          const rawData = (item as any)._rawData || (item as any).rawData;
          if (rawData) {
            const rawScore = rawData.score || 
                            (rawData.contributors && rawData.contributors.score ? 
                             rawData.contributors.score.value : null);
            
            if (rawScore && !isNaN(rawScore)) {
              sleepScoresByDate[item.day] = rawScore;
              console.log(`Extracted score from raw data for ${item.day}: ${rawScore}`);
            }
          }
        });
      }
    }
    
    // Now fetch detailed sleep data for the detailed metrics
    console.log('Attempting to fetch detailed sleep data for metrics...');
    const detailedData = await fetchDetailedSleepData(startDate, endDate);
    
    if (detailedData && detailedData.length > 0) {
      console.log(`Found ${detailedData.length} detailed sleep records`);
      
      // Enhance detailed data with scores from summary data
      const enhancedData = detailedData.map(item => {
        if (sleepScoresByDate[item.day]) {
          console.log(`Enhancing ${item.day} with score: ${sleepScoresByDate[item.day]}`);
          return {
            ...item,
            score: sleepScoresByDate[item.day]
          };
        }
        return item;
      });
      
      // Log the final data to verify scores are present
      console.log('Final data with scores:', enhancedData.map(item => ({
        day: item.day,
        score: item.score || 'N/A'
      })));
      
      return enhancedData;
    }
    
    // If we have summary data but no detailed data, use the summary data
    if (summaryData && summaryData.length > 0) {
      console.log('No detailed sleep data found, using daily summary data');
      return summaryData;
    }
    
    console.log('No sleep data found for the selected date range');
    console.log('Date range requested:', { startDate, endDate });
    
    // If no data is found, ask if the user wants to use mock data
    const useMockData = confirm('No sleep data found. Would you like to use mock data instead?');
    if (useMockData) {
      console.log('Generating mock data...');
      return generateMockData(startDate, endDate);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    
    // If there's an error, ask if the user wants to use mock data
    const useMockData = confirm('Error fetching sleep data. Would you like to use mock data instead?');
    if (useMockData) {
      console.log('Generating mock data due to error...');
      return generateMockData(startDate, endDate);
    }
    
    throw error;
  }
}

async function fetchDetailedSleepData(startDate: string, endDate: string): Promise<OuraSleepData[]> {
  try {
    // Use our server-side API route instead of directly calling Oura API
    const url = `${OURA_DETAILED_SLEEP_ROUTE}&start_date=${startDate}&end_date=${endDate}`;
    console.log('Detailed API request URL:', url);
    console.log('Date range for detailed API:', startDate, 'to', endDate);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for production
    
    try {
      console.log(`Fetching detailed sleep data at ${new Date().toISOString()}`);
      const response = await fetch(url, {
        signal: controller.signal,
        // Add cache control headers to prevent caching issues in production
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      clearTimeout(timeoutId); // Clear the timeout if the request completes
      console.log(`Detailed sleep data response received at ${new Date().toISOString()}, status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Error response from API: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('Unexpected API response structure:', JSON.stringify(data).substring(0, 200));
        return [];
      }
      
      console.log(`Raw API returned ${data.data.length} records`);
      console.log('All days in raw API response:', data.data.map((item: any) => item.day));
      
      // Log the structure of the first record for debugging
      if (data.data.length > 0) {
        console.log('First record structure:', data.data[0]);
        
        // Log more detailed structure for debugging
        console.log('Detailed sleep data structure:');
        console.log('- id:', data.data[0].id);
        console.log('- day:', data.data[0].day);
        console.log('- bedtime_start:', data.data[0].bedtime_start);
        console.log('- bedtime_end:', data.data[0].bedtime_end);
        
        // Log all properties of the first record
        console.log('All properties of first record:');
        Object.keys(data.data[0]).forEach(key => {
          console.log(`- ${key}:`, data.data[0][key]);
        });
        
        // Check for specific sleep duration fields
        if (data.data[0].duration) {
          console.log('Found duration field:', data.data[0].duration);
        }
        if (data.data[0].total_sleep_duration) {
          console.log('Found total_sleep_duration field:', data.data[0].total_sleep_duration);
        }
        if (data.data[0].total_sleep) {
          console.log('Found total_sleep field:', data.data[0].total_sleep);
        }
        if (data.data[0].sleep_duration) {
          console.log('Found sleep_duration field:', data.data[0].sleep_duration);
        }
        
        // Check for hypnogram fields
        if (data.data[0].hypnogram) {
          console.log('Found hypnogram field:', typeof data.data[0].hypnogram, data.data[0].hypnogram);
        }
        if (data.data[0].sleep_phase_5_min) {
          console.log('Found sleep_phase_5_min field:', data.data[0].sleep_phase_5_min);
        }
      }
      
      // Map the data to our OuraSleepData interface
      return data.data.map((item: any) => {
        // Check for missing fields and log them for debugging
        const missingFields = [];
        if (!item.id) missingFields.push('id');
        if (!item.day) missingFields.push('day');
        if (!item.bedtime_start) missingFields.push('bedtime_start');
        if (!item.bedtime_end) missingFields.push('bedtime_end');
        
        if (missingFields.length > 0) {
          console.log(`Missing fields in record ${item.id || 'unknown'}: ${missingFields.join(', ')}`);
        }
        
        // Check if sleep data is nested in a 'sleep' property
        const sleepData = item.sleep || item;
        
        // Debug sleep score specifically
        console.log('Sleep score debug for item:', item.id || 'unknown');
        console.log('- Direct score:', sleepData.score);
        if (sleepData.contributors) {
          console.log('- Contributors object exists:', typeof sleepData.contributors);
          console.log('- Score in contributors:', sleepData.contributors.score?.value);
        }
        
        // Try to find the sleep score in various possible locations
        let extractedScore = 0;
        
        // Check direct score property
        if (sleepData.score !== undefined && sleepData.score !== null) {
          console.log('- Using direct score:', sleepData.score);
          extractedScore = sleepData.score;
        } 
        // Check contributors.score.value
        else if (sleepData.contributors?.score?.value !== undefined) {
          console.log('- Using contributors.score.value:', sleepData.contributors.score.value);
          extractedScore = sleepData.contributors.score.value;
        }
        // Check sleep_score property
        else if (sleepData.sleep_score !== undefined) {
          console.log('- Using sleep_score property:', sleepData.sleep_score);
          extractedScore = sleepData.sleep_score;
        }
        // Check sleep_score_delta property
        else if (sleepData.sleep_score_delta !== undefined) {
          console.log('- Using sleep_score_delta property:', sleepData.sleep_score_delta);
          extractedScore = sleepData.sleep_score_delta;
        }
        
        console.log('- Final extracted score:', extractedScore);
        
        // Create a mapped item with our expected structure
        const mappedItem: OuraSleepData = {
          id: sleepData.id || `detailed-${Math.random().toString(36).substring(2, 9)}`,
          day: sleepData.day || startDate,
          bedtime_start: sleepData.bedtime_start || new Date().toISOString(),
          bedtime_end: sleepData.bedtime_end || new Date().toISOString(),
          latency: sleepData.latency || 0,
          // Fix the field mappings for sleep durations - try all possible field names
          total_sleep_duration: sleepData.duration || sleepData.total_sleep_duration || sleepData.total_sleep || sleepData.sleep_duration || sleepData.total || 0,
          awake_time: sleepData.awake_time || sleepData.awake_duration || sleepData.awake || 0,
          light_sleep_duration: sleepData.light_sleep_duration || sleepData.light_sleep || sleepData.light || 0,
          rem_sleep_duration: sleepData.rem_sleep_duration || sleepData.rem_sleep || sleepData.rem || 0,
          deep_sleep_duration: sleepData.deep_sleep_duration || sleepData.deep_sleep || sleepData.deep || 0,
          efficiency: sleepData.efficiency || 0,
          // Try all possible hypnogram field names
          hypnogram_5min: typeof sleepData.hypnogram === 'object' && sleepData.hypnogram?.hypnogram_5min 
            ? sleepData.hypnogram.hypnogram_5min 
            : (sleepData.sleep_phase_5_min || sleepData.hypnogram_5min || '4444332221111222333444332221111222333444'),
          hr_lowest: sleepData.hr_lowest || 0,
          hr_average: sleepData.hr_average || 0,
          temperature_delta: sleepData.temperature_delta || 0,
          score: extractedScore,
          _rawData: sleepData
        };
        
        return mappedItem;
      });
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out after 15 seconds');
        throw new Error('Request timed out. The server may be experiencing issues.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching detailed sleep data:', error);
    throw error;
  }
}

async function fetchDailySleepSummary(startDate: string, endDate: string): Promise<OuraSleepData[]> {
  try {
    // Use our server-side API route instead of directly calling Oura API
    const url = `${OURA_DAILY_SLEEP_ROUTE}&start_date=${startDate}&end_date=${endDate}`;
    console.log('Summary API request URL:', url);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for production
    
    try {
      console.log(`Fetching daily sleep summary at ${new Date().toISOString()}`);
      const response = await fetch(url, {
        signal: controller.signal,
        // Add cache control headers to prevent caching issues in production
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      clearTimeout(timeoutId); // Clear the timeout if the request completes
      console.log(`Daily sleep summary response received at ${new Date().toISOString()}, status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Error response from API: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('Unexpected API response structure:', JSON.stringify(data).substring(0, 200));
        return [];
      }
      
      // Log the structure of the first record for debugging
      if (data.data.length > 0) {
        const firstRecord = data.data[0];
        console.log('First daily sleep summary record structure:', JSON.stringify(firstRecord, null, 2));
        
        // Check for score in different possible locations
        console.log('Score directly on record:', firstRecord.score);
        console.log('Score type:', typeof firstRecord.score);
        
        if (firstRecord.contributors && firstRecord.contributors.score) {
          console.log('Score in contributors:', firstRecord.contributors.score.value);
        }
        
        // Log all top-level keys to help identify where the score might be
        console.log('Top-level keys in first record:', Object.keys(firstRecord));
      }
      
      // Map the data to our OuraSleepData interface
      return data.data.map((item: any) => {
        // Check if sleep data is nested in a 'sleep' property
        const sleepData = item.sleep || item;
        
        // Try to extract the score from various possible locations
        let extractedScore = 0;
        
        // Direct score property (most common)
        if (sleepData.score !== undefined && sleepData.score !== null) {
          const scoreValue = typeof sleepData.score === 'number' ? 
                            sleepData.score : 
                            parseInt(String(sleepData.score), 10);
          
          if (!isNaN(scoreValue)) {
            extractedScore = scoreValue;
            console.log(`Using direct score for ${sleepData.day}: ${extractedScore}`);
          }
        } 
        // Score in contributors object
        else if (sleepData.contributors && sleepData.contributors.score && 
                sleepData.contributors.score.value !== undefined) {
          extractedScore = sleepData.contributors.score.value;
          console.log(`Using contributors.score.value for ${sleepData.day}: ${extractedScore}`);
        }
        
        // Store the raw data for potential fallback use
        const rawData = sleepData;
        
        // Create a mapped item with our expected structure
        const mappedItem: OuraSleepData = {
          id: sleepData.id || `summary-${Math.random().toString(36).substring(2, 9)}`,
          day: sleepData.day || startDate,
          bedtime_start: sleepData.bedtime_start || new Date().toISOString(),
          bedtime_end: sleepData.bedtime_end || new Date().toISOString(),
          // Fix the field mappings for sleep durations - try all possible field names
          latency: sleepData.sleep_latency || sleepData.latency || sleepData.contributors?.latency?.value || 0,
          total_sleep_duration: sleepData.duration || sleepData.total_sleep_duration || sleepData.total_sleep || sleepData.sleep_duration || sleepData.contributors?.total_sleep?.value || 0,
          awake_time: sleepData.awake_time || sleepData.awake_duration || sleepData.awake || sleepData.contributors?.awake_time?.value || 0,
          light_sleep_duration: sleepData.light_sleep_duration || sleepData.light_sleep || sleepData.light || sleepData.contributors?.light_sleep?.value || 0,
          rem_sleep_duration: sleepData.rem_sleep_duration || sleepData.rem_sleep || sleepData.rem || sleepData.contributors?.rem_sleep?.value || 0,
          deep_sleep_duration: sleepData.deep_sleep_duration || sleepData.deep_sleep || sleepData.deep || sleepData.contributors?.deep_sleep?.value || 0,
          efficiency: sleepData.efficiency || sleepData.contributors?.efficiency?.value || 0,
          // Try all possible hypnogram field names
          hypnogram_5min: typeof sleepData.hypnogram === 'object' && sleepData.hypnogram?.hypnogram_5min 
            ? sleepData.hypnogram.hypnogram_5min 
            : (sleepData.sleep_phase_5_min || sleepData.hypnogram_5min || '4444332221111222333444332221111222333444'),
          hr_lowest: sleepData.hr_lowest || sleepData.contributors?.restfulness?.hr_lowest || 0,
          hr_average: sleepData.hr_average || sleepData.contributors?.restfulness?.hr_average || 0,
          temperature_delta: sleepData.temperature_delta || sleepData.contributors?.temperature?.value || 0,
          // Use the extracted score
          score: extractedScore,
          // Add raw data for potential fallback use
          _rawData: rawData
        } as OuraSleepData & { _rawData?: any };
        
        return mappedItem;
      });
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out after 15 seconds');
        throw new Error('Request timed out. The server may be experiencing issues.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching sleep summary data:', error);
    throw error;
  }
}

// Generate mock data for a date range
export function generateMockData(startDate: string, endDate: string): OuraSleepData[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    
    return {
      ...MOCK_SLEEP_DATA[0],
      id: `mock-${i}`,
      day: day.toISOString().split('T')[0],
      bedtime_start: new Date(day.getTime() - 28800000).toISOString(),
      bedtime_end: new Date(day.getTime() - 1800000).toISOString(),
      score: Math.floor(70 + Math.random() * 30),
      efficiency: Math.floor(80 + Math.random() * 20),
      deep_sleep_duration: 4000 + Math.floor(Math.random() * 3000),
      rem_sleep_duration: 5000 + Math.floor(Math.random() * 4000),
      light_sleep_duration: 10000 + Math.floor(Math.random() * 5000),
    };
  });
}

export function parseHypnogram(hypnogram: string): number[] {
  // If hypnogram is empty or undefined, return a default pattern
  if (!hypnogram) {
    return [4,4,4,4,3,3,2,2,2,1,1,1,1,2,2,2,3,3,3,4,4,4,3,3,2,2,2,1,1,1,1,2,2,2,3,3,3,4,4,4];
  }
  
  // Hypnogram is a string of characters where:
  // 1 = deep sleep, 2 = light sleep, 3 = REM sleep, 4 = awake
  try {
    // Check if hypnogram is a JSON string and parse it
    if (hypnogram.startsWith('[') && hypnogram.endsWith(']')) {
      try {
        const parsed = JSON.parse(hypnogram);
        if (Array.isArray(parsed)) {
          return parsed.map(Number);
        }
      } catch (e) {
        console.error('Failed to parse JSON hypnogram:', e);
      }
    }
    
    // Handle comma-separated values
    if (hypnogram.includes(',')) {
      return hypnogram.split(',').map(Number);
    }
    
    // Default case: treat as a string of digits
    return hypnogram.split('').map(Number);
  } catch (error) {
    console.error('Error parsing hypnogram:', error);
    return [4,4,4,4,3,3,2,2,2,1,1,1,1,2,2,2,3,3,3,4,4,4,3,3,2,2,2,1,1,1,1,2,2,2,3,3,3,4,4,4];
  }
} 