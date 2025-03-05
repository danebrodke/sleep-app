// Debug script to test the date format and API calls with the same date format used in the app
// Run this with: node debug-app-dates.js

const fs = require('fs');
const path = require('path');

// Try to read the token from .env.local
let ouraToken;
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const tokenMatch = envContent.match(/NEXT_PUBLIC_OURA_TOKEN=([^\s]+)/);
  if (tokenMatch && tokenMatch[1]) {
    ouraToken = tokenMatch[1];
    console.log('Found token in .env.local:', ouraToken);
  }
} catch (error) {
  console.log('Could not read .env.local file:', error.message);
}

// Use command line argument if provided
if (process.argv.length > 2) {
  ouraToken = process.argv[2];
  console.log('Using token from command line argument');
}

if (!ouraToken) {
  console.error('No Oura API token found. Please provide one as a command line argument.');
  process.exit(1);
}

// Get date ranges for testing - using the EXACT same format as the app
const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(today.getMonth() - 1);

// Format dates in yyyy-MM-dd format (same as the app)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startDate = formatDate(oneMonthAgo);
const endDate = formatDate(today);

// Test both endpoints with the app's date format
async function testWithAppDateFormat() {
  console.log('=== Testing with App Date Format ===');
  console.log(`Using token: ${ouraToken.substring(0, 5)}...${ouraToken.substring(ouraToken.length - 5)}`);
  console.log(`Date range: ${startDate} to ${endDate}`);
  
  // Test the detailed sleep endpoint
  console.log('\n1. Testing detailed sleep endpoint...');
  await testDetailedSleepEndpoint();
  
  // Test the daily sleep summary endpoint
  console.log('\n2. Testing daily sleep summary endpoint...');
  await testDailySleepSummaryEndpoint();
  
  // Test with future dates (which might be what the app is using)
  console.log('\n3. Testing with future dates...');
  const futureDate = new Date();
  futureDate.setFullYear(2025);
  const futureDateStr = formatDate(futureDate);
  const pastFutureDate = new Date(futureDate);
  pastFutureDate.setMonth(pastFutureDate.getMonth() - 1);
  const pastFutureDateStr = formatDate(pastFutureDate);
  
  console.log(`Future date range: ${pastFutureDateStr} to ${futureDateStr}`);
  await testWithDateRange(pastFutureDateStr, futureDateStr);
}

// Test the detailed sleep endpoint
async function testDetailedSleepEndpoint() {
  try {
    const url = new URL('https://api.ouraring.com/v2/usercollection/sleep');
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    
    console.log(`Requesting: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ouraToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('Error response:', await response.text());
      return;
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data)) {
      console.error('Unexpected API response format:', data);
      return;
    }
    
    console.log(`Found ${data.data.length} detailed sleep records`);
    
    if (data.data.length > 0) {
      console.log('First record day:', data.data[0].day);
    }
  } catch (error) {
    console.error('Error testing detailed sleep endpoint:', error);
  }
}

// Test the daily sleep summary endpoint
async function testDailySleepSummaryEndpoint() {
  try {
    const url = new URL('https://api.ouraring.com/v2/usercollection/daily_sleep');
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    
    console.log(`Requesting: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ouraToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('Error response:', await response.text());
      return;
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data)) {
      console.error('Unexpected API response format:', data);
      return;
    }
    
    console.log(`Found ${data.data.length} daily sleep summary records`);
    
    if (data.data.length > 0) {
      console.log('First record day:', data.data[0].day);
    }
  } catch (error) {
    console.error('Error testing daily sleep summary endpoint:', error);
  }
}

// Test with specific date range
async function testWithDateRange(start, end) {
  try {
    console.log(`Testing detailed sleep endpoint with date range: ${start} to ${end}`);
    
    const url = new URL('https://api.ouraring.com/v2/usercollection/sleep');
    url.searchParams.append('start_date', start);
    url.searchParams.append('end_date', end);
    
    console.log(`Requesting: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ouraToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('Error response:', await response.text());
      return;
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data)) {
      console.error('Unexpected API response format:', data);
      return;
    }
    
    console.log(`Found ${data.data.length} detailed sleep records`);
    
    if (data.data.length > 0) {
      console.log('First record day:', data.data[0].day);
    }
  } catch (error) {
    console.error('Error testing with date range:', error);
  }
}

// Run the tests
testWithAppDateFormat().catch(error => {
  console.error('Test script error:', error);
}); 